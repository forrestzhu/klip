import { invoke } from "@tauri-apps/api/core";

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
	return response.shortcut;
}

export async function hideDesktopPanelWindow(): Promise<void> {
	await invoke("hide_panel_window");
}
