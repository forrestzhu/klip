/**
 * Hotkey Runtime Module
 *
 * Provides functions to register and manage keyboard shortcuts in Tauri desktop environment.
 * Automatically detects runtime environment and falls back gracefully when not in desktop mode.
 */

import { invoke } from "@tauri-apps/api/core";
import { canonicalizePanelHotkey } from "./hotkeyStorage";

interface RegisterPanelHotkeyPayload {
	shortcut: string;
}

/**
 * Check if running in Tauri desktop runtime
 * @returns true if in desktop environment, false otherwise
 */
export function isDesktopRuntime(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const tauriWindow = window as Window & { __TAURI_INTERNALS__?: unknown };
	return tauriWindow.__TAURI_INTERNALS__ !== undefined;
}

/**
 * Register a global hotkey to toggle the main panel
 * @param shortcut - The keyboard shortcut (e.g., "CommandOrControl+Shift+V")
 * @returns The canonicalized shortcut string
 */
export async function registerDesktopPanelHotkey(
	shortcut: string,
): Promise<string> {
	const payload: RegisterPanelHotkeyPayload = { shortcut };
	const response = await invoke<{ shortcut: string }>("register_panel_hotkey", {
		shortcut: payload.shortcut,
	});
	const canonical = canonicalizePanelHotkey(response.shortcut);
	return canonical.length > 0 ? canonical : response.shortcut;
}

/**
 * Register a global hotkey for snippet alias
 * @param shortcut - The keyboard shortcut (e.g., "CommandOrControl+Shift+S")
 * @returns The canonicalized shortcut string, or empty string if invalid
 */
export async function registerDesktopSnippetAliasHotkey(
	shortcut: string,
): Promise<string> {
	const payload: RegisterPanelHotkeyPayload = { shortcut };
	const response = await invoke<{ shortcut: string }>(
		"register_snippet_alias_hotkey",
		{
			shortcut: payload.shortcut,
		},
	);
	const canonical = canonicalizePanelHotkey(response.shortcut);
	return canonical.length > 0 ? canonical : "";
}

/**
 * Hide the main panel window
 */
export async function hideDesktopPanelWindow(): Promise<void> {
	await invoke("hide_panel_window");
}

/**
 * Open the snippet editor window
 */
export async function openDesktopSnippetEditorWindow(): Promise<void> {
	await invoke("open_snippet_editor_window");
}

/**
 * Open the preferences/settings window
 */
export async function openDesktopPreferencesWindow(): Promise<void> {
	await invoke("open_preferences_window");
}
