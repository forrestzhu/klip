import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history";
import {
	buildPopupMenuRootEntries,
	POPUP_HISTORY_GROUP_SIZE,
	POPUP_HISTORY_LIMIT,
	type PopupMenuEntry,
	resolvePopupMenuContext,
} from "../src/features/menu/popupMenuModel";
import type { SnippetFolder, SnippetItem } from "../src/features/snippets";

describe("popup menu model", () => {
	it("groups history into 10-item ranges with a 30-item cap", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(36),
			snippetFolders: [],
			snippetItems: [],
		});

		const historyRoot = expectSubmenu(rootEntries[0]);
		expect(historyRoot.children).toHaveLength(
			Math.ceil(POPUP_HISTORY_LIMIT / POPUP_HISTORY_GROUP_SIZE),
		);
		expect(expectSubmenu(historyRoot.children[0]).label).toBe("1-10");
		expect(expectSubmenu(historyRoot.children[1]).label).toBe("11-20");
		expect(expectSubmenu(historyRoot.children[2]).label).toBe("21-30");

		expect(expectSubmenu(historyRoot.children[0]).children).toHaveLength(10);
		expect(expectSubmenu(historyRoot.children[2]).children).toHaveLength(10);
	});

	it("builds snippets into folder submenus", () => {
		const folders: SnippetFolder[] = [
			{
				id: "folder-general",
				name: "General",
				createdAt: "2026-03-04T10:00:00.000Z",
				updatedAt: "2026-03-04T10:00:00.000Z",
			},
			{
				id: "folder-work",
				name: "Work",
				createdAt: "2026-03-04T10:00:00.000Z",
				updatedAt: "2026-03-04T10:00:00.000Z",
			},
		];
		const snippets: SnippetItem[] = [
			{
				id: "snippet-1",
				title: "Greeting",
				text: "Hello there",
				folderId: "folder-general",
				createdAt: "2026-03-04T10:00:00.000Z",
				updatedAt: "2026-03-04T10:00:00.000Z",
			},
			{
				id: "snippet-2",
				title: "Work update",
				text: "Status update",
				folderId: "folder-work",
				createdAt: "2026-03-04T10:00:00.000Z",
				updatedAt: "2026-03-04T10:00:00.000Z",
			},
		];

		const rootEntries = buildPopupMenuRootEntries({
			historyItems: [],
			snippetFolders: folders,
			snippetItems: snippets,
		});
		const snippetRoot = expectSubmenu(rootEntries[1]);

		expect(snippetRoot.children).toHaveLength(2);
		expect(expectSubmenu(snippetRoot.children[0]).label).toBe("General");
		expect(expectSubmenu(snippetRoot.children[1]).label).toBe("Work");
		expect(expectSubmenu(snippetRoot.children[0]).children[0]).toMatchObject({
			kind: "snippet-item",
		});
	});

	it("sanitizes invalid popup path segments to the last valid level", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(3),
			snippetFolders: [],
			snippetItems: [],
		});

		const context = resolvePopupMenuContext(rootEntries, [
			"history",
			"history-range-1-3",
			"unknown",
		]);
		expect(context.path).toEqual(["history", "history-range-1-3"]);
		expect(context.entries[0]).toMatchObject({ kind: "history-item" });
	});
});

function buildHistoryItems(count: number): HistoryItem[] {
	return Array.from({ length: count }, (_, index) => {
		return {
			id: `history-${index + 1}`,
			text: `history line ${index + 1}`,
			createdAt: `2026-03-04T10:${String(index).padStart(2, "0")}:00.000Z`,
			sourceApp: null,
		};
	});
}

function expectSubmenu(entry: PopupMenuEntry) {
	if (entry.kind !== "submenu") {
		throw new Error(`Expected submenu entry, got ${entry.kind}`);
	}

	return entry;
}
