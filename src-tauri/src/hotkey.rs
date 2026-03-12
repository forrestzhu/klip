use std::{str::FromStr, sync::Mutex};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime, State};
use tauri_plugin_global_shortcut::{
    Error as GlobalShortcutError, GlobalShortcutExt, Shortcut, ShortcutState,
};
use thiserror::Error;

use crate::tray;

pub const DEFAULT_PANEL_HOTKEY: &str = "CommandOrControl+Shift+V";
pub const SNIPPET_ALIAS_TRIGGER_EVENT: &str = "klip://snippet-alias-hotkey-triggered";

#[derive(Debug, Clone)]
struct ActiveShortcutBinding {
    shortcut: String,
    id: u32,
}

#[derive(Default)]
pub struct PanelHotkeyState {
    active_shortcut: Mutex<Option<ActiveShortcutBinding>>,
}

impl PanelHotkeyState {
    /// Get the current active shortcut string
    pub fn get_active_shortcut(&self) -> Option<String> {
        self.active_shortcut
            .lock()
            .ok()
            .and_then(|guard| guard.as_ref().map(|s| s.shortcut.clone()))
    }
}

#[derive(Default)]
pub struct SnippetAliasHotkeyState {
    active_shortcut: Mutex<Option<ActiveShortcutBinding>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterHotkeyResponse {
    pub shortcut: String,
}

#[derive(Debug, Error)]
enum HotkeyError {
    #[error("Shortcut cannot be empty. Use a format like CommandOrControl+Shift+V.")]
    EmptyShortcut,
    #[error("Shortcut format is invalid. Use a format like CommandOrControl+Shift+V.")]
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
) -> Result<RegisterHotkeyResponse, String> {
    apply_required_hotkey(&app, &state.active_shortcut, &shortcut)
        .map(|shortcut| RegisterHotkeyResponse { shortcut })
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn register_snippet_alias_hotkey<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, SnippetAliasHotkeyState>,
    shortcut: String,
) -> Result<RegisterHotkeyResponse, String> {
    apply_optional_hotkey(&app, &state.active_shortcut, &shortcut)
        .map(|shortcut| RegisterHotkeyResponse { shortcut })
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn hide_panel_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    tray::hide_main_window(&app).map_err(|error| error.to_string())
}

pub fn register_default_panel_hotkey<R: Runtime>(app: &AppHandle<R>) -> Result<String, String> {
    let state = app.state::<PanelHotkeyState>();
    apply_required_hotkey(app, &state.active_shortcut, DEFAULT_PANEL_HOTKEY)
        .map_err(|error| error.to_string())
}

pub fn handle_global_shortcut_event<R: Runtime>(
    app: &AppHandle<R>,
    shortcut: &Shortcut,
    state: ShortcutState,
) {
    if state != ShortcutState::Pressed {
        return;
    }

    let shortcut_id = shortcut.id();
    let snippet_alias_state = app.state::<SnippetAliasHotkeyState>();
    if matches_shortcut_id(&snippet_alias_state.active_shortcut, shortcut_id) {
        let _ = tray::show_main_window(app);
        let _ = app.emit_to(tray::MAIN_WINDOW_LABEL, SNIPPET_ALIAS_TRIGGER_EVENT, ());
        return;
    }

    let panel_state = app.state::<PanelHotkeyState>();
    if matches_shortcut_id(&panel_state.active_shortcut, shortcut_id) {
        let _ = tray::show_main_window(app);
    }
}

fn apply_required_hotkey<R: Runtime>(
    app: &AppHandle<R>,
    active_shortcut: &Mutex<Option<ActiveShortcutBinding>>,
    raw_shortcut: &str,
) -> Result<String, HotkeyError> {
    let normalized_shortcut = normalize_shortcut(raw_shortcut)?;
    apply_hotkey_binding(app, active_shortcut, normalized_shortcut)
}

fn apply_optional_hotkey<R: Runtime>(
    app: &AppHandle<R>,
    active_shortcut: &Mutex<Option<ActiveShortcutBinding>>,
    raw_shortcut: &str,
) -> Result<String, HotkeyError> {
    if raw_shortcut.trim().is_empty() {
        clear_hotkey_binding(app, active_shortcut)?;
        return Ok(String::new());
    }

    let normalized_shortcut = normalize_shortcut(raw_shortcut)?;
    apply_hotkey_binding(app, active_shortcut, normalized_shortcut)
}

fn apply_hotkey_binding<R: Runtime>(
    app: &AppHandle<R>,
    active_shortcut: &Mutex<Option<ActiveShortcutBinding>>,
    next_shortcut: ActiveShortcutBinding,
) -> Result<String, HotkeyError> {
    let mut active_shortcut_guard = active_shortcut.lock().expect("hotkey mutex poisoned");
    if active_shortcut_guard
        .as_ref()
        .is_some_and(|current| current.id == next_shortcut.id)
    {
        return Ok(next_shortcut.shortcut);
    }

    let previous_shortcut = active_shortcut_guard.clone();
    if let Some(previous_shortcut_value) = previous_shortcut.as_ref() {
        let unregister_result = app
            .global_shortcut()
            .unregister(previous_shortcut_value.shortcut.as_str());
        if let Err(error) = unregister_result {
            if !is_unregister_missing_binding_error(&error) {
                return Err(HotkeyError::ClearPrevious(error.to_string()));
            }
        }
    }

    let register_result = app
        .global_shortcut()
        .register(next_shortcut.shortcut.as_str());
    if let Err(error) = register_result {
        if let Some(previous_shortcut_value) = previous_shortcut.as_ref() {
            let _ = app
                .global_shortcut()
                .register(previous_shortcut_value.shortcut.as_str());
        }
        return Err(map_registration_error(&next_shortcut.shortcut, error));
    }

    *active_shortcut_guard = Some(next_shortcut.clone());
    Ok(next_shortcut.shortcut)
}

fn clear_hotkey_binding<R: Runtime>(
    app: &AppHandle<R>,
    active_shortcut: &Mutex<Option<ActiveShortcutBinding>>,
) -> Result<(), HotkeyError> {
    let mut active_shortcut_guard = active_shortcut.lock().expect("hotkey mutex poisoned");
    let Some(current_shortcut) = active_shortcut_guard.take() else {
        return Ok(());
    };

    let unregister_result = app
        .global_shortcut()
        .unregister(current_shortcut.shortcut.as_str());
    if let Err(error) = unregister_result {
        if !is_unregister_missing_binding_error(&error) {
            *active_shortcut_guard = Some(current_shortcut);
            return Err(HotkeyError::ClearPrevious(error.to_string()));
        }
    }

    Ok(())
}

fn normalize_shortcut(value: &str) -> Result<ActiveShortcutBinding, HotkeyError> {
    let normalized = value
        .split('+')
        .map(str::trim)
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
        .join("+");

    if normalized.is_empty() {
        return Err(HotkeyError::EmptyShortcut);
    }

    let parsed = Shortcut::from_str(&normalized).map_err(|_| HotkeyError::InvalidShortcut)?;
    Ok(ActiveShortcutBinding {
        id: parsed.id(),
        shortcut: parsed.into_string(),
    })
}

fn map_registration_error(shortcut: &str, error: GlobalShortcutError) -> HotkeyError {
    let message = error.to_string();
    if is_conflict_error_message(&message) {
        return HotkeyError::Conflict {
            shortcut: shortcut.to_string(),
        };
    }

    HotkeyError::RegisterFailed(message)
}

fn matches_shortcut_id(
    active_shortcut: &Mutex<Option<ActiveShortcutBinding>>,
    shortcut_id: u32,
) -> bool {
    let active_shortcut_guard = active_shortcut.lock().expect("hotkey mutex poisoned");
    active_shortcut_guard
        .as_ref()
        .is_some_and(|shortcut| shortcut.id == shortcut_id)
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
    use super::{is_conflict_error_message, normalize_shortcut, HotkeyError};

    #[test]
    fn normalize_shortcut_trims_whitespace_between_segments() {
        let normalized = normalize_shortcut("  commandorcontrol + shift + k ")
            .expect("normalize hotkey")
            .shortcut;
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
        assert!(matches!(result, Err(HotkeyError::EmptyShortcut)));
    }

    #[test]
    fn normalize_shortcut_rejects_invalid_values() {
        let result = normalize_shortcut("Control+Shift+UnknownKey");
        assert!(matches!(result, Err(HotkeyError::InvalidShortcut)));
    }

    #[test]
    fn conflict_message_detection_covers_common_cases() {
        assert!(is_conflict_error_message(
            "Hotkey already registered by another process"
        ));
        assert!(is_conflict_error_message("this shortcut is already in use"));
        assert!(!is_conflict_error_message("failed to parse shortcut"));
    }
}
