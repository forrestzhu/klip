#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PlatformCapability {
    ClipboardListen,
    GlobalHotkey,
    DirectPaste,
    StartupLaunch,
}

pub fn capabilities() -> [PlatformCapability; 4] {
    [
        PlatformCapability::ClipboardListen,
        PlatformCapability::GlobalHotkey,
        PlatformCapability::DirectPaste,
        PlatformCapability::StartupLaunch,
    ]
}
