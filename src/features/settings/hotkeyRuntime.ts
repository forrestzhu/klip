import { invoke } from "@tauri-apps/api/core";
import { canonicalizePanelHotkey } from "./hotkeyStorage";

interface RegisterPanelHotkeyPayload {
	shortcut: string;
}

export function isDesktopRuntime(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const tauriWindow = window as Window & { __TAURI_INTERNALS__?: unknown };
	return tauriWindow.__TAURI_INTERNALS__ !== undefined;
}

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

export async function hideDesktopPanelWindow(): Promise<void> {
	await invoke("hide_panel_window");
}

export async function openDesktopSnippetEditorWindow(): Promise<void> {
	await invoke("open_snippet_editor_window");
}

export async function openDesktopPreferencesWindow(): Promise<void> {
	await invoke("open_preferences_window");
}
