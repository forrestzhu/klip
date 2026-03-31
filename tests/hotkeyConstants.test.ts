/**
 * Tests for Hotkey Constants module
 */

import { describe, expect, it } from "vitest";
import {
	DEFAULT_PANEL_HOTKEY,
	DEFAULT_SNIPPET_ALIAS_HOTKEY,
	PANEL_HOTKEY_STORAGE_KEY,
	SNIPPET_ALIAS_HOTKEY_STORAGE_KEY,
	SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT,
} from "../src/features/settings/hotkey.constants";

describe("hotkeyConstants", () => {
	describe("DEFAULT_PANEL_HOTKEY", () => {
		it("should be defined", () => {
			expect(DEFAULT_PANEL_HOTKEY).toBeDefined();
		});

		it("should use CommandOrControl for cross-platform support", () => {
			expect(DEFAULT_PANEL_HOTKEY).toBe("CommandOrControl+Shift+V");
		});

		it("should include Shift modifier", () => {
			expect(DEFAULT_PANEL_HOTKEY).toContain("Shift");
		});

		it("should include V key", () => {
			expect(DEFAULT_PANEL_HOTKEY).toContain("V");
		});

		it("should use + as separator", () => {
			expect(DEFAULT_PANEL_HOTKEY.split("+")).toHaveLength(3);
		});
	});

	describe("PANEL_HOTKEY_STORAGE_KEY", () => {
		it("should be defined", () => {
			expect(PANEL_HOTKEY_STORAGE_KEY).toBeDefined();
		});

		it("should use klip namespace", () => {
			expect(PANEL_HOTKEY_STORAGE_KEY).toContain("klip.settings");
		});

		it("should be a valid storage key format", () => {
			expect(PANEL_HOTKEY_STORAGE_KEY).toMatch(/^klip\.[a-zA-Z.]+$/);
		});
	});

	describe("DEFAULT_SNIPPET_ALIAS_HOTKEY", () => {
		it("should be defined", () => {
			expect(DEFAULT_SNIPPET_ALIAS_HOTKEY).toBeDefined();
		});

		it("should be empty string (disabled by default)", () => {
			expect(DEFAULT_SNIPPET_ALIAS_HOTKEY).toBe("");
		});
	});

	describe("SNIPPET_ALIAS_HOTKEY_STORAGE_KEY", () => {
		it("should be defined", () => {
			expect(SNIPPET_ALIAS_HOTKEY_STORAGE_KEY).toBeDefined();
		});

		it("should use klip namespace", () => {
			expect(SNIPPET_ALIAS_HOTKEY_STORAGE_KEY).toContain("klip.settings");
		});

		it("should be a valid storage key format", () => {
			expect(SNIPPET_ALIAS_HOTKEY_STORAGE_KEY).toMatch(/^klip\.[a-zA-Z.]+$/);
		});
	});

	describe("SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT", () => {
		it("should be defined", () => {
			expect(SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT).toBeDefined();
		});

		it("should use klip protocol", () => {
			expect(SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT).toContain("klip:");
		});

		it("should be a valid custom event name", () => {
			expect(SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT).toMatch(/^klip:[a-z_/-]+$/);
		});
	});
});
