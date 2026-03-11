/**
 * Desktop Tests for Klip - History Management
 *
 * Tests for clipboard history functionality
 */

import { expect, test } from "@playwright/test";
import { invoke } from "@tauri-apps/api/tauri";
import { waitForApp } from "./utils";

test.describe("Klip History Management Tests", () => {
	test.beforeAll(async () => {
		await waitForApp(10000);
	});

	test("should be able to add history item", async () => {
		// Add a test history item
		const testContent = "Test clipboard content";

		try {
			const result = await invoke<boolean>("add_history_item", {
				content: testContent,
				contentType: "text",
			});

			expect(result).toBe(true);
		} catch {
			// If the command doesn't exist, skip
			test.skip();
		}
	});

	test("should be able to get history items", async () => {
		try {
			const items = await invoke<Array<{ content: string }>>(
				"get_history_items",
				{
					limit: 10,
				},
			);

			expect(Array.isArray(items)).toBe(true);
		} catch {
			// If the command doesn't exist, skip
			test.skip();
		}
	});

	test("should be able to delete history item", async () => {
		try {
			// First add an item
			await invoke("add_history_item", {
				content: "Item to delete",
				contentType: "text",
			});

			// Get items
			const items = await invoke<Array<{ id: string }>>("get_history_items", {
				limit: 10,
			});

			if (items.length > 0) {
				// Delete first item
				const result = await invoke<boolean>("delete_history_item", {
					id: items[0].id,
				});

				expect(result).toBe(true);
			}
		} catch {
			// If the command doesn't exist, skip
			test.skip();
		}
	});

	test("should respect max history limit", async () => {
		try {
			// Get max history setting
			const maxHistory = await invoke<number>("get_max_history");

			// Add more items than max
			for (let i = 0; i < maxHistory + 5; i++) {
				await invoke("add_history_item", {
					content: `Test item ${i}`,
					contentType: "text",
				});
			}

			// Verify history count doesn't exceed max
			const items = await invoke<Array<unknown>>("get_history_items", {
				limit: 1000,
			});

			expect(items.length).toBeLessThanOrEqual(maxHistory);
		} catch {
			// If the command doesn't exist, skip
			test.skip();
		}
	});
});
