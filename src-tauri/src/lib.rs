pub mod commands;

pub fn bootstrap_message() -> &'static str {
	"klip tauri backend scaffold ready"
}

#[cfg(test)]
mod tests {
	use super::bootstrap_message;
	use super::commands;

	#[test]
	fn bootstrap_message_is_stable() {
		assert_eq!(bootstrap_message(), "klip tauri backend scaffold ready");
	}

	#[test]
	fn default_capabilities_are_available() {
		assert_eq!(commands::capabilities().len(), 3);
	}
}
