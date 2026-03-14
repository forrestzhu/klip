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
    use super::{ClipboardRuntimeError, read_clipboard_text, write_clipboard_text};

    #[test]
    fn clipboard_error_messages_are_not_empty() {
        let access_error = ClipboardRuntimeError::Access(String::from("denied")).to_string();
        let read_error = ClipboardRuntimeError::Read(String::from("occupied")).to_string();
        let write_error = ClipboardRuntimeError::Write(String::from("busy")).to_string();

        assert!(!access_error.trim().is_empty());
        assert!(!read_error.trim().is_empty());
        assert!(!write_error.trim().is_empty());
    }

    #[test]
    fn clipboard_error_types_are_distinct() {
        let access_error = ClipboardRuntimeError::Access(String::from("err1"));
        let read_error = ClipboardRuntimeError::Read(String::from("err2"));
        let write_error = ClipboardRuntimeError::Write(String::from("err3"));

        assert_ne!(access_error.to_string(), read_error.to_string());
        assert_ne!(read_error.to_string(), write_error.to_string());
        assert_ne!(access_error.to_string(), write_error.to_string());
    }

    #[test]
    fn clipboard_error_contains_original_message() {
        let original_msg = "clipboard access denied by system";
        let access_error = ClipboardRuntimeError::Access(String::from(original_msg)).to_string();
        let read_error = ClipboardRuntimeError::Read(String::from(original_msg)).to_string();
        let write_error = ClipboardRuntimeError::Write(String::from(original_msg)).to_string();

        assert!(access_error.contains(original_msg));
        assert!(read_error.contains(original_msg));
        assert!(write_error.contains(original_msg));
    }

    #[test]
    fn clipboard_error_debug_format() {
        let error = ClipboardRuntimeError::Access(String::from("test error"));
        let debug_str = format!("{:?}", error);
        
        assert!(debug_str.contains("Access"));
        assert!(debug_str.contains("test error"));
    }

    #[test]
    fn clipboard_functions_exist() {
        // Verify that the command functions are defined
        // Note: Actual execution requires system clipboard access
        let _read_fn = read_clipboard_text;
        let _write_fn = write_clipboard_text;
        
        // This test just ensures the functions exist and have correct signatures
        assert!(true);
    }
}
