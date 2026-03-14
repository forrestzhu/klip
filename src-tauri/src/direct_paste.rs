use std::process::Command;

use serde::Serialize;
use tauri::{AppHandle, Runtime};
use thiserror::Error;

use crate::panel_presenter;

#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum DirectPasteMode {
    Direct,
    Fallback,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectPasteResponse {
    pub mode: DirectPasteMode,
    pub message: String,
}

#[derive(Debug, Error)]
enum DirectPasteError {
    #[error("Paste text cannot be empty.")]
    EmptyText,
    #[error("Failed to write to system clipboard: {0}")]
    ClipboardWrite(String),
}

#[tauri::command]
pub fn direct_paste_text<R: Runtime>(
    app: AppHandle<R>,
    text: String,
) -> Result<DirectPasteResponse, String> {
    let normalized_text = normalize_input_text(&text)?;
    set_clipboard_text(&normalized_text)?;

    match trigger_system_paste(&app) {
        Ok(()) => Ok(DirectPasteResponse {
            mode: DirectPasteMode::Direct,
            message: String::from("Pasted into active app."),
        }),
        Err(error) => Ok(DirectPasteResponse {
            mode: DirectPasteMode::Fallback,
            message: format!(
                "Direct paste unavailable ({error}). Text is copied to clipboard instead."
            ),
        }),
    }
}

fn normalize_input_text(raw_text: &str) -> Result<String, String> {
    if raw_text.trim().is_empty() {
        return Err(DirectPasteError::EmptyText.to_string());
    }

    Ok(raw_text.to_string())
}

fn set_clipboard_text(text: &str) -> Result<(), String> {
    let mut clipboard = arboard::Clipboard::new()
        .map_err(|error| DirectPasteError::ClipboardWrite(error.to_string()).to_string())?;
    clipboard
        .set_text(text.to_string())
        .map_err(|error| DirectPasteError::ClipboardWrite(error.to_string()).to_string())
}

fn trigger_system_paste<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        ensure_macos_direct_paste_access()?;
        panel_presenter::prepare_direct_paste(app)?;
        return trigger_macos_paste();
    }

    #[cfg(target_os = "windows")]
    {
        panel_presenter::prepare_direct_paste(app)?;
        return trigger_windows_paste();
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        Err(String::from(
            "platform paste injection is not implemented for this OS",
        ))
    }
}

#[cfg(target_os = "macos")]
fn trigger_macos_paste() -> Result<(), String> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg(r#"tell application "System Events" to keystroke "v" using command down"#)
        .output()
        .map_err(|error| error.to_string())?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if is_macos_accessibility_error(&stderr) {
        return Err(macos_accessibility_message());
    }
    if stderr.is_empty() {
        Err(String::from("osascript execution failed"))
    } else {
        Err(stderr)
    }
}

#[cfg(target_os = "macos")]
fn ensure_macos_direct_paste_access() -> Result<(), String> {
    if is_macos_accessibility_trusted() {
        Ok(())
    } else {
        Err(macos_accessibility_message())
    }
}

#[cfg(target_os = "macos")]
fn is_macos_accessibility_error(message: &str) -> bool {
    let normalized = message.to_lowercase();
    normalized.contains("not allowed to send keystrokes")
        || normalized.contains("不允许发送按键")
        || normalized.contains("accessibility")
}

#[cfg(target_os = "macos")]
fn macos_accessibility_message() -> String {
    String::from(
        "Direct paste requires Accessibility permission on macOS. Allow Klip in System Settings > Privacy & Security > Accessibility, then retry.",
    )
}

#[cfg(target_os = "macos")]
fn is_macos_accessibility_trusted() -> bool {
    #[link(name = "ApplicationServices", kind = "framework")]
    unsafe extern "C" {
        fn AXIsProcessTrusted() -> bool;
    }

    unsafe { AXIsProcessTrusted() }
}

#[cfg(target_os = "windows")]
fn trigger_windows_paste() -> Result<(), String> {
    let output = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg("Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')")
        .output()
        .map_err(|error| error.to_string())?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if stderr.is_empty() {
        Err(String::from("powershell sendkeys execution failed"))
    } else {
        Err(stderr)
    }
}

#[cfg(test)]
mod tests {
    use super::{normalize_input_text, DirectPasteMode, DirectPasteError};

    #[cfg(target_os = "macos")]
    use super::macos_accessibility_message;

    #[test]
    fn normalize_input_rejects_empty_text() {
        let result = normalize_input_text("");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("empty"));
    }

    #[test]
    fn normalize_input_rejects_whitespace_only() {
        let result = normalize_input_text("   ");
        assert!(result.is_err());
    }

    #[test]
    fn normalize_input_preserves_original_text() {
        let value = normalize_input_text("  keep surrounding spaces  ").expect("normalize");
        assert_eq!(value, "  keep surrounding spaces  ");
    }

    #[test]
    fn normalize_input_accepts_valid_text() {
        let result = normalize_input_text("Hello, World!");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Hello, World!");
    }

    #[test]
    fn direct_paste_mode_is_stable() {
        assert_eq!(DirectPasteMode::Direct, DirectPasteMode::Direct);
        assert_eq!(DirectPasteMode::Fallback, DirectPasteMode::Fallback);
    }

    #[test]
    fn direct_paste_mode_serialization() {
        let direct = DirectPasteMode::Direct;
        let fallback = DirectPasteMode::Fallback;
        
        let direct_json = serde_json::to_string(&direct).unwrap();
        let fallback_json = serde_json::to_string(&fallback).unwrap();
        
        assert_eq!(direct_json, "\"direct\"");
        assert_eq!(fallback_json, "\"fallback\"");
    }

    #[test]
    fn direct_paste_error_messages_are_descriptive() {
        let empty_error = DirectPasteError::EmptyText.to_string();
        let clipboard_error = DirectPasteError::ClipboardWrite(String::from("access denied")).to_string();
        
        assert!(!empty_error.is_empty());
        assert!(!clipboard_error.is_empty());
        assert!(clipboard_error.contains("clipboard"));
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn macos_accessibility_message_mentions_system_settings() {
        let message = macos_accessibility_message();
        assert!(message.contains("Accessibility"));
        assert!(message.contains("System Settings"));
    }
}
