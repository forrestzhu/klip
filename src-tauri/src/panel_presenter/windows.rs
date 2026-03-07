use std::{
    process::Command,
    thread,
    time::{Duration, Instant},
};

use tauri::{AppHandle, Runtime, WebviewWindow};

use super::PreviousTarget;

const RESTORE_TIMEOUT: Duration = Duration::from_millis(400);
const RESTORE_POLL_INTERVAL: Duration = Duration::from_millis(25);
const POWERSHELL_COMMON: &str = r#"
Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class KlipWin32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  public static extern bool SetForegroundWindow(IntPtr hWnd);

  [DllImport("user32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

  [DllImport("user32.dll")]
  [return: MarshalAs(UnmanagedType.Bool)]
  public static extern bool IsIconic(IntPtr hWnd);
}
'@
"#;

pub(super) fn configure_window_for_panel<R: Runtime>(
    _window: &WebviewWindow<R>,
) -> tauri::Result<()> {
    Ok(())
}

pub(super) fn capture_previous_target<R: Runtime>(_app: &AppHandle<R>) -> Option<PreviousTarget> {
    let handle = capture_foreground_window_handle()?;
    Some(PreviousTarget::WindowsWindowHandle(handle))
}

pub(super) fn restore_previous_target<R: Runtime>(
    _app: &AppHandle<R>,
    previous_target: &PreviousTarget,
) -> Result<(), String> {
    let PreviousTarget::WindowsWindowHandle(handle) = previous_target else {
        return Err(String::from(
            "Invalid previous target for Windows direct paste.",
        ));
    };

    activate_window_handle(handle)?;
    wait_for_foreground_window_handle(handle)
}

fn wait_for_foreground_window_handle(target_handle: &str) -> Result<(), String> {
    let deadline = Instant::now() + RESTORE_TIMEOUT;

    loop {
        if capture_foreground_window_handle().as_deref() == Some(target_handle) {
            return Ok(());
        }

        if Instant::now() >= deadline {
            break;
        }

        thread::sleep(RESTORE_POLL_INTERVAL);
    }

    Err(format!(
        "Timed out while restoring focus to Windows window `{target_handle}`.",
    ))
}

fn capture_foreground_window_handle() -> Option<String> {
    run_powershell(&format!(
        r#"
{POWERSHELL_COMMON}
[KlipWin32]::GetForegroundWindow().ToInt64()
"#,
    ))
    .ok()
    .map(|output| output.trim().to_string())
    .filter(|output| !output.is_empty() && output != "0")
}

fn activate_window_handle(handle: &str) -> Result<(), String> {
    run_powershell(&format!(
        r#"
{POWERSHELL_COMMON}
$hwnd = [intptr]{handle}
if ([KlipWin32]::IsIconic($hwnd)) {{ [KlipWin32]::ShowWindow($hwnd, 9) | Out-Null }}
if (-not [KlipWin32]::SetForegroundWindow($hwnd)) {{ throw "SetForegroundWindow failed" }}
"#,
    ))
    .map(|_| ())
}

fn run_powershell(script: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-Command")
        .arg(script)
        .output()
        .map_err(|error| error.to_string())?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    if stderr.is_empty() {
        Err(String::from("powershell execution failed"))
    } else {
        Err(stderr)
    }
}
