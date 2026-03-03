pub mod commands;
pub mod history_model;
pub mod history_repository;
pub mod history_storage;

pub fn bootstrap_message() -> &'static str {
    "klip tauri backend core ready"
}

#[cfg(test)]
mod tests {
    use super::bootstrap_message;
    use super::commands;

    #[test]
    fn bootstrap_message_is_stable() {
        assert_eq!(bootstrap_message(), "klip tauri backend core ready");
    }

    #[test]
    fn default_capabilities_are_available() {
        assert_eq!(commands::capabilities().len(), 3);
    }
}
