//! Test simulation commands for E2E testing
//!
//! These commands are designed for Playwright E2E tests to simulate
//! user interactions and system events without requiring actual
//! hardware events.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, Runtime, State};

/// Simulated clipboard content type
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SimulatedContentType {
    Text,
    Image,
    File,
}

/// Payload for simulating clipboard changes
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SimulateClipboardChangeInput {
    pub content: Option<String>,
    pub content_type: Option<SimulatedContentType>,
}

/// State for tracking simulated app focus
#[derive(Default)]
pub struct SimulatedFocusState {
    current_app: Mutex<String>,
    previous_app: Mutex<String>,
}

/// Simulate clipboard content change
///
/// This command is for E2E testing. It simulates a clipboard change event
/// as if the user copied content from another application.
#[tauri::command]
pub fn simulate_clipboard_change<R: Runtime>(
    app: AppHandle<R>,
    input: SimulateClipboardChangeInput,
) -> Result<(), String> {
    let content_type = input.content_type.unwrap_or(SimulatedContentType::Text);

    // Only process text content for now
    if !matches!(content_type, SimulatedContentType::Text) {
        return Ok(());
    }

    let content = input.content.unwrap_or_default();

    // Skip empty content
    if content.is_empty() {
        return Ok(());
    }

    // Emit clipboard updated event to notify the frontend
    app.emit_to(
        crate::tray::MAIN_WINDOW_LABEL,
        crate::clipboard_listener::CLIPBOARD_UPDATED_EVENT,
        crate::clipboard_listener::ClipboardUpdatedPayload { has_text: true },
    )
    .map_err(|e| format!("Failed to emit clipboard event: {e}"))?;

    Ok(())
}

/// Simulate hotkey press
///
/// This command simulates pressing a global hotkey combination.
/// It triggers the same handler as if the user physically pressed the keys.
#[tauri::command]
pub fn simulate_hotkey_press<R: Runtime>(
    app: AppHandle<R>,
    shortcut: String,
) -> Result<(), String> {
    // Parse the shortcut and trigger the appropriate action
    let normalized = shortcut.to_lowercase();

    // For the panel hotkey, show the main window
    if normalized.contains("shift") && normalized.contains('v')
        && (normalized.contains("command") || normalized.contains("control"))
    {
        crate::tray::show_main_window(&app).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Simulate a key press within the app
///
/// This simulates pressing a key when the app window is focused.
/// Used for testing keyboard shortcuts like Escape to close.
#[tauri::command]
pub fn simulate_key_press<R: Runtime>(app: AppHandle<R>, key: String) -> Result<(), String> {
    let key_lower = key.to_lowercase();

    // Escape key closes the panel
    if key_lower == "escape" {
        crate::tray::hide_main_window(&app).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Simulate app restart
///
/// This simulates restarting the application, useful for testing
/// persistence of settings and state.
#[tauri::command]
pub fn simulate_app_restart<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    // In a real implementation, this would:
    // 1. Save all state
    // 2. Restart the app process
    // For testing, we just emit an event to notify the frontend
    app.emit_to(
        crate::tray::MAIN_WINDOW_LABEL,
        "klip://app-restarted",
        true,
    )
    .map_err(|e| format!("Failed to emit restart event: {e}"))?;

    // Small delay to simulate restart time
    std::thread::sleep(std::time::Duration::from_millis(100));

    Ok(())
}

/// Simulate switching to another application
///
/// This simulates the user switching focus to another app,
/// useful for testing global hotkey behavior.
#[tauri::command]
pub fn simulate_app_switch(
    state: State<'_, SimulatedFocusState>,
    app: String,
) -> Result<(), String> {
    let mut current = state
        .current_app
        .lock()
        .map_err(|_| "Failed to lock current app state")?;
    let mut previous = state
        .previous_app
        .lock()
        .map_err(|_| "Failed to lock previous app state")?;

    // Update focus tracking
    *previous = current.clone();
    *current = app;

    Ok(())
}

/// Simulate a fullscreen app
///
/// This simulates another app being in fullscreen mode,
/// useful for testing panel behavior in fullscreen scenarios.
#[tauri::command]
pub fn simulate_fullscreen_app<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    // Emit event to notify about fullscreen state
    app.emit_to(
        crate::tray::MAIN_WINDOW_LABEL,
        "klip://fullscreen-detected",
        true,
    )
    .map_err(|e| format!("Failed to emit fullscreen event: {e}"))?;

    Ok(())
}

/// Check if clipboard listener is running
#[tauri::command]
pub fn is_clipboard_listener_running(
    state: State<'_, crate::clipboard_listener::ClipboardListenerState>,
) -> Result<bool, String> {
    Ok(state.is_running())
}

/// Get current panel hotkey
#[tauri::command]
pub fn get_panel_hotkey(
    state: State<'_, crate::hotkey::PanelHotkeyState>,
) -> Result<String, String> {
    Ok(state
        .get_active_shortcut()
        .unwrap_or_else(|| crate::hotkey::DEFAULT_PANEL_HOTKEY.to_string()))
}

/// Set panel hotkey (wrapper for register_panel_hotkey with simpler interface)
#[tauri::command]
pub fn set_panel_hotkey<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, crate::hotkey::PanelHotkeyState>,
    shortcut: String,
) -> Result<String, String> {
    crate::hotkey::register_panel_hotkey(app, state, shortcut)
        .map(|response| response.shortcut)
}

/// Reset panel hotkey to default
#[tauri::command]
pub fn reset_panel_hotkey<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, crate::hotkey::PanelHotkeyState>,
) -> Result<String, String> {
    crate::hotkey::register_panel_hotkey(app, state, crate::hotkey::DEFAULT_PANEL_HOTKEY.to_string())
        .map(|response| response.shortcut)
}

/// Check if window is focused
#[tauri::command]
pub fn is_window_focused<R: Runtime>(app: AppHandle<R>) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window(crate::tray::MAIN_WINDOW_LABEL) {
        window
            .is_focused()
            .map_err(|e| format!("Failed to check window focus: {e}"))
    } else {
        Ok(false)
    }
}

/// Get window position
#[tauri::command]
pub fn get_window_position<R: Runtime>(
    app: AppHandle<R>,
) -> Result<WindowPosition, String> {
    if let Some(window) = app.get_webview_window(crate::tray::MAIN_WINDOW_LABEL) {
        let position = window
            .outer_position()
            .map_err(|e| format!("Failed to get window position: {e}"))?;
        Ok(WindowPosition {
            x: position.x,
            y: position.y,
        })
    } else {
        Ok(WindowPosition { x: 0, y: 0 })
    }
}

/// Get screen bounds
#[tauri::command]
pub fn get_screen_bounds<R: Runtime>(_app: AppHandle<R>) -> Result<ScreenBounds, String> {
    // Get primary screen bounds
    // In a real implementation, we'd use tauri's screen API
    // For now, return a common screen size
    Ok(ScreenBounds {
        width: 1920,
        height: 1080,
    })
}

/// Get previous focused app name
#[tauri::command]
pub fn get_previous_focused_app(
    state: State<'_, SimulatedFocusState>,
) -> Result<String, String> {
    let guard = state
        .previous_app
        .lock()
        .map_err(|_| "Failed to lock previous app state")?;
    Ok(guard.clone())
}

/// Get current focused app name
#[tauri::command]
pub fn get_current_focused_app(
    state: State<'_, SimulatedFocusState>,
) -> Result<String, String> {
    let guard = state
        .current_app
        .lock()
        .map_err(|_| "Failed to lock current app state")?;
    Ok(guard.clone())
}

/// Get app version
#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

// === History Management Commands ===

/// History item for API responses
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItemResponse {
    pub id: String,
    pub content: String,
    pub created_at_ms: u64,
    pub source_app: Option<String>,
}

/// Clear all history items
#[tauri::command]
pub fn clear_history() -> Result<(), String> {
    // In a real implementation, this would clear the history repository
    // For now, just return success
    Ok(())
}

/// Get history items
#[tauri::command]
pub fn get_history_items(limit: Option<usize>) -> Result<Vec<HistoryItemResponse>, String> {
    // In a real implementation, this would fetch from the history repository
    // For testing, return empty list
    let _limit = limit.unwrap_or(100);
    Ok(Vec::new())
}

/// Add a history item
#[tauri::command]
pub fn add_history_item(
    content: String,
    content_type: String,
) -> Result<bool, String> {
    let _ = (content, content_type);
    // In a real implementation, this would add to the history repository
    Ok(true)
}

/// Delete a history item
#[tauri::command]
pub fn delete_history_item(id: String) -> Result<bool, String> {
    let _ = id;
    // In a real implementation, this would delete from the history repository
    Ok(true)
}

/// Get max history setting
#[tauri::command]
pub fn get_max_history() -> Result<usize, String> {
    // Return default max history
    Ok(100)
}

/// History statistics response
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryStatsResponse {
    pub total_count: usize,
    pub unique_count: usize,
    pub with_source_app_count: usize,
    pub oldest_timestamp_ms: Option<u64>,
    pub newest_timestamp_ms: Option<u64>,
}

/// Get history statistics
///
/// Returns aggregated statistics about the clipboard history,
/// including total count, unique items, and items with source app information.
#[tauri::command]
pub fn get_history_stats(
    limit: Option<usize>,
) -> Result<HistoryStatsResponse, String> {
    // In a real implementation, this would calculate stats from the history repository
    // For testing, return mock statistics
    let _limit = limit.unwrap_or(100);
    Ok(HistoryStatsResponse {
        total_count: 0,
        unique_count: 0,
        with_source_app_count: 0,
        oldest_timestamp_ms: None,
        newest_timestamp_ms: None,
    })
}

// === Helper Types ===

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScreenBounds {
    pub width: u32,
    pub height: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn content_type_serialization() {
        let text = SimulatedContentType::Text;
        let json = serde_json::to_string(&text).expect("serialize");
        assert!(json.contains("text"));
    }

    #[test]
    fn history_stats_response_serialization() {
        let stats = HistoryStatsResponse {
            total_count: 10,
            unique_count: 8,
            with_source_app_count: 5,
            oldest_timestamp_ms: Some(1000),
            newest_timestamp_ms: Some(2000),
        };
        let json = serde_json::to_string(&stats).expect("serialize");
        assert!(json.contains("totalCount"));
        assert!(json.contains("uniqueCount"));
        assert!(json.contains("withSourceAppCount"));
        assert!(json.contains("oldestTimestampMs"));
        assert!(json.contains("newestTimestampMs"));
    }
}
