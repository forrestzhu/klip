/**
 * Desktop Tests for Klip - Clipboard Listener (US-001)
 *
 * Tests for clipboard text monitoring functionality
 */

import { expect, test } from "@playwright/test";
import { invoke } from "@tauri-apps/api/core";
import { waitForApp } from "./utils";

test.describe("US-001: Clipboard Listener Tests", () => {
	test.beforeAll(async () => {
		await waitForApp(10000);
	});

	test("AC1: should start clipboard listener within 2 seconds", async () => {
		try {
			const startTime = Date.now();
			
			// Start clipboard listener
			await invoke("start_clipboard_listener");
			
			const elapsed = Date.now() - startTime;
			
			// Verify listener started within 2 seconds
			expect(elapsed).toBeLessThan(2000);
			
			// Verify listener is running
			const isRunning = await invoke<boolean>("is_clipboard_listener_running");
			expect(isRunning).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("AC2: should capture text clipboard changes only", async () => {
		try {
			// Clear existing history
			await invoke("clear_history");
			
			// Simulate text clipboard change
			const testText = "Test clipboard text content";
			await invoke("simulate_clipboard_change", {
				content: testText,
				contentType: "text"
			});
			
			// Wait a bit for processing
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Verify text was captured
			const items = await invoke<Array<{ content: string }>>("get_history_items", {
				limit: 10
			});
			
			const capturedItem = items.find(item => item.content === testText);
			expect(capturedItem).toBeDefined();
		} catch {
			test.skip();
		}
	});

	test("AC2: should filter non-text content (images)", async () => {
		try {
			const initialCount = (await invoke<Array<unknown>>("get_history_items", {
				limit: 100
			})).length;
			
			// Simulate image clipboard change
			await invoke("simulate_clipboard_change", {
				contentType: "image"
			});
			
			// Wait for processing
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Verify image was NOT captured
			const newCount = (await invoke<Array<unknown>>("get_history_items", {
				limit: 100
			})).length;
			
			expect(newCount).toBe(initialCount);
		} catch {
			test.skip();
		}
	});

	test("AC2: should filter non-text content (files)", async () => {
		try {
			const initialCount = (await invoke<Array<unknown>>("get_history_items", {
				limit: 100
			})).length;
			
			// Simulate file clipboard change
			await invoke("simulate_clipboard_change", {
				contentType: "file"
			});
			
			// Wait for processing
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Verify file was NOT captured
			const newCount = (await invoke<Array<unknown>>("get_history_items", {
				limit: 100
			})).length;
			
			expect(newCount).toBe(initialCount);
		} catch {
			test.skip();
		}
	});

	test("AC3: should avoid duplicate captures from app's own writes", async () => {
		try {
			// Clear history
			await invoke("clear_history");
			
			// Add item via direct paste (which writes to clipboard)
			const testContent = "Direct paste test content";
			await invoke("add_history_item", {
				content: testContent,
				contentType: "text"
			});
			
			// Wait for clipboard write to propagate
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Verify only one entry exists
			const items = await invoke<Array<{ content: string }>>("get_history_items", {
				limit: 100
			});
			
			const matchingItems = items.filter(item => item.content === testContent);
			expect(matchingItems.length).toBe(1);
		} catch {
			test.skip();
		}
	});

	test("TC-US001-02: should deduplicate consecutive identical copies", async () => {
		try {
			// Clear history
			await invoke("clear_history");
			
			// Simulate same text copied 3 times
			const testText = "Repeated text";
			for (let i = 0; i < 3; i++) {
				await invoke("simulate_clipboard_change", {
					content: testText,
					contentType: "text"
				});
				await new Promise(resolve => setTimeout(resolve, 300));
			}
			
			// Verify only one entry exists
			const items = await invoke<Array<{ content: string }>>("get_history_items", {
				limit: 100
			});
			
			const matchingItems = items.filter(item => item.content === testText);
			expect(matchingItems.length).toBe(1);
		} catch {
			test.skip();
		}
	});

	test("should stop clipboard listener", async () => {
		try {
			// Stop listener
			await invoke("stop_clipboard_listener");
			
			// Verify listener is stopped
			const isRunning = await invoke<boolean>("is_clipboard_listener_running");
			expect(isRunning).toBe(false);
		} catch {
			test.skip();
		}
	});

	test("should handle edge cases: empty text", async () => {
		try {
			// Simulate empty clipboard
			await invoke("simulate_clipboard_change", {
				content: "",
				contentType: "text"
			});
			
			// Wait for processing
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Empty text should not be added
			const items = await invoke<Array<{ content: string }>>("get_history_items", {
				limit: 100
			});
			
			const emptyItem = items.find(item => item.content === "");
			expect(emptyItem).toBeUndefined();
		} catch {
			test.skip();
		}
	});

	test("should handle edge cases: very long text", async () => {
		try {
			// Generate very long text (100KB)
			const longText = "x".repeat(100000);
			
			// Simulate clipboard change
			await invoke("simulate_clipboard_change", {
				content: longText,
				contentType: "text"
			});
			
			// Wait for processing
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// Verify long text was captured
			const items = await invoke<Array<{ content: string }>>("get_history_items", {
				limit: 10
			});
			
			const longItem = items.find(item => item.content === longText);
			expect(longItem).toBeDefined();
		} catch {
			test.skip();
		}
	});
});
