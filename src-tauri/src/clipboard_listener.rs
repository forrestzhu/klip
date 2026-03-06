use std::sync::Mutex;
use std::thread::{self, JoinHandle};

use clipboard_rs::{ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext, WatcherShutdown};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Runtime, State};

use crate::tray::MAIN_WINDOW_LABEL;

pub const CLIPBOARD_UPDATED_EVENT: &str = "klip://clipboard-updated";

#[derive(Debug, Serialize, Clone, Copy)]
pub struct ClipboardUpdatedPayload {
    #[serde(rename = "hasText")]
    pub has_text: bool,
}

#[derive(Default)]
pub struct ClipboardListenerState {
    handle: Mutex<Option<ClipboardListenerHandle>>,
}

struct ClipboardListenerHandle {
    shutdown: WatcherShutdown,
    join_handle: JoinHandle<()>,
}

#[derive(Clone)]
struct ClipboardEventHandler<R: Runtime> {
    app: AppHandle<R>,
}

impl<R: Runtime> ClipboardHandler for ClipboardEventHandler<R> {
    fn on_clipboard_change(&mut self) {
        let payload = ClipboardUpdatedPayload { has_text: true };
        let _ = self
            .app
            .emit_to(MAIN_WINDOW_LABEL, CLIPBOARD_UPDATED_EVENT, payload);
    }
}

#[tauri::command]
pub fn start_clipboard_listener<R: Runtime>(
    app: AppHandle<R>,
    state: State<'_, ClipboardListenerState>,
) -> Result<(), String> {
    let mut guard = state
        .handle
        .lock()
        .map_err(|_| String::from("Failed to lock clipboard listener state"))?;
    if guard.is_some() {
        return Ok(());
    }

    let mut watcher = ClipboardWatcherContext::new()
        .map_err(|error| format!("Failed to initialize clipboard watcher: {error}"))?;
    let shutdown = watcher
        .add_handler(ClipboardEventHandler { app })
        .get_shutdown_channel();

    let join_handle = thread::Builder::new()
        .name(String::from("klip-clipboard-watcher"))
        .spawn(move || {
            watcher.start_watch();
        })
        .map_err(|error| format!("Failed to start clipboard watcher thread: {error}"))?;

    *guard = Some(ClipboardListenerHandle {
        shutdown,
        join_handle,
    });
    Ok(())
}

#[tauri::command]
pub fn stop_clipboard_listener(state: State<'_, ClipboardListenerState>) -> Result<(), String> {
    stop_listener(&state)
}

impl Drop for ClipboardListenerState {
    fn drop(&mut self) {
        let _ = stop_listener(self);
    }
}

fn stop_listener(state: &ClipboardListenerState) -> Result<(), String> {
    let handle = {
        let mut guard = state
            .handle
            .lock()
            .map_err(|_| String::from("Failed to lock clipboard listener state"))?;
        guard.take()
    };

    if let Some(handle) = handle {
        handle.shutdown.stop();
        let _ = handle.join_handle.join();
    }

    Ok(())
}
