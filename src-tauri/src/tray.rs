use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Runtime, Window, WindowEvent,
};

use crate::panel_presenter;

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const TRAY_MENU_OPEN_PANEL: &str = "open-panel";
pub const TRAY_MENU_QUIT_APP: &str = "quit-app";

#[cfg(target_os = "macos")]
const MACOS_TRAY_ICON_WIDTH: u32 = 24;
#[cfg(target_os = "macos")]
const MACOS_TRAY_ICON_HEIGHT: u32 = 24;
#[cfg(target_os = "macos")]
const MACOS_TRAY_ICON_RGBA: &[u8] = include_bytes!("../icons/tray-template.rgba");

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrayMenuAction {
    OpenPanel,
    QuitApp,
}

pub fn parse_tray_menu_action(menu_id: &str) -> Option<TrayMenuAction> {
    match menu_id {
        TRAY_MENU_OPEN_PANEL => Some(TrayMenuAction::OpenPanel),
        TRAY_MENU_QUIT_APP => Some(TrayMenuAction::QuitApp),
        _ => None,
    }
}

pub fn setup_tray<R: Runtime>(app: &App<R>) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, TRAY_MENU_OPEN_PANEL, "Open Klip", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, TRAY_MENU_QUIT_APP, "Quit Klip", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&open_item, &quit_item])?;

    let mut tray_builder = TrayIconBuilder::new()
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if is_left_click_release(&event) {
                let _ = show_main_window(tray.app_handle());
            }
        });

    #[cfg(target_os = "macos")]
    {
        if let Ok(icon) = load_macos_tray_icon() {
            tray_builder = tray_builder.icon(icon).icon_as_template(true);
        } else if let Some(icon) = app.default_window_icon().cloned() {
            tray_builder = tray_builder.icon(icon);
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        if let Some(icon) = app.default_window_icon().cloned() {
            tray_builder = tray_builder.icon(icon);
        }
    }

    tray_builder.build(app)?;

    Ok(())
}

pub fn handle_menu_action<R: Runtime>(action: TrayMenuAction, app: &AppHandle<R>) {
    match action {
        TrayMenuAction::OpenPanel => {
            let _ = show_main_window(app);
        }
        TrayMenuAction::QuitApp => app.exit(0),
    }
}

pub fn show_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    panel_presenter::present_main_panel(app)
}

pub fn hide_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    panel_presenter::hide_main_panel(app)
}

pub fn handle_window_event<R: Runtime>(window: &Window<R>, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
    }
}

fn is_left_click_release(event: &TrayIconEvent) -> bool {
    matches!(
        event,
        TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        }
    )
}

#[cfg(target_os = "macos")]
fn load_macos_tray_icon() -> tauri::Result<Image<'static>> {
    let expected_len = (MACOS_TRAY_ICON_WIDTH * MACOS_TRAY_ICON_HEIGHT * 4) as usize;
    if MACOS_TRAY_ICON_RGBA.len() != expected_len {
        return Err(tauri::Error::Io(std::io::Error::other(
            "Invalid macOS tray icon RGBA asset length.",
        )));
    }

    Ok(Image::new(
        MACOS_TRAY_ICON_RGBA,
        MACOS_TRAY_ICON_WIDTH,
        MACOS_TRAY_ICON_HEIGHT,
    )
    .to_owned())
}

pub fn configure_main_window_for_panel<R: Runtime>(
    window: &tauri::WebviewWindow<R>,
) -> tauri::Result<()> {
    panel_presenter::configure_main_window_for_panel(window)
}

#[cfg(test)]
mod tests {
    #[cfg(target_os = "macos")]
    use super::load_macos_tray_icon;
    use super::{parse_tray_menu_action, TrayMenuAction, TRAY_MENU_OPEN_PANEL, TRAY_MENU_QUIT_APP};

    #[test]
    fn parse_tray_menu_action_maps_supported_actions() {
        assert_eq!(
            parse_tray_menu_action(TRAY_MENU_OPEN_PANEL),
            Some(TrayMenuAction::OpenPanel)
        );
        assert_eq!(
            parse_tray_menu_action(TRAY_MENU_QUIT_APP),
            Some(TrayMenuAction::QuitApp)
        );
    }

    #[test]
    fn parse_tray_menu_action_ignores_unknown_ids() {
        assert_eq!(parse_tray_menu_action("other-action"), None);
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn macos_tray_icon_asset_loads() {
        assert!(load_macos_tray_icon().is_ok());
    }
}
