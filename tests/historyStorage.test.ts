import { describe, expect, it } from "vitest";
import {
	createBrowserHistoryStorage,
	MAX_HISTORY_MAX_ITEMS,
	MIN_HISTORY_MAX_ITEMS,
} from "../src/features/history";

class InMemoryKeyValueStorage {
	private readonly storage = new Map<string, string>();

	public getItem(key: string): string | null {
		return this.storage.get(key) ?? null;
	}

	public setItem(key: string, value: string): void {
		this.storage.set(key, value);
	}
}

describe("createBrowserHistoryStorage", () => {
	it("returns null when no saved state exists", async () => {
		const storage = new InMemoryKeyValueStorage();
		const historyStorage = createBrowserHistoryStorage(storage);

		await expect(historyStorage.load()).resolves.toBeNull();
	});

	it("saves and loads state", async () => {
		const storage = new InMemoryKeyValueStorage();
		const historyStorage = createBrowserHistoryStorage(storage, "history.test");

		await historyStorage.save({
			schemaVersion: 1,
			maxItems: 50,
			items: [
				{
					id: "id-1",
					text: "value",
					createdAt: "2026-03-03T00:00:00.000Z",
					sourceApp: "editor",
				},
			],
		});

		await expect(historyStorage.load()).resolves.toEqual({
			schemaVersion: 1,
			maxItems: 50,
			items: [
				{
					id: "id-1",
					text: "value",
					createdAt: "2026-03-03T00:00:00.000Z",
					sourceApp: "editor",
				},
			],
		});
	});

	it("normalizes malformed content", async () => {
		const storage = new InMemoryKeyValueStorage();
		storage.setItem(
			"history.test",
			JSON.stringify({
				schemaVersion: "1",
				maxItems: MAX_HISTORY_MAX_ITEMS + 100,
				items: [
					{ id: "ok", text: "text", createdAt: "2026-03-03T00:00:00.000Z" },
					{ id: "broken", text: 1 },
				],
			}),
		);

		const historyStorage = createBrowserHistoryStorage(storage, "history.test");
		const loaded = await historyStorage.load();

		expect(loaded?.schemaVersion).toBe(1);
		expect(loaded?.maxItems).toBe(MAX_HISTORY_MAX_ITEMS);
		expect(loaded?.items).toEqual([
			{
				id: "ok",
				text: "text",
				createdAt: "2026-03-03T00:00:00.000Z",
				sourceApp: null,
			},
		]);

		storage.setItem(
			"history.test",
			JSON.stringify({
				maxItems: MIN_HISTORY_MAX_ITEMS - 100,
				items: [],
			}),
		);
		const reloaded = await historyStorage.load();
		expect(reloaded?.maxItems).toBe(MIN_HISTORY_MAX_ITEMS);
	});

	it("returns null for invalid json", async () => {
		const storage = new InMemoryKeyValueStorage();
		storage.setItem("history.test", "{invalid-json");
		const historyStorage = createBrowserHistoryStorage(storage, "history.test");

		await expect(historyStorage.load()).resolves.toBeNull();
	});
});
