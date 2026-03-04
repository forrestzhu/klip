import { describe, expect, it } from "vitest";
import { DEFAULT_HISTORY_MAX_ITEMS } from "../src/features/history/history.constants";
import type {
	HistoryState,
	HistoryStorage,
} from "../src/features/history/history.types";
import { HistoryRepository } from "../src/features/history/historyRepository";

class InMemoryHistoryStorage implements HistoryStorage {
	public state: HistoryState | null;
	public saveCalls = 0;

	public constructor(initialState: HistoryState | null = null) {
		this.state = cloneState(initialState);
	}

	public async load(): Promise<HistoryState | null> {
		return cloneState(this.state);
	}

	public async save(state: HistoryState): Promise<void> {
		this.saveCalls += 1;
		this.state = cloneState(state);
	}
}

describe("HistoryRepository", () => {
	it("creates default state for first install and persists it", async () => {
		const storage = new InMemoryHistoryStorage();
		const repository = new HistoryRepository({ storage });

		const state = await repository.load();

		expect(state.maxItems).toBe(DEFAULT_HISTORY_MAX_ITEMS);
		expect(state.items).toHaveLength(0);
		expect(storage.saveCalls).toBe(1);
	});

	it("adds captured text with metadata and restores persisted state", async () => {
		const storage = new InMemoryHistoryStorage();
		const repository = new HistoryRepository({
			storage,
			now: () => new Date("2026-03-03T10:00:00.000Z"),
			createId: () => "id-1",
		});

		await repository.load();
		const created = await repository.addCapturedText({
			text: "hello klip",
			sourceApp: "terminal",
		});

		expect(created).toEqual({
			id: "id-1",
			text: "hello klip",
			createdAt: "2026-03-03T10:00:00.000Z",
			sourceApp: "terminal",
		});

		const reloadedRepository = new HistoryRepository({ storage });
		await reloadedRepository.load();
		expect(reloadedRepository.getItems()).toHaveLength(1);
		expect(reloadedRepository.getItems()[0]?.text).toBe("hello klip");
	});

	it("evicts old items by fifo when history exceeds max size", async () => {
		const storage = new InMemoryHistoryStorage();
		const repository = new HistoryRepository({
			storage,
			defaultMaxItems: 10,
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();
		await repository.setMaxItems(10);

		for (let index = 1; index <= 15; index += 1) {
			await repository.addCapturedText({
				text: `item-${index}`,
			});
		}

		const items = repository.getItems();
		expect(items).toHaveLength(10);
		expect(items[0]?.text).toBe("item-15");
		expect(items[9]?.text).toBe("item-6");
	});

	it("does not store empty text or consecutive duplicates", async () => {
		const storage = new InMemoryHistoryStorage();
		const repository = new HistoryRepository({
			storage,
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();

		expect(await repository.addCapturedText({ text: "   " })).toBeNull();
		const firstItem = await repository.addCapturedText({ text: "alpha" });
		expect(firstItem?.text).toBe("alpha");
		expect(await repository.addCapturedText({ text: "alpha" })).toBeNull();
		const secondItem = await repository.addCapturedText({ text: "beta" });
		expect(secondItem?.text).toBe("beta");

		const items = repository.getItems();
		expect(items).toHaveLength(2);
		expect(items[0]?.text).toBe("beta");
		expect(items[1]?.text).toBe("alpha");
	});

	it("trims history immediately when max items decreases", async () => {
		const storage = new InMemoryHistoryStorage();
		const repository = new HistoryRepository({
			storage,
			defaultMaxItems: 50,
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();
		for (let index = 1; index <= 20; index += 1) {
			await repository.addCapturedText({ text: `entry-${index}` });
		}

		const appliedMax = await repository.setMaxItems(12);

		expect(appliedMax).toBe(12);
		expect(repository.getItems()).toHaveLength(12);
		expect(repository.getItems()[11]?.text).toBe("entry-9");
	});

	it("clears all history items and persists empty state", async () => {
		const storage = new InMemoryHistoryStorage();
		const repository = new HistoryRepository({
			storage,
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();
		await repository.addCapturedText({ text: "alpha" });
		await repository.addCapturedText({ text: "beta" });

		await repository.clearItems();

		expect(repository.getItems()).toHaveLength(0);
		expect(storage.state?.items).toHaveLength(0);
	});
});

function cloneState(state: HistoryState | null): HistoryState | null {
	if (state === null) {
		return null;
	}

	return JSON.parse(JSON.stringify(state)) as HistoryState;
}
