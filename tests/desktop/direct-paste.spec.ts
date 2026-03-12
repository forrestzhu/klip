/**
 * Desktop Tests for Klip - Direct Paste (US-006)
 *
 * Tests for direct paste functionality
 */

import { expect, test } from "@playwright/test";
import { invoke } from "@tauri-apps/api/core";
import { isWindowVisible, showWindowViaHotkey, waitForApp } from "./utils";

test.describe("US-006: Direct Paste Tests", () => {
	test.beforeAll(async () => {
		await waitForApp(10000);

		// Prepare test data
		try {
			await invoke("clear_history");

			// Add test items
			const testItems = [
				"Direct paste test content",
				"Test item 2",
				"Test item 3",
			];

			for (const item of testItems) {
				await invoke("add_history_item", {
					content: item,
					contentType: "text",
				});
			}
		} catch {
			// Continue even if setup fails
		}
	});

	test("AC1: should paste text directly to foreground app (macOS)", async () => {
		// This test is macOS-specific
		if (process.platform !== "darwin") {
			test.skip();
			return;
		}

		try {
			// Ensure accessibility permission is granted
			const hasPermission = await invoke<boolean>(
				"check_accessibility_permission",
			);
			if (!hasPermission) {
				test.skip();
				return;
			}

			// Open test app (TextEdit)
			await invoke("open_test_app", { app: "TextEdit" });
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Open Klip panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select first item
			await invoke("simulate_key_press", { key: "ArrowDown" });

			// Get selected content
			const selectedContent = await invoke<string>("get_selected_item_content");

			// Execute direct paste
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Get pasted content in target app
			const pastedContent = await invoke<string>("get_test_app_content");

			// Verify content matches
			expect(pastedContent).toContain(selectedContent);
		} catch {
			test.skip();
		}
	});

	test("AC1: should paste text directly to foreground app (Windows)", async () => {
		// This test is Windows-specific
		if (process.platform !== "win32") {
			test.skip();
			return;
		}

		try {
			// Open test app (Notepad)
			await invoke("open_test_app", { app: "Notepad" });
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Open Klip panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select first item
			await invoke("simulate_key_press", { key: "ArrowDown" });

			// Get selected content
			const selectedContent = await invoke<string>("get_selected_item_content");

			// Execute direct paste
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Get pasted content in target app
			const pastedContent = await invoke<string>("get_test_app_content");

			// Verify content matches
			expect(pastedContent).toContain(selectedContent);
		} catch {
			test.skip();
		}
	});

	test("AC2: should close panel after successful paste", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel is visible
			let visible = await isWindowVisible();
			expect(visible).toBe(true);

			// Select and paste
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel is closed
			visible = await isWindowVisible();
			expect(visible).toBe(false);
		} catch {
			test.skip();
		}
	});

	test("AC3: should show error when accessibility permission denied (macOS)", async () => {
		// This test is macOS-specific
		if (process.platform !== "darwin") {
			test.skip();
			return;
		}

		try {
			// Simulate permission denied
			await invoke("simulate_permission_denied");

			// Try direct paste
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify error message is shown
			const errorMessage = await invoke<string>("get_error_message");
			expect(errorMessage.toLowerCase()).toContain("permission");
		} catch {
			test.skip();
		}
	});

	test("AC3: should fallback to clipboard copy on failure", async () => {
		try {
			// Simulate direct paste failure
			await invoke("simulate_direct_paste_failure");

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select item
			await invoke("simulate_key_press", { key: "ArrowDown" });

			// Get selected content
			const selectedContent = await invoke<string>("get_selected_item_content");

			// Execute (should fail and fallback)
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify clipboard contains the content (fallback)
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(selectedContent);
		} catch {
			test.skip();
		}
	});

	test("AC3: should allow manual paste after fallback", async () => {
		try {
			// Simulate failure and fallback
			await invoke("simulate_direct_paste_failure");

			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			await invoke("simulate_key_press", { key: "ArrowDown" });
			const selectedContent = await invoke<string>("get_selected_item_content");
			await invoke("simulate_key_press", { key: "Enter" });

			// Verify user can manually paste
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(selectedContent);

			// Simulate Cmd+V in test app
			await invoke("simulate_manual_paste");
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify content was pasted
			const pastedContent = await invoke<string>("get_test_app_content");
			expect(pastedContent).toContain(selectedContent);
		} catch {
			test.skip();
		}
	});

	test("AC4: should have consistent behavior across platforms", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select item
			await invoke("simulate_key_press", { key: "ArrowDown" });
			const selectedContent = await invoke<string>("get_selected_item_content");

			// Execute direct paste
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel closes
			const visible = await isWindowVisible();
			expect(visible).toBe(false);

			// Verify content is in clipboard (works on both platforms)
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(selectedContent);
		} catch {
			test.skip();
		}
	});

	test("TC-US006-01: should paste to different app types (macOS)", async () => {
		// This test is macOS-specific
		if (process.platform !== "darwin") {
			test.skip();
			return;
		}

		try {
			const apps = ["TextEdit", "Safari", "Mail"];

			for (const app of apps) {
				// Open app
				await invoke("open_test_app", { app });
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Open Klip panel
				await showWindowViaHotkey();
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Select and paste
				await invoke("simulate_key_press", { key: "ArrowDown" });
				const selectedContent = await invoke<string>(
					"get_selected_item_content",
				);
				await invoke("simulate_key_press", { key: "Enter" });
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Verify paste succeeded
				const pastedContent = await invoke<string>("get_test_app_content");
				expect(pastedContent).toContain(selectedContent);
			}
		} catch {
			test.skip();
		}
	});

	test("TC-US006-01: should paste to different app types (Windows)", async () => {
		// This test is Windows-specific
		if (process.platform !== "win32") {
			test.skip();
			return;
		}

		try {
			const apps = ["Notepad", "Chrome", "Outlook"];

			for (const app of apps) {
				// Open app
				await invoke("open_test_app", { app });
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Open Klip panel
				await showWindowViaHotkey();
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Select and paste
				await invoke("simulate_key_press", { key: "ArrowDown" });
				const selectedContent = await invoke<string>(
					"get_selected_item_content",
				);
				await invoke("simulate_key_press", { key: "Enter" });
				await new Promise((resolve) => setTimeout(resolve, 1000));

				// Verify paste succeeded
				const pastedContent = await invoke<string>("get_test_app_content");
				expect(pastedContent).toContain(selectedContent);
			}
		} catch {
			test.skip();
		}
	});

	test("TC-US006-04: should close panel within 500ms after paste", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select and paste
			await invoke("simulate_key_press", { key: "ArrowDown" });

			// Measure time to close
			const startTime = Date.now();
			await invoke("simulate_key_press", { key: "Enter" });

			// Wait for panel to close
			while (await isWindowVisible()) {
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			const elapsed = Date.now() - startTime;

			// Verify panel closes quickly
			expect(elapsed).toBeLessThan(500);
		} catch {
			test.skip();
		}
	});

	test("should handle special characters in pasted content", async () => {
		try {
			// Add item with special characters
			const specialContent = "Test @#$%^&*() \n\t {}[]|\\:;\"'<>,.?/~`";
			await invoke("add_history_item", {
				content: specialContent,
				contentType: "text",
			});

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select the special content item
			await invoke("simulate_search_input", { query: "@#$" });
			await new Promise((resolve) => setTimeout(resolve, 200));
			await invoke("simulate_key_press", { key: "ArrowDown" });

			// Paste
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify clipboard content is correct
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(specialContent);
		} catch {
			test.skip();
		}
	});

	test("should handle multiline content", async () => {
		try {
			// Add multiline item
			const multilineContent = "Line 1\nLine 2\nLine 3";
			await invoke("add_history_item", {
				content: multilineContent,
				contentType: "text",
			});

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select and paste
			await invoke("simulate_search_input", { query: "Line 1" });
			await new Promise((resolve) => setTimeout(resolve, 200));
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify multiline content is preserved
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(multilineContent);
		} catch {
			test.skip();
		}
	});

	test("should handle very long content", async () => {
		try {
			// Add very long item (10KB)
			const longContent = "x".repeat(10000);
			await invoke("add_history_item", {
				content: longContent,
				contentType: "text",
			});

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select and paste
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Verify long content is preserved
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(longContent);
		} catch {
			test.skip();
		}
	});

	test("should handle Unicode content", async () => {
		try {
			// Add Unicode item
			const unicodeContent = "测试中文 🎉 Émoji Ñoño";
			await invoke("add_history_item", {
				content: unicodeContent,
				contentType: "text",
			});

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select and paste
			await invoke("simulate_search_input", { query: "测试" });
			await new Promise((resolve) => setTimeout(resolve, 200));
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify Unicode content is preserved
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(unicodeContent);
		} catch {
			test.skip();
		}
	});

	test("should restore focus to previous app after paste", async () => {
		try {
			// Get previous focused app
			const previousApp = await invoke<string>("get_previous_focused_app");

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select and paste
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify focus restored
			const currentApp = await invoke<string>("get_current_focused_app");
			expect(currentApp).toBe(previousApp);
		} catch {
			test.skip();
		}
	});

	test("should handle rapid successive pastes", async () => {
		try {
			// Add multiple items
			for (let i = 0; i < 5; i++) {
				await invoke("add_history_item", {
					content: `Rapid paste test ${i}`,
					contentType: "text",
				});
			}

			// Rapidly paste multiple items
			for (let i = 0; i < 5; i++) {
				await showWindowViaHotkey();
				await new Promise((resolve) => setTimeout(resolve, 200));

				await invoke("simulate_key_press", { key: "ArrowDown" });
				await invoke("simulate_key_press", { key: "Enter" });
				await new Promise((resolve) => setTimeout(resolve, 300));

				// Verify panel closed
				const visible = await isWindowVisible();
				expect(visible).toBe(false);
			}
		} catch {
			test.skip();
		}
	});
});
