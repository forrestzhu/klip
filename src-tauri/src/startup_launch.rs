use serde::Serialize;
use tauri::{AppHandle, Runtime};
use tauri_plugin_autostart::ManagerExt as AutoLaunchManagerExt;
use thiserror::Error;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StartupLaunchStatusResponse {
	pub enabled: bool,
}

#[derive(Debug, Error)]
enum StartupLaunchError {
	#[error("Failed to read startup launch setting: {0}")]
	Read(String),
	#[error("Failed to enable startup launch: {0}")]
	Enable(String),
	#[error("Failed to disable startup launch: {0}")]
	Disable(String),
}

#[tauri::command]
pub fn get_startup_launch_enabled<R: Runtime>(
	app: AppHandle<R>,
) -> Result<StartupLaunchStatusResponse, String> {
	read_startup_launch_enabled(&app)
		.map(|enabled| StartupLaunchStatusResponse { enabled })
		.map_err(|error| error.to_string())
}

#[tauri::command]
pub fn set_startup_launch_enabled<R: Runtime>(
	app: AppHandle<R>,
	enabled: bool,
) -> Result<StartupLaunchStatusResponse, String> {
	update_startup_launch_enabled(&app, enabled)
		.map(|enabled| StartupLaunchStatusResponse { enabled })
		.map_err(|error| error.to_string())
}

fn read_startup_launch_enabled<R: Runtime>(
	app: &AppHandle<R>,
) -> Result<bool, StartupLaunchError> {
	app.autolaunch()
		.is_enabled()
		.map_err(|error| StartupLaunchError::Read(error.to_string()))
}

fn update_startup_launch_enabled<R: Runtime>(
	app: &AppHandle<R>,
	enabled: bool,
) -> Result<bool, StartupLaunchError> {
	if enabled {
		app.autolaunch()
			.enable()
			.map_err(|error| StartupLaunchError::Enable(error.to_string()))?;
	} else {
		app.autolaunch()
			.disable()
			.map_err(|error| StartupLaunchError::Disable(error.to_string()))?;
	}

	read_startup_launch_enabled(app)
}

#[cfg(test)]
mod tests {
	use super::StartupLaunchError;

	#[test]
	fn startup_launch_error_messages_are_not_empty() {
		let read_error = StartupLaunchError::Read(String::from("read failed")).to_string();
		let enable_error = StartupLaunchError::Enable(String::from("enable failed")).to_string();
		let disable_error =
			StartupLaunchError::Disable(String::from("disable failed")).to_string();

		assert!(!read_error.trim().is_empty());
		assert!(!enable_error.trim().is_empty());
		assert!(!disable_error.trim().is_empty());
	}
}
