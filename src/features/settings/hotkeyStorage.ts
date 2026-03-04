import {
	DEFAULT_PANEL_HOTKEY,
	PANEL_HOTKEY_STORAGE_KEY,
} from "./hotkey.constants";

export function readPanelHotkey(storage: Storage): string {
	const rawValue = storage.getItem(PANEL_HOTKEY_STORAGE_KEY);
	if (rawValue === null) {
		return DEFAULT_PANEL_HOTKEY;
	}

	const normalized = normalizeHotkeyValue(rawValue);
	if (normalized.length === 0) {
		return DEFAULT_PANEL_HOTKEY;
	}

	return normalized;
}

export function writePanelHotkey(storage: Storage, value: string): string {
	const normalized = normalizeHotkeyValue(value);
	const persistedValue =
		normalized.length === 0 ? DEFAULT_PANEL_HOTKEY : normalized;

	storage.setItem(PANEL_HOTKEY_STORAGE_KEY, persistedValue);
	return persistedValue;
}

function normalizeHotkeyValue(value: string): string {
	return value.trim();
}
