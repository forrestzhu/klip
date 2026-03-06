import { describe, expect, it } from "vitest";
import {
	DEFAULT_SNIPPETS_FOLDER_ID,
	SnippetRepository,
	type SnippetsState,
	type SnippetsStorage,
} from "../src/features/snippets";

class InMemorySnippetsStorage implements SnippetsStorage {
	public state: SnippetsState | null;
	public saveCalls = 0;

	public constructor(initialState: SnippetsState | null = null) {
		this.state = cloneState(initialState);
	}

	public async load(): Promise<SnippetsState | null> {
		return cloneState(this.state);
	}

	public async save(state: SnippetsState): Promise<void> {
		this.saveCalls += 1;
		this.state = cloneState(state);
	}
}

describe("SnippetRepository", () => {
	it("creates default state and persists on first load", async () => {
		const storage = new InMemorySnippetsStorage();
		const repository = new SnippetRepository({
			storage,
			now: () => new Date("2026-03-03T00:00:00.000Z"),
		});

		const state = await repository.load();

		expect(state.folders).toHaveLength(1);
		expect(state.folders[0]?.id).toBe(DEFAULT_SNIPPETS_FOLDER_ID);
		expect(state.snippets).toHaveLength(0);
		expect(storage.saveCalls).toBe(1);
	});

	it("creates folders/snippets and restores persisted state", async () => {
		const storage = new InMemorySnippetsStorage();
		const repository = new SnippetRepository({
			storage,
			now: () => new Date("2026-03-03T10:00:00.000Z"),
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();
		const folder = await repository.addFolder("Engineering");
		const snippet = await repository.addSnippet({
			text: "hello world",
			alias: ";hello",
			folderId: folder.id,
		});

		expect(snippet?.folderId).toBe(folder.id);
		expect(snippet?.title).toBe("hello world");
		expect(snippet?.alias).toBe("hello");

		const reloaded = new SnippetRepository({ storage });
		await reloaded.load();
		expect(reloaded.getFolders()).toHaveLength(2);
		expect(reloaded.getSnippets()).toHaveLength(1);
	});

	it("renames and deletes folder while moving snippets into default folder", async () => {
		const storage = new InMemorySnippetsStorage();
		const repository = new SnippetRepository({
			storage,
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();
		const folder = await repository.addFolder("Ops");
		const created = await repository.addSnippet({
			text: "pager template",
			folderId: folder.id,
		});
		expect(created?.folderId).toBe(folder.id);

		const renamed = await repository.renameFolder(folder.id, "SRE");
		expect(renamed?.name).toBe("SRE");

		const deleted = await repository.deleteFolder(folder.id);
		expect(deleted).toBe(true);
		expect(repository.getFolders().some((item) => item.id === folder.id)).toBe(
			false,
		);
		expect(repository.getSnippets()[0]?.folderId).toBe(
			DEFAULT_SNIPPETS_FOLDER_ID,
		);
	});

	it("updates/deletes snippet and supports searching", async () => {
		const storage = new InMemorySnippetsStorage();
		const repository = new SnippetRepository({
			storage,
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();
		const snippet = await repository.addSnippet({
			text: "deploy checklist",
			alias: " ;Deploy_Tag ",
		});
		expect(snippet).not.toBeNull();
		if (!snippet) {
			throw new Error("Expected snippet to be created");
		}
		expect(snippet.alias).toBe("deploy_tag");

		const updated = await repository.updateSnippet({
			id: snippet.id,
			text: "deploy checklist v2",
			alias: "release-v2",
		});
		expect(updated?.text).toBe("deploy checklist v2");
		expect(updated?.alias).toBe("release-v2");

		expect(repository.searchSnippets("v2")).toHaveLength(1);
		expect(repository.searchSnippets("release-v2")).toHaveLength(1);
		expect(repository.searchSnippets("missing")).toHaveLength(0);

		expect(await repository.deleteSnippet(snippet.id)).toBe(true);
		expect(repository.getSnippets()).toHaveLength(0);
	});

	it("handles invalid operations and folder-filtered search", async () => {
		const storage = new InMemorySnippetsStorage();
		const repository = new SnippetRepository({
			storage,
			createId: (() => {
				let id = 0;
				return () => `id-${++id}`;
			})(),
		});

		await repository.load();
		const folderA = await repository.addFolder("A");
		const folderB = await repository.addFolder("B");
		const duplicateByName = await repository.addFolder("a");
		expect(duplicateByName.id).toBe(folderA.id);

		const created = await repository.addSnippet({
			text: "alpha template",
			folderId: folderA.id,
		});
		expect(created).not.toBeNull();
		if (!created) {
			throw new Error("Expected snippet to be created");
		}

		expect(await repository.addSnippet({ text: "   " })).toBeNull();
		expect(
			await repository.updateSnippet({ id: "missing", text: "next" }),
		).toBeNull();
		expect(
			await repository.updateSnippet({ id: created.id, text: " " }),
		).toBeNull();
		expect(await repository.deleteSnippet("missing")).toBe(false);
		expect(await repository.renameFolder("missing", "name")).toBeNull();
		expect(await repository.renameFolder(folderB.id, "A")).toBeNull();
		expect(await repository.deleteFolder(DEFAULT_SNIPPETS_FOLDER_ID)).toBe(
			false,
		);
		expect(await repository.deleteFolder("missing")).toBe(false);

		const byFolder = repository.searchSnippets("template", folderA.id);
		expect(byFolder).toHaveLength(1);
		expect(repository.searchSnippets("template", folderB.id)).toHaveLength(0);
	});

	it("normalizes malformed loaded state", async () => {
		const storage = new InMemorySnippetsStorage({
			schemaVersion: 1,
			folders: [
				{
					id: "folder-custom",
					name: "  Team  ",
					createdAt: "2026-03-03T00:00:00.000Z",
					updatedAt: "2026-03-03T00:00:00.000Z",
				},
			],
			snippets: [
				{
					id: "snippet-1",
					title: " ",
					text: "runbook",
					alias: " ;TEAM_RUNBOOK ",
					folderId: "missing-folder",
					createdAt: "2026-03-03T00:00:00.000Z",
					updatedAt: "2026-03-03T00:00:00.000Z",
				},
			],
		});
		const repository = new SnippetRepository({ storage });

		await repository.load();
		const folders = repository.getFolders();
		const snippets = repository.getSnippets();

		expect(
			folders.some((folder) => folder.id === DEFAULT_SNIPPETS_FOLDER_ID),
		).toBe(true);
		expect(snippets[0]?.folderId).toBe(DEFAULT_SNIPPETS_FOLDER_ID);
		expect(snippets[0]?.title).toBe("runbook");
		expect(snippets[0]?.alias).toBe("team_runbook");
	});
});

function cloneState(state: SnippetsState | null): SnippetsState | null {
	if (state === null) {
		return null;
	}

	return JSON.parse(JSON.stringify(state)) as SnippetsState;
}
