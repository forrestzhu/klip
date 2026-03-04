import { describe, expect, it } from "vitest";
import {
	DEFAULT_PANEL_HOTKEY,
	readPanelHotkey,
	writePanelHotkey,
} from "../src/features/settings";

describe("panel hotkey storage", () => {
	it("returns default shortcut when storage has no value", () => {
		const storage = createStorage();
		expect(readPanelHotkey(storage)).toBe(DEFAULT_PANEL_HOTKEY);
	});

	it("persists and reads normalized hotkey values", () => {
		const storage = createStorage();
		const persisted = writePanelHotkey(storage, "  CommandOrControl+Shift+V  ");

		expect(persisted).toBe("CommandOrControl+Shift+V");
		expect(readPanelHotkey(storage)).toBe("CommandOrControl+Shift+V");
	});

	it("falls back to default when writing empty values", () => {
		const storage = createStorage();
		const persisted = writePanelHotkey(storage, "   ");

		expect(persisted).toBe(DEFAULT_PANEL_HOTKEY);
		expect(readPanelHotkey(storage)).toBe(DEFAULT_PANEL_HOTKEY);
	});
});

function createStorage(): Storage {
	const map = new Map<string, string>();

	return {
		getItem(key: string) {
			return map.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			map.set(key, value);
		},
		removeItem(key: string) {
			map.delete(key);
		},
		clear() {
			map.clear();
		},
		key(index: number) {
			return Array.from(map.keys())[index] ?? null;
		},
		get length() {
			return map.size;
		},
	};
}
