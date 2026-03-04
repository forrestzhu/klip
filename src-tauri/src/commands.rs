use tauri::{AppHandle, Runtime};

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

#[tauri::command]
pub fn quit_app<R: Runtime>(app: AppHandle<R>) {
    app.exit(0);
}
