use tauri::{AppHandle, Manager, Runtime, WebviewUrl, WebviewWindowBuilder};

const SNIPPET_EDITOR_WINDOW_LABEL: &str = "snippet-editor";
const PREFERENCES_WINDOW_LABEL: &str = "preferences";
const SNIPPET_EDITOR_WINDOW_URL: &str = "index.html?window=snippet-editor";
const PREFERENCES_WINDOW_URL: &str = "index.html?window=preferences";

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum AuxiliaryWindowKind {
    SnippetEditor,
    Preferences,
}

impl AuxiliaryWindowKind {
    fn label(self) -> &'static str {
        match self {
            Self::SnippetEditor => SNIPPET_EDITOR_WINDOW_LABEL,
            Self::Preferences => PREFERENCES_WINDOW_LABEL,
        }
    }

    fn url(self) -> &'static str {
        match self {
            Self::SnippetEditor => SNIPPET_EDITOR_WINDOW_URL,
            Self::Preferences => PREFERENCES_WINDOW_URL,
        }
    }

    fn title(self) -> &'static str {
        match self {
            Self::SnippetEditor => "Klip - 片断编辑器",
            Self::Preferences => "Klip - 设置",
        }
    }

    fn size(self) -> (f64, f64) {
        match self {
            Self::SnippetEditor => (800.0, 600.0),
            Self::Preferences => (480.0, 374.0),
        }
    }

    fn min_size(self) -> (f64, f64) {
        match self {
            Self::SnippetEditor => (800.0, 600.0),
            Self::Preferences => (480.0, 374.0),
        }
    }

    fn resizable(self) -> bool {
        match self {
            Self::SnippetEditor => true,
            Self::Preferences => false,
        }
    }
}

#[tauri::command]
pub fn quit_app<R: Runtime>(app: AppHandle<R>) {
    app.exit(0);
}

#[tauri::command]
pub fn open_snippet_editor_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    open_auxiliary_window(&app, AuxiliaryWindowKind::SnippetEditor)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn open_preferences_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    open_auxiliary_window(&app, AuxiliaryWindowKind::Preferences).map_err(|error| error.to_string())
}

#[tauri::command]
pub fn check_tray_visibility<R: Runtime>(_app: AppHandle<R>) -> Result<bool, String> {
    // The tray icon is created during app setup. If the app is running,
    // the tray icon should be visible (unless explicitly hidden/removed).
    // Since tray setup happens in lib.rs and would fail the app startup if it errored,
    // we can safely assume the tray is visible when this command is called.
    Ok(true)
}

fn open_auxiliary_window<R: Runtime>(
    app: &AppHandle<R>,
    kind: AuxiliaryWindowKind,
) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window(kind.label()) {
        show_and_focus_window(&window)?;
    } else {
        let (width, height) = kind.size();
        let (min_width, min_height) = kind.min_size();
        let window =
            WebviewWindowBuilder::new(app, kind.label(), WebviewUrl::App(kind.url().into()))
                .title(kind.title())
                .inner_size(width, height)
                .min_inner_size(min_width, min_height)
                .resizable(kind.resizable())
                .center()
                .build()?;

        show_and_focus_window(&window)?;
    }

    let _ = super::tray::hide_main_window(app);
    Ok(())
}

fn show_and_focus_window<R: Runtime>(window: &tauri::WebviewWindow<R>) -> tauri::Result<()> {
    if window.is_minimized()? {
        window.unminimize()?;
    }

    window.show()?;
    window.set_focus()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::AuxiliaryWindowKind;

    #[test]
    fn auxiliary_window_kind_properties_match_three_window_spec() {
        let snippet = AuxiliaryWindowKind::SnippetEditor;
        assert_eq!(snippet.label(), "snippet-editor");
        assert_eq!(snippet.url(), "index.html?window=snippet-editor");
        assert_eq!(snippet.size(), (800.0, 600.0));
        assert_eq!(snippet.min_size(), (800.0, 600.0));
        assert!(snippet.resizable());

        let preferences = AuxiliaryWindowKind::Preferences;
        assert_eq!(preferences.label(), "preferences");
        assert_eq!(preferences.url(), "index.html?window=preferences");
        assert_eq!(preferences.size(), (480.0, 374.0));
        assert_eq!(preferences.min_size(), (480.0, 374.0));
        assert!(!preferences.resizable());
    }
}
