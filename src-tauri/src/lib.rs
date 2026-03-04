pub mod commands;
pub mod history_model;
pub mod history_repository;
pub mod history_storage;
pub mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            tray::setup_tray(app)?;
            Ok(())
        })
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
    use super::tray;

    #[test]
    fn default_capabilities_are_available() {
        assert_eq!(commands::capabilities().len(), 3);
    }

    #[test]
    fn tray_menu_actions_are_registered() {
        assert!(tray::parse_tray_menu_action(tray::TRAY_MENU_OPEN_PANEL).is_some());
        assert!(tray::parse_tray_menu_action(tray::TRAY_MENU_QUIT_APP).is_some());
    }
}
