import { invoke } from "@tauri-apps/api/core";

interface StartupLaunchResponse {
	enabled: boolean;
}

export async function readDesktopStartupLaunchEnabled(): Promise<boolean> {
	const response = await invoke<StartupLaunchResponse>(
		"get_startup_launch_enabled",
	);
	return Boolean(response.enabled);
}

export async function writeDesktopStartupLaunchEnabled(
	enabled: boolean,
): Promise<boolean> {
	const response = await invoke<StartupLaunchResponse>(
		"set_startup_launch_enabled",
		{
			enabled,
		},
	);
	return Boolean(response.enabled);
}
