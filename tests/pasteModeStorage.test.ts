import { describe, expect, it } from "vitest";
import {
	DEFAULT_PASTE_MODE,
	PASTE_MODE_CLIPBOARD_ONLY,
	readPasteMode,
	writePasteMode,
} from "../src/features/settings";

describe("paste mode storage", () => {
	it("returns default mode when storage has no value", () => {
		const storage = createStorage();
		expect(readPasteMode(storage)).toBe(DEFAULT_PASTE_MODE);
	});

	it("persists clipboard-only mode", () => {
		const storage = createStorage();
		const persisted = writePasteMode(storage, PASTE_MODE_CLIPBOARD_ONLY);

		expect(persisted).toBe(PASTE_MODE_CLIPBOARD_ONLY);
		expect(readPasteMode(storage)).toBe(PASTE_MODE_CLIPBOARD_ONLY);
	});

	it("falls back to default mode for invalid values", () => {
		const storage = createStorage();
		const persisted = writePasteMode(storage, "invalid-mode");

		expect(persisted).toBe(DEFAULT_PASTE_MODE);
		expect(readPasteMode(storage)).toBe(DEFAULT_PASTE_MODE);
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
