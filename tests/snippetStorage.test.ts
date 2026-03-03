import { describe, expect, it } from "vitest";
import { createBrowserSnippetsStorage } from "../src/features/snippets";

class InMemoryKeyValueStorage {
	private readonly storage = new Map<string, string>();

	public getItem(key: string): string | null {
		return this.storage.get(key) ?? null;
	}

	public setItem(key: string, value: string): void {
		this.storage.set(key, value);
	}
}

describe("createBrowserSnippetsStorage", () => {
	it("returns null when no state exists", async () => {
		const storage = new InMemoryKeyValueStorage();
		const snippetsStorage = createBrowserSnippetsStorage(storage);

		await expect(snippetsStorage.load()).resolves.toBeNull();
	});

	it("saves and loads snippets state", async () => {
		const storage = new InMemoryKeyValueStorage();
		const snippetsStorage = createBrowserSnippetsStorage(
			storage,
			"snippets.test",
		);

		await snippetsStorage.save({
			schemaVersion: 1,
			folders: [
				{
					id: "folder-1",
					name: "General",
					createdAt: "2026-03-03T00:00:00.000Z",
					updatedAt: "2026-03-03T00:00:00.000Z",
				},
			],
			snippets: [
				{
					id: "snippet-1",
					title: "Greeting",
					text: "hello",
					folderId: "folder-1",
					createdAt: "2026-03-03T00:00:00.000Z",
					updatedAt: "2026-03-03T00:00:00.000Z",
				},
			],
		});

		await expect(snippetsStorage.load()).resolves.toEqual({
			schemaVersion: 1,
			folders: [
				{
					id: "folder-1",
					name: "General",
					createdAt: "2026-03-03T00:00:00.000Z",
					updatedAt: "2026-03-03T00:00:00.000Z",
				},
			],
			snippets: [
				{
					id: "snippet-1",
					title: "Greeting",
					text: "hello",
					folderId: "folder-1",
					createdAt: "2026-03-03T00:00:00.000Z",
					updatedAt: "2026-03-03T00:00:00.000Z",
				},
			],
		});
	});

	it("normalizes malformed entries", async () => {
		const storage = new InMemoryKeyValueStorage();
		storage.setItem(
			"snippets.test",
			JSON.stringify({
				schemaVersion: "1",
				folders: [
					{
						id: "folder-1",
						name: "General",
						createdAt: "2026-03-03T00:00:00.000Z",
						updatedAt: "2026-03-03T00:00:00.000Z",
					},
					{ id: 2 },
				],
				snippets: [
					{
						id: "snippet-1",
						title: "one",
						text: "text",
						folderId: "folder-1",
						createdAt: "2026-03-03T00:00:00.000Z",
						updatedAt: "2026-03-03T00:00:00.000Z",
					},
					{ id: "snippet-2", title: "broken" },
				],
			}),
		);
		const snippetsStorage = createBrowserSnippetsStorage(
			storage,
			"snippets.test",
		);

		const loaded = await snippetsStorage.load();
		expect(loaded?.schemaVersion).toBe(1);
		expect(loaded?.folders).toHaveLength(1);
		expect(loaded?.snippets).toHaveLength(1);
	});

	it("returns null for invalid json", async () => {
		const storage = new InMemoryKeyValueStorage();
		storage.setItem("snippets.test", "{invalid-json");
		const snippetsStorage = createBrowserSnippetsStorage(
			storage,
			"snippets.test",
		);

		await expect(snippetsStorage.load()).resolves.toBeNull();
	});
});
