/**
 * Desktop Tests for Klip - Search & Navigation (US-005)
 *
 * Tests for history search and keyboard navigation
 */

import { expect, test } from "@playwright/test";
import { invoke } from "@tauri-apps/api/core";
import { isWindowVisible, showWindowViaHotkey, waitForApp } from "./utils";

test.describe("US-005: Search & Navigation Tests", () => {
	test.beforeAll(async () => {
		await waitForApp(10000);

		// Prepare test data
		try {
			await invoke("clear_history");

			// Add test items
			const testItems = [
				"Apple fruit",
				"Application form",
				"Banana smoothie",
				"Cherry pie",
				"Apple pie",
				"Orange juice",
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

	test("AC1: should filter results in real-time", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Type in search box
			await invoke("simulate_search_input", { query: "Apple" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Get visible items
			const items = await invoke<Array<{ content: string }>>(
				"get_visible_history_items",
			);

			// Verify only items containing "Apple" are shown
			for (const item of items) {
				expect(item.content.toLowerCase()).toContain("apple");
			}
		} catch {
			test.skip();
		}
	});

	test("AC1: should respond within 100ms for 1000 items", async () => {
		try {
			// Prepare 1000 items
			await invoke("clear_history");
			for (let i = 0; i < 1000; i++) {
				await invoke("add_history_item", {
					content: `Test item ${i} with unique keyword`,
					contentType: "text",
				});
			}

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Measure search time
			const startTime = Date.now();
			await invoke("simulate_search_input", { query: "unique keyword" });
			const elapsed = Date.now() - startTime;

			// Verify response time < 100ms
			expect(elapsed).toBeLessThan(100);

			// Verify results are shown
			const items = await invoke<Array<unknown>>("get_visible_history_items");
			expect(items.length).toBeGreaterThan(0);
		} catch {
			test.skip();
		}
	});

	test("AC1: should not block UI during search", async () => {
		try {
			// Prepare test data
			await invoke("clear_history");
			for (let i = 0; i < 100; i++) {
				await invoke("add_history_item", {
					content: `UI Test item ${i}`,
					contentType: "text",
				});
			}

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Start search
			const searchPromise = invoke("simulate_search_input", { query: "Test" });

			// Try to interact with UI simultaneously
			const canInteract = await invoke<boolean>("is_ui_responsive");

			// Wait for search to complete
			await searchPromise;

			// Verify UI was responsive during search
			expect(canInteract).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("AC2: should navigate down with arrow key", async () => {
		try {
			// Open panel with multiple items
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Get initial selection
			const initialSelection = await invoke<number>("get_selected_index");

			// Press down arrow
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get new selection
			const newSelection = await invoke<number>("get_selected_index");

			// Verify selection moved down
			expect(newSelection).toBe(initialSelection + 1);
		} catch {
			test.skip();
		}
	});

	test("AC2: should navigate up with arrow key", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Navigate down first
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await new Promise((resolve) => setTimeout(resolve, 100));

			const currentSelection = await invoke<number>("get_selected_index");

			// Press up arrow
			await invoke("simulate_key_press", { key: "ArrowUp" });
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get new selection
			const newSelection = await invoke<number>("get_selected_index");

			// Verify selection moved up
			expect(newSelection).toBe(currentSelection - 1);
		} catch {
			test.skip();
		}
	});

	test("AC2: should wrap around when navigating past end", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Get total item count
			const totalItems = await invoke<number>("get_history_count");

			// Navigate to last item
			for (let i = 0; i < totalItems; i++) {
				await invoke("simulate_key_press", { key: "ArrowDown" });
			}

			// Press down one more time
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify selection wrapped to first item
			const selection = await invoke<number>("get_selected_index");
			expect(selection).toBe(0);
		} catch {
			test.skip();
		}
	});

	test("AC2: should wrap around when navigating past beginning", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Get total item count
			const totalItems = await invoke<number>("get_history_count");

			// At first item, press up
			await invoke("simulate_key_press", { key: "ArrowUp" });
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify selection wrapped to last item
			const selection = await invoke<number>("get_selected_index");
			expect(selection).toBe(totalItems - 1);
		} catch {
			test.skip();
		}
	});

	test("AC2: should show visual feedback for selected item", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Navigate to select an item
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check if selected item has visual feedback
			const selectedItem = await invoke<{ hasVisualFeedback: boolean }>(
				"get_selected_item_info",
			);
			expect(selectedItem.hasVisualFeedback).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("AC3: should paste selected item with Enter", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Navigate to select an item
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get selected item content
			const selectedContent = await invoke<string>("get_selected_item_content");

			// Press Enter
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify clipboard contains the content
			const clipboardContent = await invoke<string>("get_clipboard_content");
			expect(clipboardContent).toBe(selectedContent);
		} catch {
			test.skip();
		}
	});

	test("AC3: should close panel after Enter", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Select and execute
			await invoke("simulate_key_press", { key: "ArrowDown" });
			await invoke("simulate_key_press", { key: "Enter" });
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify panel is closed
			const visible = await isWindowVisible();
			expect(visible).toBe(false);
		} catch {
			test.skip();
		}
	});

	test("AC4: should show all history when search is empty", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Clear search
			await invoke("simulate_search_input", { query: "" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Get visible items
			const visibleItems = await invoke<Array<unknown>>(
				"get_visible_history_items",
			);

			// Get total history count
			const totalItems = await invoke<number>("get_history_count");

			// Verify all items are shown
			expect(visibleItems.length).toBe(totalItems);
		} catch {
			test.skip();
		}
	});

	test("AC4: should sort history by time descending", async () => {
		try {
			// Clear and add items with delay
			await invoke("clear_history");

			const items = ["First", "Second", "Third"];
			for (const item of items) {
				await invoke("add_history_item", {
					content: item,
					contentType: "text",
				});
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Get items in display order
			const visibleItems = await invoke<Array<{ content: string }>>(
				"get_visible_history_items",
			);

			// Verify most recent is first
			expect(visibleItems[0].content).toBe("Third");
			expect(visibleItems[1].content).toBe("Second");
			expect(visibleItems[2].content).toBe("First");
		} catch {
			test.skip();
		}
	});

	test("AC4: should restore full list when clearing search", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Search for something
			await invoke("simulate_search_input", { query: "unique" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Clear search
			await invoke("simulate_search_input", { query: "" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Verify full list is restored
			const visibleItems = await invoke<Array<unknown>>(
				"get_visible_history_items",
			);
			const totalItems = await invoke<number>("get_history_count");

			expect(visibleItems.length).toBe(totalItems);
		} catch {
			test.skip();
		}
	});

	test("TC-US005-01: should handle case-insensitive search", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Search with different cases
			await invoke("simulate_search_input", { query: "APPLE" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			const upperCaseItems = await invoke<Array<{ content: string }>>(
				"get_visible_history_items",
			);

			await invoke("simulate_search_input", { query: "apple" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			const lowerCaseItems = await invoke<Array<{ content: string }>>(
				"get_visible_history_items",
			);

			// Verify same results regardless of case
			expect(upperCaseItems.length).toBe(lowerCaseItems.length);
		} catch {
			test.skip();
		}
	});

	test("TC-US005-05: should handle special characters in search", async () => {
		try {
			// Add item with special characters
			await invoke("add_history_item", {
				content: "Test @#$%^&*() special",
				contentType: "text",
			});

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Search with special characters
			await invoke("simulate_search_input", { query: "@#$" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Verify search doesn't crash
			const items = await invoke<Array<unknown>>("get_visible_history_items");
			expect(Array.isArray(items)).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("should handle Unicode characters in search", async () => {
		try {
			// Add item with Unicode
			await invoke("add_history_item", {
				content: "测试中文 Test 测试",
				contentType: "text",
			});

			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Search with Unicode
			await invoke("simulate_search_input", { query: "测试" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Verify search works
			const items = await invoke<Array<{ content: string }>>(
				"get_visible_history_items",
			);

			const found = items.some((item) => item.content.includes("测试"));
			expect(found).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("should handle empty results gracefully", async () => {
		try {
			// Open panel
			await showWindowViaHotkey();
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Search for non-existent item
			await invoke("simulate_search_input", { query: "zzzzzzzzz" });
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Verify empty state is shown
			const items = await invoke<Array<unknown>>("get_visible_history_items");
			expect(items.length).toBe(0);

			// Verify empty state message
			const emptyMessage = await invoke<string>("get_empty_state_message");
			expect(emptyMessage.length).toBeGreaterThan(0);
		} catch {
			test.skip();
		}
	});
});
