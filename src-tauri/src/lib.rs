pub mod clipboard;
pub mod commands;
pub mod direct_paste;
pub mod history_model;
pub mod history_repository;
pub mod history_storage;
pub mod hotkey;
pub mod startup_launch;
pub mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(hotkey::PanelHotkeyState::default())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        let _ = tray::show_main_window(app);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            tray::setup_tray(app)?;
            hotkey::register_default_panel_hotkey(&app.handle()).map_err(|error| {
                let setup_error: Box<dyn std::error::Error> =
                    Box::new(std::io::Error::other(error));
                tauri::Error::Setup(setup_error.into())
            })?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::quit_app,
            commands::open_snippet_editor_window,
            commands::open_preferences_window,
            clipboard::read_clipboard_text,
            clipboard::write_clipboard_text,
            direct_paste::direct_paste_text,
            hotkey::register_panel_hotkey,
            hotkey::hide_panel_window,
            startup_launch::get_startup_launch_enabled,
            startup_launch::set_startup_launch_enabled
        ])
        .on_menu_event(|app, event| {
            if let Some(action) = tray::parse_tray_menu_action(event.id().as_ref()) {
                tray::handle_menu_action(action, app);
            }
        })
        .on_window_event(tray::handle_window_event)
        .run(tauri::generate_context!())
        .expect("failed to run klip tauri app");
}

#[cfg(test)]
mod tests {
    use super::commands;
    use super::hotkey;
    use super::tray;

    #[test]
    fn default_capabilities_are_available() {
        assert_eq!(commands::capabilities().len(), 4);
    }

    #[test]
    fn tray_menu_actions_are_registered() {
        assert!(tray::parse_tray_menu_action(tray::TRAY_MENU_OPEN_PANEL).is_some());
        assert!(tray::parse_tray_menu_action(tray::TRAY_MENU_QUIT_APP).is_some());
    }

    #[test]
    fn default_panel_hotkey_is_defined() {
        assert!(!hotkey::DEFAULT_PANEL_HOTKEY.is_empty());
    }
}
