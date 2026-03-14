/**
 * Startup Launch Runtime
 *
 * Manages the application's auto-start behavior on system boot.
 * This module provides desktop-specific functionality that requires Tauri runtime.
 *
 * @module startupLaunchRuntime
 */

import { invoke } from "@tauri-apps/api/core";

interface StartupLaunchResponse {
	enabled: boolean;
}

/**
 * Reads the current startup launch status.
 *
 * @returns A promise that resolves to `true` if auto-start is enabled, `false` otherwise
 * @throws {Error} If called in a non-desktop environment or Tauri command fails
 *
 * @example
 * ```ts
 * const isEnabled = await readDesktopStartupLaunchEnabled();
 * console.log(isEnabled ? 'Auto-start enabled' : 'Auto-start disabled');
 * ```
 */
export async function readDesktopStartupLaunchEnabled(): Promise<boolean> {
	const response = await invoke<StartupLaunchResponse>(
		"get_startup_launch_enabled",
	);
	return Boolean(response.enabled);
}

/**
 * Enables or disables the startup launch behavior.
 *
 * @param enabled - Whether to enable (`true`) or disable (`false`) auto-start
 * @returns A promise that resolves to the new enabled state
 * @throws {Error} If called in a non-desktop environment or Tauri command fails
 *
 * @example
 * ```ts
 * // Enable auto-start
 * await writeDesktopStartupLaunchEnabled(true);
 *
 * // Disable auto-start
 * await writeDesktopStartupLaunchEnabled(false);
 * ```
 */
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
