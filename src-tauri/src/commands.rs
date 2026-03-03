#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlatformCapability {
	ClipboardListen,
	GlobalHotkey,
	DirectPaste,
}

pub fn capabilities() -> [PlatformCapability; 3] {
	[
		PlatformCapability::ClipboardListen,
		PlatformCapability::GlobalHotkey,
		PlatformCapability::DirectPaste,
	]
}
