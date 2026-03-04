use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Manager, Runtime, Window, WindowEvent,
};

pub const MAIN_WINDOW_LABEL: &str = "main";
pub const TRAY_MENU_OPEN_PANEL: &str = "open-panel";
pub const TRAY_MENU_QUIT_APP: &str = "quit-app";

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

    if let Some(icon) = app.default_window_icon().cloned() {
        tray_builder = tray_builder.icon(icon);
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
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(());
    };

    if window.is_minimized()? {
        window.unminimize()?;
    }

    window.show()?;
    window.set_focus()?;
    Ok(())
}

pub fn hide_main_window<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(());
    };

    window.hide()?;
    Ok(())
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

#[cfg(test)]
mod tests {
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
}
