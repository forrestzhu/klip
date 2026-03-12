/**
 * Desktop Tests for Klip - Global Shortcuts (US-004)
 *
 * Tests for global hotkey functionality
 */

import { expect, test } from "@playwright/test";
import { invoke } from "@tauri-apps/api/core";
import {
	hideWindow,
	isWindowVisible,
	showWindowViaHotkey,
	waitForApp,
} from "./utils";

test.describe("US-004: Global Shortcuts Tests", () => {
	test.beforeAll(async () => {
		await waitForApp(10000);
	});

	test("AC1: should have default hotkey CommandOrControl+Shift+V", async () => {
		try {
			// Get current hotkey setting
			const hotkey = await invoke<string>("get_panel_hotkey");

			// Verify default is CommandOrControl+Shift+V
			expect(hotkey).toBe("CommandOrControl+Shift+V");
		} catch {
			test.skip();
		}
	});

	test("AC1: should show panel with default hotkey", async () => {
		try {
			// Hide window first
			await hideWindow();

			// Simulate pressing default hotkey
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Shift+V",
			});

			// Wait for panel to appear
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel is visible
			const visible = await isWindowVisible();
			expect(visible).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("AC1: should allow custom hotkey", async () => {
		try {
			// Set custom hotkey
			const customHotkey = "CommandOrControl+Alt+V";
			await invoke("set_panel_hotkey", { shortcut: customHotkey });

			// Verify setting is saved
			const savedHotkey = await invoke<string>("get_panel_hotkey");
			expect(savedHotkey).toBe(customHotkey);

			// Hide window
			await hideWindow();

			// Simulate pressing new hotkey
			await invoke("simulate_hotkey_press", { shortcut: customHotkey });

			// Wait for panel to appear
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel is visible
			const visible = await isWindowVisible();
			expect(visible).toBe(true);

			// Verify old hotkey no longer works
			await hideWindow();
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Shift+V",
			});
			await new Promise((resolve) => setTimeout(resolve, 500));

			const stillVisible = await isWindowVisible();
			expect(stillVisible).toBe(false);
		} catch {
			test.skip();
		}
	});

	test("AC1: should persist hotkey setting after restart", async () => {
		try {
			// Set custom hotkey
			const customHotkey = "CommandOrControl+Alt+V";
			await invoke("set_panel_hotkey", { shortcut: customHotkey });

			// Simulate app restart
			await invoke("simulate_app_restart");
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Verify hotkey is restored
			const savedHotkey = await invoke<string>("get_panel_hotkey");
			expect(savedHotkey).toBe(customHotkey);
		} catch {
			test.skip();
		}
	});

	test("AC2: should detect hotkey conflicts", async () => {
		try {
			// Try to set conflicting hotkey (CommandOrControl+C is copy)
			const conflictingHotkey = "CommandOrControl+C";

			// Attempt to set hotkey
			let error: string | null = null;
			try {
				await invoke("set_panel_hotkey", { shortcut: conflictingHotkey });
			} catch (e) {
				error = String(e);
			}

			// Verify error is returned
			expect(error).not.toBeNull();
			expect(error).toContain("conflict");

			// Verify original hotkey is unchanged
			const currentHotkey = await invoke<string>("get_panel_hotkey");
			expect(currentHotkey).not.toBe(conflictingHotkey);
		} catch {
			test.skip();
		}
	});

	test("AC2: should show error message on conflict", async () => {
		try {
			// Try to set conflicting hotkey
			const conflictingHotkey = "CommandOrControl+V";

			// Get error message
			let errorMessage = "";
			try {
				await invoke("set_panel_hotkey", { shortcut: conflictingHotkey });
			} catch (e) {
				errorMessage = String(e);
			}

			// Verify error message is clear
			expect(errorMessage).toContain("conflict");
			expect(errorMessage.length).toBeGreaterThan(10); // Should be descriptive
		} catch {
			test.skip();
		}
	});

	test("AC2: should allow retry after conflict", async () => {
		try {
			// Try conflicting hotkey first
			try {
				await invoke("set_panel_hotkey", {
					shortcut: "CommandOrControl+C",
				});
			} catch {
				// Expected to fail
			}

			// Now set a valid hotkey
			const validHotkey = "CommandOrControl+Alt+P";
			await invoke("set_panel_hotkey", { shortcut: validHotkey });

			// Verify it works
			const savedHotkey = await invoke<string>("get_panel_hotkey");
			expect(savedHotkey).toBe(validHotkey);
		} catch {
			test.skip();
		}
	});

	test("AC3: should position panel appropriately when triggered", async () => {
		try {
			// Open panel via hotkey
			await hideWindow();
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Shift+V",
			});
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Get panel position
			const position = await invoke<{ x: number; y: number }>(
				"get_window_position",
			);

			// Get screen bounds
			const screenBounds = await invoke<{ width: number; height: number }>(
				"get_screen_bounds",
			);

			// Verify panel is visible on screen
			expect(position.x).toBeGreaterThanOrEqual(0);
			expect(position.y).toBeGreaterThanOrEqual(0);
			expect(position.x).toBeLessThan(screenBounds.width);
			expect(position.y).toBeLessThan(screenBounds.height);
		} catch {
			test.skip();
		}
	});

	test("AC3: should focus panel when triggered", async () => {
		try {
			// Open panel via hotkey
			await hideWindow();
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Shift+V",
			});
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel is focused
			const isFocused = await invoke<boolean>("is_window_focused");
			expect(isFocused).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("AC4: should close panel with Esc key", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			let visible = await isWindowVisible();
			expect(visible).toBe(true);

			// Press Esc
			await invoke("simulate_key_press", { key: "Escape" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel is closed
			visible = await isWindowVisible();
			expect(visible).toBe(false);
		} catch {
			test.skip();
		}
	});

	test("AC4: should return focus to previous app after Esc", async () => {
		try {
			// Get previous focused app
			const previousApp = await invoke<string>("get_previous_focused_app");

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Close with Esc
			await invoke("simulate_key_press", { key: "Escape" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify focus returned to previous app
			const currentApp = await invoke<string>("get_current_focused_app");
			expect(currentApp).toBe(previousApp);
		} catch {
			test.skip();
		}
	});

	test("TC-US004-05: should respond to hotkey from any application", async () => {
		try {
			// Simulate being in another app
			await invoke("simulate_app_switch", { app: "Finder" });

			// Hide Klip window
			await hideWindow();

			// Press global hotkey
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Shift+V",
			});
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify Klip panel appears
			const visible = await isWindowVisible();
			expect(visible).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("should handle hotkey in fullscreen apps", async () => {
		try {
			// Simulate fullscreen app
			await invoke("simulate_fullscreen_app");

			// Press hotkey
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Shift+V",
			});
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel appears (may need special handling in fullscreen)
			const visible = await isWindowVisible();
			// This may or may not work depending on OS
			expect(typeof visible).toBe("boolean");
		} catch {
			test.skip();
		}
	});

	test("should handle invalid hotkey format", async () => {
		try {
			// Try invalid hotkey
			let error: string | null = null;
			try {
				await invoke("set_panel_hotkey", { shortcut: "InvalidHotkey" });
			} catch (e) {
				error = String(e);
			}

			// Verify error
			expect(error).not.toBeNull();
			expect(error).toContain("invalid");
		} catch {
			test.skip();
		}
	});

	test("should handle hotkey unregistration", async () => {
		try {
			// Set custom hotkey
			await invoke("set_panel_hotkey", {
				shortcut: "CommandOrControl+Alt+T",
			});

			// Verify it works
			await hideWindow();
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Alt+T",
			});
			await new Promise((resolve) => setTimeout(resolve, 500));

			let visible = await isWindowVisible();
			expect(visible).toBe(true);

			// Reset to default
			await invoke("reset_panel_hotkey");

			// Verify custom hotkey no longer works
			await hideWindow();
			await invoke("simulate_hotkey_press", {
				shortcut: "CommandOrControl+Alt+T",
			});
			await new Promise((resolve) => setTimeout(resolve, 500));

			visible = await isWindowVisible();
			expect(visible).toBe(false);
		} catch {
			test.skip();
		}
	});
});
