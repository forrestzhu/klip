use std::sync::Mutex;

use tauri::{AppHandle, Manager, PhysicalPosition, Position, Runtime, WebviewWindow};

use crate::tray::MAIN_WINDOW_LABEL;

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "windows")]
mod windows;

#[cfg(target_os = "macos")]
use self::macos as platform;
#[cfg(target_os = "windows")]
use self::windows as platform;

const PANEL_CURSOR_OFFSET: i32 = 12;
const DEFAULT_PANEL_SIZE: PanelSize = PanelSize {
    width: 340,
    height: 720,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PanelCursor {
    x: i32,
    y: i32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PanelSize {
    width: u32,
    height: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct MonitorWorkArea {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PanelOrigin {
    x: i32,
    y: i32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum PreviousTarget {
    #[cfg(target_os = "macos")]
    MacOsBundleId(String),
    #[cfg(target_os = "windows")]
    WindowsWindowHandle(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum RestoreStrategy {
    AttemptRestore,
    ClipboardFallback,
}

#[derive(Default)]
pub struct PanelPresenterState {
    previous_target: Mutex<Option<PreviousTarget>>,
}

pub fn configure_main_window_for_panel<R: Runtime>(window: &WebviewWindow<R>) -> tauri::Result<()> {
    window.set_always_on_top(true)?;
    window.set_skip_taskbar(true)?;
    window.set_visible_on_all_workspaces(true)?;
    platform::configure_window_for_panel(window)?;
    Ok(())
}

pub fn present_main_panel<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(());
    };

    store_previous_target(app);
    configure_main_window_for_panel(&window)?;
    position_main_window_near_cursor(&window)?;

    if window.is_minimized()? {
        window.unminimize()?;
    }

    window.show()?;
    window.set_focus()?;
    Ok(())
}

pub fn prepare_direct_paste<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let _ = hide_main_panel(app);

    let previous_target = {
        let state = app.state::<PanelPresenterState>();
        let previous_target = state
            .previous_target
            .lock()
            .expect("panel presenter mutex poisoned")
            .clone();
        previous_target
    };

    match restore_strategy(previous_target.as_ref()) {
        RestoreStrategy::AttemptRestore => restore_previous_target(app, previous_target),
        RestoreStrategy::ClipboardFallback => Err(String::from(
            "No previous target was captured for direct paste.",
        )),
    }
}

pub fn hide_main_panel<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(());
    };

    window.hide()?;
    Ok(())
}

fn position_main_window_near_cursor<R: Runtime>(window: &WebviewWindow<R>) -> tauri::Result<()> {
    let cursor_position = window.cursor_position()?;
    let cursor = PanelCursor {
        x: cursor_position.x.round() as i32,
        y: cursor_position.y.round() as i32,
    };
    let monitor = window
        .monitor_from_point(cursor_position.x, cursor_position.y)?
        .or_else(|| window.current_monitor().ok().flatten())
        .or_else(|| window.primary_monitor().ok().flatten());

    let Some(monitor) = monitor else {
        return Ok(());
    };

    let panel_size = window
        .outer_size()
        .map(|size| PanelSize {
            width: size.width,
            height: size.height,
        })
        .unwrap_or(DEFAULT_PANEL_SIZE);
    let work_area = monitor.work_area();
    let origin = panel_origin(
        cursor,
        panel_size,
        MonitorWorkArea {
            x: work_area.position.x,
            y: work_area.position.y,
            width: work_area.size.width,
            height: work_area.size.height,
        },
    );

    window.set_position(Position::Physical(PhysicalPosition::new(
        origin.x, origin.y,
    )))?;
    Ok(())
}

fn panel_origin(
    cursor: PanelCursor,
    panel_size: PanelSize,
    work_area: MonitorWorkArea,
) -> PanelOrigin {
    let panel_width = i32::try_from(panel_size.width).unwrap_or(i32::MAX);
    let panel_height = i32::try_from(panel_size.height).unwrap_or(i32::MAX);
    let work_area_width = i32::try_from(work_area.width).unwrap_or(i32::MAX);
    let work_area_height = i32::try_from(work_area.height).unwrap_or(i32::MAX);

    let min_x = work_area.x;
    let min_y = work_area.y;
    let max_x = work_area.x + work_area_width - panel_width;
    let max_y = work_area.y + work_area_height - panel_height;

    let clamped_max_x = max_x.max(min_x);
    let clamped_max_y = max_y.max(min_y);

    let mut x = cursor.x + PANEL_CURSOR_OFFSET;
    let mut y = cursor.y + PANEL_CURSOR_OFFSET;

    if x > clamped_max_x {
        x = cursor.x - panel_width - PANEL_CURSOR_OFFSET;
    }

    if y > clamped_max_y {
        y = cursor.y - panel_height - PANEL_CURSOR_OFFSET;
    }

    PanelOrigin {
        x: x.clamp(min_x, clamped_max_x),
        y: y.clamp(min_y, clamped_max_y),
    }
}

fn restore_strategy(previous_target: Option<&PreviousTarget>) -> RestoreStrategy {
    if previous_target.is_some() {
        RestoreStrategy::AttemptRestore
    } else {
        RestoreStrategy::ClipboardFallback
    }
}

fn store_previous_target<R: Runtime>(app: &AppHandle<R>) {
    let previous_target = platform::capture_previous_target(app);
    let state = app.state::<PanelPresenterState>();
    let mut previous_target_guard = state
        .previous_target
        .lock()
        .expect("panel presenter mutex poisoned");
    *previous_target_guard = previous_target;
}

fn restore_previous_target<R: Runtime>(
    app: &AppHandle<R>,
    previous_target: Option<PreviousTarget>,
) -> Result<(), String> {
    let Some(previous_target) = previous_target else {
        return Err(String::from(
            "No previous target was captured for direct paste.",
        ));
    };

    platform::restore_previous_target(app, &previous_target)
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
mod platform {
    use super::{AppHandle, PreviousTarget, Runtime};
    use tauri::WebviewWindow;

    pub fn configure_window_for_panel<R: Runtime>(_window: &WebviewWindow<R>) -> tauri::Result<()> {
        Ok(())
    }

    pub fn capture_previous_target<R: Runtime>(_app: &AppHandle<R>) -> Option<PreviousTarget> {
        None
    }

    pub fn restore_previous_target<R: Runtime>(
        _app: &AppHandle<R>,
        _previous_target: &PreviousTarget,
    ) -> Result<(), String> {
        Err(String::from(
            "previous target restoration is not implemented",
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::{
        panel_origin, restore_strategy, MonitorWorkArea, PanelCursor, PanelOrigin, PanelSize,
        RestoreStrategy,
    };

    #[test]
    fn panel_origin_places_window_down_and_right_when_space_is_available() {
        let origin = panel_origin(
            PanelCursor { x: 300, y: 200 },
            PanelSize {
                width: 340,
                height: 300,
            },
            MonitorWorkArea {
                x: 0,
                y: 0,
                width: 1440,
                height: 900,
            },
        );

        assert_eq!(origin, PanelOrigin { x: 312, y: 212 });
    }

    #[test]
    fn panel_origin_flips_left_when_right_edge_would_overflow() {
        let origin = panel_origin(
            PanelCursor { x: 1380, y: 200 },
            PanelSize {
                width: 340,
                height: 300,
            },
            MonitorWorkArea {
                x: 0,
                y: 0,
                width: 1440,
                height: 900,
            },
        );

        assert_eq!(origin, PanelOrigin { x: 1028, y: 212 });
    }

    #[test]
    fn panel_origin_flips_up_when_bottom_edge_would_overflow() {
        let origin = panel_origin(
            PanelCursor { x: 400, y: 880 },
            PanelSize {
                width: 300,
                height: 240,
            },
            MonitorWorkArea {
                x: 0,
                y: 0,
                width: 1440,
                height: 900,
            },
        );

        assert_eq!(origin, PanelOrigin { x: 412, y: 628 });
    }

    #[test]
    fn panel_origin_clamps_when_panel_is_larger_than_work_area() {
        let origin = panel_origin(
            PanelCursor { x: 50, y: 60 },
            PanelSize {
                width: 900,
                height: 800,
            },
            MonitorWorkArea {
                x: 100,
                y: 120,
                width: 640,
                height: 480,
            },
        );

        assert_eq!(origin, PanelOrigin { x: 100, y: 120 });
    }

    #[test]
    fn restore_strategy_falls_back_without_previous_target() {
        assert_eq!(restore_strategy(None), RestoreStrategy::ClipboardFallback,);
    }

    #[test]
    fn restore_strategy_attempts_restore_with_previous_target() {
        #[cfg(target_os = "macos")]
        let previous_target = Some(super::PreviousTarget::MacOsBundleId(String::from(
            "com.apple.TextEdit",
        )));
        #[cfg(target_os = "windows")]
        let previous_target = Some(super::PreviousTarget::WindowsWindowHandle(String::from(
            "12345",
        )));
        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        let previous_target: Option<super::PreviousTarget> = None;

        let strategy = restore_strategy(previous_target.as_ref());
        #[cfg(any(target_os = "macos", target_os = "windows"))]
        assert_eq!(strategy, RestoreStrategy::AttemptRestore);
        #[cfg(not(any(target_os = "macos", target_os = "windows")))]
        assert_eq!(strategy, RestoreStrategy::ClipboardFallback);
    }
}
