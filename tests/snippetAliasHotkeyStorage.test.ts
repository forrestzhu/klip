import { describe, expect, it } from "vitest";
import {
	DEFAULT_SNIPPET_ALIAS_HOTKEY,
	readSnippetAliasHotkey,
	writeSnippetAliasHotkey,
} from "../src/features/settings";

describe("snippet alias hotkey storage", () => {
	it("returns disabled-by-default value when storage has no value", () => {
		const storage = createStorage();
		expect(readSnippetAliasHotkey(storage)).toBe(DEFAULT_SNIPPET_ALIAS_HOTKEY);
	});

	it("persists and reads normalized values", () => {
		const storage = createStorage();
		const persisted = writeSnippetAliasHotkey(
			storage,
			" CommandOrControl + Shift + KeyS ",
		);

		expect(persisted).toBe("CommandOrControl+Shift+S");
		expect(readSnippetAliasHotkey(storage)).toBe("CommandOrControl+Shift+S");
	});

	it("normalizes runtime formats on read", () => {
		const storage = createStorage();
		storage.setItem("klip.settings.snippetAliasHotkey", "shift+super+KeyS");

		expect(readSnippetAliasHotkey(storage)).toBe("CommandOrControl+Shift+S");
		expect(storage.getItem("klip.settings.snippetAliasHotkey")).toBe(
			"CommandOrControl+Shift+S",
		);
	});

	it("allows empty values to disable the shortcut", () => {
		const storage = createStorage();
		writeSnippetAliasHotkey(storage, "CommandOrControl+Shift+S");

		const persisted = writeSnippetAliasHotkey(storage, "   ");
		expect(persisted).toBe("");
		expect(readSnippetAliasHotkey(storage)).toBe("");
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
