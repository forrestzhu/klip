pub mod clipboard;
pub mod clipboard_listener;
pub mod commands;
pub mod direct_paste;
pub mod history_model;
pub mod history_repository;
pub mod history_storage;
pub mod hotkey;
pub mod panel_presenter;
pub mod startup_launch;
pub mod test_commands;
pub mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                app.handle()
                    .set_activation_policy(tauri::ActivationPolicy::Accessory)?;
                app.handle().set_dock_visibility(false)?;
            }
            tray::setup_tray(app)?;
            hotkey::register_default_panel_hotkey(&app.handle()).map_err(|error| {
                let setup_error: Box<dyn std::error::Error> =
                    Box::new(std::io::Error::other(error));
                tauri::Error::Setup(setup_error.into())
            })?;
            Ok(())
        })
        .manage(hotkey::PanelHotkeyState::default())
        .manage(hotkey::SnippetAliasHotkeyState::default())
        .manage(panel_presenter::PanelPresenterState::default())
        .manage(clipboard_listener::ClipboardListenerState::default())
        .manage(test_commands::SimulatedFocusState::default())
        .manage(test_commands::SimulatedWindowState::default())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    hotkey::handle_global_shortcut_event(app, shortcut, event.state);
                })
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            commands::quit_app,
            commands::open_snippet_editor_window,
            commands::open_preferences_window,
            commands::check_tray_visibility,
            clipboard::read_clipboard_text,
            clipboard::write_clipboard_text,
            clipboard_listener::start_clipboard_listener,
            clipboard_listener::stop_clipboard_listener,
            direct_paste::direct_paste_text,
            hotkey::register_panel_hotkey,
            hotkey::register_snippet_alias_hotkey,
            hotkey::hide_panel_window,
            startup_launch::get_startup_launch_enabled,
            startup_launch::set_startup_launch_enabled,
            // Test commands for E2E testing
            test_commands::simulate_clipboard_change,
            test_commands::simulate_hotkey_press,
            test_commands::simulate_key_press,
            test_commands::simulate_app_restart,
            test_commands::simulate_app_switch,
            test_commands::simulate_fullscreen_app,
            test_commands::is_clipboard_listener_running,
            test_commands::get_panel_hotkey,
            test_commands::set_panel_hotkey,
            test_commands::reset_panel_hotkey,
            test_commands::is_window_focused,
            test_commands::get_window_position,
            test_commands::get_screen_bounds,
            test_commands::get_previous_focused_app,
            test_commands::get_current_focused_app,
            test_commands::get_app_version,
            test_commands::clear_history,
            test_commands::get_history_items,
            test_commands::add_history_item,
            test_commands::delete_history_item,
            test_commands::get_max_history,
            test_commands::get_history_stats
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
