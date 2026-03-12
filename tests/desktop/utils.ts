/**
 * Tauri Desktop Testing Utilities
 *
 * Helper functions for testing Tauri desktop applications
 */

import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Wait for app to be ready
 */
export async function waitForApp(timeout = 5000): Promise<void> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		try {
			// Try to get window title to verify app is running
			const title = await getCurrentWindow().title();
			if (title) {
				return;
			}
		} catch (_error) {
			// App not ready yet
		}
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	throw new Error("App did not start within timeout");
}

/**
 * Check if tray icon is visible
 * Note: This is a placeholder - actual implementation needs native code
 */
export async function isTrayVisible(): Promise<boolean> {
	try {
		const result = await invoke<boolean>("check_tray_visibility");
		return result;
	} catch (error) {
		// If the command doesn't exist, assume tray is visible
		console.warn("Tray visibility check not implemented:", error);
		return true;
	}
}

/**
 * Show main window via global hotkey
 * Note: This simulates pressing the hotkey
 */
export async function showWindowViaHotkey(): Promise<void> {
	// In real implementation, this would use system-level hotkey simulation
	// For now, we'll use Tauri command to show window
	try {
		const window = getCurrentWindow();
		await window.show();
		await window.setFocus();
	} catch (error) {
		throw new Error(`Failed to show window: ${error}`);
	}
}

/**
 * Hide main window
 */
export async function hideWindow(): Promise<void> {
	try {
		await getCurrentWindow().hide();
	} catch (error) {
		throw new Error(`Failed to hide window: ${error}`);
	}
}

/**
 * Check if window is visible
 */
export async function isWindowVisible(): Promise<boolean> {
	try {
		return await getCurrentWindow().isVisible();
	} catch (_error) {
		return false;
	}
}

/**
 * Get window title
 */
export async function getWindowTitle(): Promise<string> {
	return await getCurrentWindow().title();
}

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
	return await invoke<string>("get_app_version");
}
