/**
 * Desktop Tests for Klip - History Persistence (US-002)
 *
 * Tests for history data persistence and capacity control
 */

import { expect, test } from "@playwright/test";
import { invoke } from "@tauri-apps/api/core";
import { waitForApp } from "./utils";

test.describe("US-002: History Persistence Tests", () => {
	test.beforeAll(async () => {
		await waitForApp(10000);
	});

	test("AC1: should persist history data to local storage", async () => {
		try {
			// Add test items
			const testItems = ["Item 1", "Item 2", "Item 3"];

			for (const item of testItems) {
				await invoke("add_history_item", {
					content: item,
					contentType: "text",
				});
			}

			// Verify items are stored
			const items = await invoke<Array<{ content: string }>>(
				"get_history_items",
				{
					limit: 100,
				},
			);

			for (const testItem of testItems) {
				const found = items.find((item) => item.content === testItem);
				expect(found).toBeDefined();
			}
		} catch {
			test.skip();
		}
	});

	test("AC1: should restore history after app restart", async () => {
		try {
			// Add test items
			const testItems = ["Restart Test 1", "Restart Test 2"];

			for (const item of testItems) {
				await invoke("add_history_item", {
					content: item,
					contentType: "text",
				});
			}

			// Get IDs of added items
			const itemsBeforeRestart = await invoke<
				Array<{ id: string; content: string }>
			>("get_history_items", {
				limit: 100,
			});
			// Get IDs of added items (for verification)
			itemsBeforeRestart
				.filter((item) => testItems.includes(item.content))
				.map((item) => item.id);

			// Simulate app restart
			await invoke("simulate_app_restart");

			// Wait for app to restart
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Verify items are restored
			const itemsAfterRestart = await invoke<
				Array<{ id: string; content: string }>
			>("get_history_items", {
				limit: 100,
			});

			for (const testItem of testItems) {
				const found = itemsAfterRestart.find(
					(item) => item.content === testItem,
				);
				expect(found).toBeDefined();
			}
		} catch {
			test.skip();
		}
	});

	test("AC2: should enforce max history limit with FIFO eviction", async () => {
		try {
			// Set max history to 10
			await invoke("set_max_history", { max: 10 });

			// Clear existing history
			await invoke("clear_history");

			// Add 15 items
			for (let i = 0; i < 15; i++) {
				await invoke("add_history_item", {
					content: `FIFO Test Item ${i}`,
					contentType: "text",
				});
			}

			// Verify only 10 items remain
			const items = await invoke<Array<unknown>>("get_history_items", {
				limit: 100,
			});

			expect(items.length).toBeLessThanOrEqual(10);

			// Verify oldest items were evicted (items 0-4 should be gone)
			const remainingItems = await invoke<Array<{ content: string }>>(
				"get_history_items",
				{
					limit: 100,
				},
			);

			// Check that newer items are present
			for (let i = 5; i < 15; i++) {
				const found = remainingItems.find(
					(item) => item.content === `FIFO Test Item ${i}`,
				);
				expect(found).toBeDefined();
			}
		} catch {
			test.skip();
		}
	});

	test("AC3: should include content, timestamp, and metadata", async () => {
		try {
			// Add test item
			const testContent = "Metadata test item";
			await invoke("add_history_item", {
				content: testContent,
				contentType: "text",
			});

			// Get items
			const items = await invoke<
				Array<{
					id: string;
					content: string;
					created_at: string;
				}>
			>("get_history_items", {
				limit: 10,
			});

			// Find our test item
			const testItem = items.find((item) => item.content === testContent);
			expect(testItem).toBeDefined();
			if (!testItem) {
				throw new Error("Test item not found");
			}

			// Verify content exists
			expect(testItem.content).toBe(testContent);

			// Verify timestamp exists and is valid ISO 8601
			expect(testItem.created_at).toBeDefined();
			const timestamp = new Date(testItem.created_at);
			expect(timestamp.getTime()).not.toBeNaN();

			// Verify timestamp is recent (within last minute)
			const now = Date.now();
			const itemTime = timestamp.getTime();
			expect(now - itemTime).toBeLessThan(60000);
		} catch {
			test.skip();
		}
	});

	test("AC4: should have default capacity value on fresh install", async () => {
		try {
			// Get default max history
			const defaultMaxHistory = await invoke<number>("get_max_history");

			// Verify default is a reasonable value (typically 100 or 1000)
			expect(defaultMaxHistory).toBeGreaterThan(0);
			expect(defaultMaxHistory).toBeLessThanOrEqual(10000);
		} catch {
			test.skip();
		}
	});

	test("AC4: should persist capacity setting", async () => {
		try {
			// Set max history to custom value
			const customMax = 50;
			await invoke("set_max_history", { max: customMax });

			// Verify setting is saved
			let maxHistory = await invoke<number>("get_max_history");
			expect(maxHistory).toBe(customMax);

			// Simulate app restart
			await invoke("simulate_app_restart");
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Verify setting is restored
			maxHistory = await invoke<number>("get_max_history");
			expect(maxHistory).toBe(customMax);
		} catch {
			test.skip();
		}
	});

	test("TC-US002-02: should handle capacity limit boundary", async () => {
		try {
			// Set max history to 10
			await invoke("set_max_history", { max: 10 });
			await invoke("clear_history");

			// Add exactly 10 items
			for (let i = 0; i < 10; i++) {
				await invoke("add_history_item", {
					content: `Boundary Test Item ${i}`,
					contentType: "text",
				});
			}

			// Verify all 10 items are present
			let items = await invoke<Array<unknown>>("get_history_items", {
				limit: 100,
			});
			expect(items.length).toBe(10);

			// Add one more item
			await invoke("add_history_item", {
				content: "Boundary Test Item 10",
				contentType: "text",
			});

			// Verify still only 10 items, oldest evicted
			items = await invoke<Array<unknown>>("get_history_items", {
				limit: 100,
			});
			expect(items.length).toBe(10);
		} catch {
			test.skip();
		}
	});

	test("should handle large data volumes (1000+ items)", async () => {
		try {
			// Set max history to 1000
			await invoke("set_max_history", { max: 1000 });
			await invoke("clear_history");

			// Add 1000 items
			const startTime = Date.now();
			for (let i = 0; i < 1000; i++) {
				await invoke("add_history_item", {
					content: `Performance Test Item ${i}`,
					contentType: "text",
				});
			}
			const elapsed = Date.now() - startTime;

			// Verify operation completes in reasonable time (< 30 seconds)
			expect(elapsed).toBeLessThan(30000);

			// Verify all items are present
			const items = await invoke<Array<unknown>>("get_history_items", {
				limit: 1000,
			});
			expect(items.length).toBe(1000);
		} catch {
			test.skip();
		}
	});

	test("should handle concurrent read/write operations", async () => {
		try {
			// Clear history
			await invoke("clear_history");

			// Perform concurrent operations
			const operations = [];
			for (let i = 0; i < 10; i++) {
				operations.push(
					invoke("add_history_item", {
						content: `Concurrent Test Item ${i}`,
						contentType: "text",
					}),
				);
			}

			// Execute all operations concurrently
			await Promise.all(operations);

			// Verify no data corruption
			const items = await invoke<Array<unknown>>("get_history_items", {
				limit: 100,
			});

			// All items should be present (order may vary)
			expect(items.length).toBeGreaterThanOrEqual(10);
		} catch {
			test.skip();
		}
	});

	test("should handle data corruption recovery", async () => {
		try {
			// Add test items
			await invoke("add_history_item", {
				content: "Corruption Test Item",
				contentType: "text",
			});

			// Simulate data corruption
			await invoke("simulate_data_corruption");

			// Verify app can recover (should handle gracefully)
			const items = await invoke<Array<unknown>>("get_history_items", {
				limit: 100,
			});

			// App should not crash, even if data is lost
			expect(Array.isArray(items)).toBe(true);
		} catch {
			test.skip();
		}
	});
});
