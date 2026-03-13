/**
 * Tests for Hotkey Runtime Module
 *
 * Tests hotkey registration and desktop runtime detection.
 * Note: Desktop-specific functions require Tauri runtime and are tested in E2E tests.
 */

import { describe, expect, it, vi } from "vitest";
import { isDesktopRuntime } from "../src/features/settings/hotkeyRuntime";

describe("Hotkey Runtime", () => {
	describe("isDesktopRuntime", () => {
		it("returns false when window is undefined", () => {
			const originalWindow = globalThis.window;
			// @ts-expect-error - Testing undefined window
			delete globalThis.window;

			expect(isDesktopRuntime()).toBe(false);

			globalThis.window = originalWindow;
		});

		it("returns false when __TAURI_INTERNALS__ is undefined", () => {
			const originalWindow = globalThis.window;
			Object.defineProperty(globalThis, "window", {
				value: {},
				writable: true,
				configurable: true,
			});

			expect(isDesktopRuntime()).toBe(false);

			globalThis.window = originalWindow;
		});

		it("returns true when __TAURI_INTERNALS__ is defined", () => {
			const originalWindow = globalThis.window;
			Object.defineProperty(globalThis, "window", {
				value: {
					__TAURI_INTERNALS__: {},
				},
				writable: true,
				configurable: true,
			});

			expect(isDesktopRuntime()).toBe(true);

			globalThis.window = originalWindow;
		});
	});
});
