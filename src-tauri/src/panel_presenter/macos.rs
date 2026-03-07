use std::{
    process::Command,
    sync::mpsc,
    thread,
    time::{Duration, Instant},
};

use objc2_app_kit::{NSStatusWindowLevel, NSWindow, NSWindowCollectionBehavior};
use tauri::{AppHandle, Runtime, WebviewWindow};

use super::PreviousTarget;

const RESTORE_TIMEOUT: Duration = Duration::from_millis(400);
const RESTORE_POLL_INTERVAL: Duration = Duration::from_millis(25);

pub(super) fn configure_window_for_panel<R: Runtime>(
    window: &WebviewWindow<R>,
) -> tauri::Result<()> {
    let window = window.clone();
    let window_for_main = window.clone();
    let (tx, rx) = mpsc::channel();

    window.run_on_main_thread(move || {
        let result = configure_window_for_panel_on_main_thread(&window_for_main);
        let _ = tx.send(result);
    })?;

    rx.recv()
        .map_err(|_| {
            tauri::Error::Io(std::io::Error::other(
                "Failed to receive macOS panel configuration result.",
            ))
        })?
        .map_err(|error| tauri::Error::Io(std::io::Error::other(error)))
}

pub(super) fn capture_previous_target<R: Runtime>(app: &AppHandle<R>) -> Option<PreviousTarget> {
    let bundle_id = capture_frontmost_bundle_id()?;
    if bundle_id == app.config().identifier {
        return None;
    }

    Some(PreviousTarget::MacOsBundleId(bundle_id))
}

pub(super) fn restore_previous_target<R: Runtime>(
    _app: &AppHandle<R>,
    previous_target: &PreviousTarget,
) -> Result<(), String> {
    let PreviousTarget::MacOsBundleId(bundle_id) = previous_target;

    activate_application_by_bundle_id(bundle_id)?;
    wait_for_frontmost_bundle_id(bundle_id)
}

fn configure_window_for_panel_on_main_thread<R: Runtime>(
    window: &WebviewWindow<R>,
) -> Result<(), String> {
    let ns_window_ptr = window.ns_window().map_err(|error| error.to_string())?;
    if ns_window_ptr.is_null() {
        return Err(String::from("Failed to access the macOS NSWindow handle."));
    }

    let ns_window = unsafe { &*(ns_window_ptr as *mut NSWindow) };
    ns_window.setCollectionBehavior(panel_collection_behavior(ns_window.collectionBehavior()));
    ns_window.setLevel(NSStatusWindowLevel);
    ns_window.setHidesOnDeactivate(true);

    Ok(())
}

fn panel_collection_behavior(base: NSWindowCollectionBehavior) -> NSWindowCollectionBehavior {
    let mut collection_behavior = base;
    collection_behavior.insert(NSWindowCollectionBehavior::FullScreenAuxiliary);
    collection_behavior.remove(NSWindowCollectionBehavior::MoveToActiveSpace);
    collection_behavior
}

fn wait_for_frontmost_bundle_id(target_bundle_id: &str) -> Result<(), String> {
    let deadline = Instant::now() + RESTORE_TIMEOUT;

    loop {
        if capture_frontmost_bundle_id().as_deref() == Some(target_bundle_id) {
            return Ok(());
        }

        if Instant::now() >= deadline {
            break;
        }

        thread::sleep(RESTORE_POLL_INTERVAL);
    }

    Err(format!(
        "Timed out while restoring focus to macOS app `{target_bundle_id}`.",
    ))
}

fn capture_frontmost_bundle_id() -> Option<String> {
    run_osascript(
		r#"tell application "System Events" to get bundle identifier of first application process whose frontmost is true"#,
	)
	.ok()
	.filter(|bundle_id| !bundle_id.trim().is_empty())
}

fn activate_application_by_bundle_id(bundle_id: &str) -> Result<(), String> {
    run_osascript(&format!(r#"tell application id "{bundle_id}" to activate"#)).map(|_| ())
}

fn run_osascript(script: &str) -> Result<String, String> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .map_err(|error| error.to_string())?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if stderr.is_empty() {
        Err(String::from("osascript execution failed"))
    } else {
        Err(stderr)
    }
}

#[cfg(test)]
mod tests {
    use super::panel_collection_behavior;
    use objc2_app_kit::NSWindowCollectionBehavior;

    #[test]
    fn panel_collection_behavior_adds_full_screen_auxiliary() {
        let behavior = panel_collection_behavior(NSWindowCollectionBehavior::empty());

        assert!(behavior.contains(NSWindowCollectionBehavior::FullScreenAuxiliary));
    }

    #[test]
    fn panel_collection_behavior_removes_move_to_active_space() {
        let behavior = panel_collection_behavior(NSWindowCollectionBehavior::MoveToActiveSpace);

        assert!(!behavior.contains(NSWindowCollectionBehavior::MoveToActiveSpace));
    }
}
