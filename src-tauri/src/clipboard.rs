use arboard::Error as ClipboardNativeError;
use thiserror::Error;

#[derive(Debug, Error)]
enum ClipboardRuntimeError {
    #[error("Failed to access system clipboard: {0}")]
    Access(String),
    #[error("Failed to read system clipboard text: {0}")]
    Read(String),
    #[error("Failed to write system clipboard text: {0}")]
    Write(String),
}

#[tauri::command]
pub fn read_clipboard_text() -> Result<Option<String>, String> {
    let mut clipboard = arboard::Clipboard::new()
        .map_err(|error| ClipboardRuntimeError::Access(error.to_string()).to_string())?;

    match clipboard.get_text() {
        Ok(text) => Ok(Some(text)),
        Err(ClipboardNativeError::ContentNotAvailable) => Ok(None),
        Err(error) => Err(ClipboardRuntimeError::Read(error.to_string()).to_string()),
    }
}

#[tauri::command]
pub fn write_clipboard_text(text: String) -> Result<(), String> {
    let mut clipboard = arboard::Clipboard::new()
        .map_err(|error| ClipboardRuntimeError::Access(error.to_string()).to_string())?;

    clipboard
        .set_text(text)
        .map_err(|error| ClipboardRuntimeError::Write(error.to_string()).to_string())
}

#[cfg(test)]
mod tests {
    use super::ClipboardRuntimeError;

    #[test]
    fn clipboard_error_messages_are_not_empty() {
        let access_error = ClipboardRuntimeError::Access(String::from("denied")).to_string();
        let read_error = ClipboardRuntimeError::Read(String::from("occupied")).to_string();
        let write_error = ClipboardRuntimeError::Write(String::from("busy")).to_string();

        assert!(!access_error.trim().is_empty());
        assert!(!read_error.trim().is_empty());
        assert!(!write_error.trim().is_empty());
    }
}
