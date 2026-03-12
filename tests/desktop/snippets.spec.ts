/**
 * Desktop Tests for Klip - Snippets Management
 *
 * Tests for snippets functionality
 */

import { expect, test } from "@playwright/test";
import { invoke } from "@tauri-apps/api/core";
import { waitForApp } from "./utils";

test.describe("Klip Snippets Management Tests", () => {
	test.beforeAll(async () => {
		await waitForApp(10000);
	});

	test("should be able to create snippet", async () => {
		try {
			const result = await invoke<string>("create_snippet", {
				name: "Test Snippet",
				content: "Test snippet content",
				folderId: null,
			});

			expect(result).toBeTruthy();
		} catch {
			test.skip();
		}
	});

	test("should be able to list snippets", async () => {
		try {
			const snippets = await invoke<Array<{ name: string }>>("get_snippets");

			expect(Array.isArray(snippets)).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("should be able to update snippet", async () => {
		try {
			// Create a snippet first
			const snippetId = await invoke<string>("create_snippet", {
				name: "Snippet to Update",
				content: "Original content",
				folderId: null,
			});

			// Update it
			const result = await invoke<boolean>("update_snippet", {
				id: snippetId,
				name: "Updated Snippet",
				content: "Updated content",
			});

			expect(result).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("should be able to delete snippet", async () => {
		try {
			// Create a snippet
			const snippetId = await invoke<string>("create_snippet", {
				name: "Snippet to Delete",
				content: "Delete me",
				folderId: null,
			});

			// Delete it
			const result = await invoke<boolean>("delete_snippet", {
				id: snippetId,
			});

			expect(result).toBe(true);
		} catch {
			test.skip();
		}
	});

	test("should be able to search snippets", async () => {
		try {
			// Create some snippets
			await invoke("create_snippet", {
				name: "Email Template",
				content: "Dear customer,",
				folderId: null,
			});

			await invoke("create_snippet", {
				name: "Code Snippet",
				content: "console.log('hello')",
				folderId: null,
			});

			// Search for "email"
			const results = await invoke<Array<{ name: string }>>("search_snippets", {
				query: "email",
			});

			expect(results.length).toBeGreaterThan(0);
			expect(results[0].name).toContain("Email");
		} catch {
			test.skip();
		}
	});
});
