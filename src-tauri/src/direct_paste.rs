use std::process::Command;

use serde::Serialize;
use tauri::{AppHandle, Runtime};
use thiserror::Error;

use crate::tray;

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

    match trigger_system_paste() {
        Ok(()) => {
            let _ = tray::hide_main_window(&app);
            Ok(DirectPasteResponse {
                mode: DirectPasteMode::Direct,
                message: String::from("Pasted into active app."),
            })
        }
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
    let mut clipboard = arboard::Clipboard::new().map_err(|error| {
        DirectPasteError::ClipboardWrite(error.to_string()).to_string()
    })?;
    clipboard.set_text(text.to_string()).map_err(|error| {
        DirectPasteError::ClipboardWrite(error.to_string()).to_string()
    })
}

fn trigger_system_paste() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        return trigger_macos_paste();
    }

    #[cfg(target_os = "windows")]
    {
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
    if stderr.is_empty() {
        Err(String::from("osascript execution failed"))
    } else {
        Err(stderr)
    }
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
    use super::{normalize_input_text, DirectPasteMode};

    #[test]
    fn normalize_input_rejects_empty_text() {
        let result = normalize_input_text("   ");
        assert!(result.is_err());
    }

    #[test]
    fn normalize_input_preserves_original_text() {
        let value = normalize_input_text("  keep surrounding spaces  ").expect("normalize");
        assert_eq!(value, "  keep surrounding spaces  ");
    }

    #[test]
    fn direct_paste_mode_is_stable() {
        assert_eq!(DirectPasteMode::Direct, DirectPasteMode::Direct);
        assert_eq!(DirectPasteMode::Fallback, DirectPasteMode::Fallback);
    }
}
