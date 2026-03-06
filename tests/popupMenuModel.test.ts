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
	it("groups history into root-level 10-item ranges with a 30-item cap", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(36),
			snippetFolders: [],
			snippetItems: [],
		});

		const historyRanges = rootEntries.filter((entry) => {
			return entry.kind === "submenu" && entry.id.startsWith("history-range-");
		});

		expect(historyRanges).toHaveLength(
			Math.ceil(POPUP_HISTORY_LIMIT / POPUP_HISTORY_GROUP_SIZE),
		);
		expect(expectSubmenu(historyRanges[0]).label).toBe("1 - 10");
		expect(expectSubmenu(historyRanges[1]).label).toBe("11 - 20");
		expect(expectSubmenu(historyRanges[2]).label).toBe("21 - 30");

		expect(expectSubmenu(historyRanges[0]).children).toHaveLength(10);
		expect(expectSubmenu(historyRanges[2]).children).toHaveLength(10);
	});

	it("hides snippet section when no snippet items exist", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(2),
			snippetFolders: [
				{
					id: "folder-general",
					name: "General",
					createdAt: "2026-03-04T10:00:00.000Z",
					updatedAt: "2026-03-04T10:00:00.000Z",
				},
			],
			snippetItems: [],
		});

		expect(
			rootEntries.some(
				(entry) => entry.kind === "section" && entry.label === "片断",
			),
		).toBe(false);
	});

	it("builds snippets into root-level folder submenus", () => {
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

		const snippetFoldersInRoot = rootEntries.filter((entry) => {
			return entry.kind === "submenu" && entry.id.startsWith("snippet-folder-");
		});

		expect(snippetFoldersInRoot).toHaveLength(2);
		expect(expectSubmenu(snippetFoldersInRoot[0]).label).toBe("General");
		expect(expectSubmenu(snippetFoldersInRoot[1]).label).toBe("Work");
		expect(expectSubmenu(snippetFoldersInRoot[0]).children[0]).toMatchObject({
			kind: "snippet-item",
		});
	});

	it("flattens history results when popup query is present", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(15),
			snippetFolders: [],
			snippetItems: [],
			query: "line 12",
		});

		const historyItems = rootEntries.filter((entry) => {
			return (
				entry.kind === "history-item" &&
				entry.id.startsWith("history-search-item-")
			);
		});
		expect(historyItems).toHaveLength(1);
		expect(historyItems[0]).toMatchObject({
			kind: "history-item",
			label: "1. history line 12",
			text: "history line 12",
		});
	});

	it("flattens snippet results when popup query is present", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: [],
			snippetFolders: [
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
			],
			snippetItems: [
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
			],
			query: "update",
		});

		expect(
			rootEntries.some(
				(entry) =>
					entry.kind === "submenu" && entry.id.startsWith("snippet-folder-"),
			),
		).toBe(false);
		expect(
			rootEntries.some(
				(entry) =>
					entry.kind === "snippet-item" &&
					entry.id === "snippet-search-item-snippet-2",
			),
		).toBe(true);
	});

	it("shows empty labels when popup query has no history/snippet match", () => {
		const folders: SnippetFolder[] = [
			{
				id: "folder-general",
				name: "General",
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
		];
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(5),
			snippetFolders: folders,
			snippetItems: snippets,
			query: "not-found",
		});

		expect(
			rootEntries.some(
				(entry) =>
					entry.kind === "empty" && entry.label === "未找到匹配的历史记录",
			),
		).toBe(true);
		expect(
			rootEntries.some(
				(entry) => entry.kind === "empty" && entry.label === "未找到匹配的片断",
			),
		).toBe(true);
	});

	it("adds required popup actions in root menu", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(1),
			snippetFolders: [],
			snippetItems: [],
		});

		const actionLabels = rootEntries
			.filter((entry): entry is Extract<PopupMenuEntry, { kind: "action" }> => {
				return entry.kind === "action";
			})
			.map((entry) => entry.label);
		expect(actionLabels).toEqual([
			"清除历史",
			"编辑片断...",
			"偏好设置...",
			"退出 Klip",
		]);
	});

	it("sanitizes invalid popup path segments to the last valid level", () => {
		const rootEntries = buildPopupMenuRootEntries({
			historyItems: buildHistoryItems(3),
			snippetFolders: [],
			snippetItems: [],
		});

		const context = resolvePopupMenuContext(rootEntries, [
			"history-range-1-3",
			"unknown",
		]);
		expect(context.path).toEqual(["history-range-1-3"]);
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
