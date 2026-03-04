use std::{str::FromStr, sync::Mutex};

use serde::Serialize;
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_global_shortcut::{Error as GlobalShortcutError, GlobalShortcutExt, Shortcut};
use thiserror::Error;

use crate::tray;

pub const DEFAULT_PANEL_HOTKEY: &str = "CommandOrControl+Shift+K";

#[derive(Default)]
pub struct PanelHotkeyState {
    active_shortcut: Mutex<Option<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterPanelHotkeyResponse {
    pub shortcut: String,
}

#[derive(Debug, Error)]
enum PanelHotkeyError {
    #[error("Shortcut cannot be empty. Use a format like CommandOrControl+Shift+K.")]
    EmptyShortcut,
    #[error("Shortcut format is invalid. Use a format like CommandOrControl+Shift+K.")]
    InvalidShortcut,
    #[error("Shortcut conflict: \"{shortcut}\" is already in use. Choose a different shortcut.")]
    Conflict { shortcut: String },
    #[error("Failed to clear previous shortcut binding: {0}")]
    ClearPrevious(String),
    #[error("Failed to register shortcut: {0}")]
    RegisterFailed(String),
}

#[tauri::command]
pub fn register_panel_hotkey<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, PanelHotkeyState>,
    shortcut: String,
) -> Result<RegisterPanelHotkeyResponse, String> {
    apply_panel_hotkey(&app, state.inner(), &shortcut)
        .map(|shortcut| RegisterPanelHotkeyResponse { shortcut })
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn hide_panel_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    tray::hide_main_window(&app).map_err(|error| error.to_string())
}

pub fn register_default_panel_hotkey<R: Runtime>(app: &AppHandle<R>) -> Result<String, String> {
    let state = app.state::<PanelHotkeyState>();
    apply_panel_hotkey(app, state.inner(), DEFAULT_PANEL_HOTKEY).map_err(|error| error.to_string())
}

fn apply_panel_hotkey<R: Runtime>(
    app: &AppHandle<R>,
    state: &PanelHotkeyState,
    raw_shortcut: &str,
) -> Result<String, PanelHotkeyError> {
    let normalized_shortcut = normalize_shortcut(raw_shortcut)?;

    let mut active_shortcut = state
        .active_shortcut
        .lock()
        .expect("panel hotkey mutex poisoned");
    if active_shortcut.as_deref() == Some(normalized_shortcut.as_str()) {
        return Ok(normalized_shortcut);
    }

    let previous_shortcut = active_shortcut.clone();
    if let Some(previous_shortcut_value) = previous_shortcut.as_deref() {
        let unregister_result = app.global_shortcut().unregister(previous_shortcut_value);
        if let Err(error) = unregister_result {
            if !is_unregister_missing_binding_error(&error) {
                return Err(PanelHotkeyError::ClearPrevious(error.to_string()));
            }
        }
    }

    let register_result = app.global_shortcut().register(normalized_shortcut.as_str());
    if let Err(error) = register_result {
        if let Some(previous_shortcut_value) = previous_shortcut.as_deref() {
            let _ = app.global_shortcut().register(previous_shortcut_value);
        }
        return Err(map_registration_error(&normalized_shortcut, error));
    }

    *active_shortcut = Some(normalized_shortcut.clone());
    Ok(normalized_shortcut)
}

fn normalize_shortcut(value: &str) -> Result<String, PanelHotkeyError> {
    let normalized = value
        .split('+')
        .map(str::trim)
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
        .join("+");

    if normalized.is_empty() {
        return Err(PanelHotkeyError::EmptyShortcut);
    }

    let parsed = Shortcut::from_str(&normalized).map_err(|_| PanelHotkeyError::InvalidShortcut)?;
    Ok(parsed.into_string())
}

fn map_registration_error(shortcut: &str, error: GlobalShortcutError) -> PanelHotkeyError {
    let message = error.to_string();
    if is_conflict_error_message(&message) {
        return PanelHotkeyError::Conflict {
            shortcut: shortcut.to_string(),
        };
    }

    PanelHotkeyError::RegisterFailed(message)
}

fn is_conflict_error_message(message: &str) -> bool {
    let normalized = message.to_lowercase();
    normalized.contains("already registered")
        || normalized.contains("already in use")
        || normalized.contains("already used")
        || normalized.contains("in use by")
}

fn is_unregister_missing_binding_error(error: &GlobalShortcutError) -> bool {
    let message = error.to_string().to_lowercase();
    message.contains("not registered") || message.contains("not found")
}

#[cfg(test)]
mod tests {
    use super::{is_conflict_error_message, normalize_shortcut, PanelHotkeyError};

    #[test]
    fn normalize_shortcut_trims_whitespace_between_segments() {
        let normalized =
            normalize_shortcut("  commandorcontrol + shift + k ").expect("normalize hotkey");
        let normalized_lower = normalized.to_lowercase();
        assert!(!normalized.contains(' '));
        assert!(normalized_lower.contains("shift"));
        assert!(
            normalized_lower.contains("control")
                || normalized_lower.contains("ctrl")
                || normalized_lower.contains("super")
        );
        assert!(
            normalized_lower.ends_with("+k")
                || normalized_lower.contains("keyk")
                || normalized_lower.ends_with("+keyk")
        );
    }

    #[test]
    fn normalize_shortcut_rejects_empty_values() {
        let result = normalize_shortcut("   +   ");
        assert!(matches!(result, Err(PanelHotkeyError::EmptyShortcut)));
    }

    #[test]
    fn normalize_shortcut_rejects_invalid_values() {
        let result = normalize_shortcut("Control+Shift+UnknownKey");
        assert!(matches!(result, Err(PanelHotkeyError::InvalidShortcut)));
    }

    #[test]
    fn conflict_message_detection_covers_common_cases() {
        assert!(is_conflict_error_message("Hotkey already registered by another process"));
        assert!(is_conflict_error_message("this shortcut is already in use"));
        assert!(!is_conflict_error_message("failed to parse shortcut"));
    }
}
