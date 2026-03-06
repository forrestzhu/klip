import { toClipboardPreview } from "../../utils/toClipboardPreview";
import type { HistoryItem } from "../history";
import type { SnippetFolder, SnippetItem } from "../snippets";

export const POPUP_HISTORY_LIMIT = 30;
export const POPUP_HISTORY_GROUP_SIZE = 10;

export type PopupMenuAction =
	| "clear-history"
	| "edit-snippets"
	| "open-preferences"
	| "quit-app";

interface PopupMenuBaseEntry {
	id: string;
	label: string;
}

export interface PopupSubmenuEntry extends PopupMenuBaseEntry {
	kind: "submenu";
	children: PopupMenuEntry[];
}

export interface PopupHistoryItemEntry extends PopupMenuBaseEntry {
	kind: "history-item";
	text: string;
	detail: string;
}

export interface PopupSnippetItemEntry extends PopupMenuBaseEntry {
	kind: "snippet-item";
	text: string;
	detail: string;
}

export interface PopupActionEntry extends PopupMenuBaseEntry {
	kind: "action";
	action: PopupMenuAction;
}

export interface PopupSectionEntry extends PopupMenuBaseEntry {
	kind: "section";
}

export interface PopupSeparatorEntry extends PopupMenuBaseEntry {
	kind: "separator";
}

export interface PopupEmptyEntry extends PopupMenuBaseEntry {
	kind: "empty";
}

export type PopupMenuEntry =
	| PopupSubmenuEntry
	| PopupHistoryItemEntry
	| PopupSnippetItemEntry
	| PopupActionEntry
	| PopupSectionEntry
	| PopupSeparatorEntry
	| PopupEmptyEntry;

export interface PopupMenuContext {
	path: string[];
	breadcrumb: string[];
	entries: PopupMenuEntry[];
}

interface BuildPopupMenuRootEntriesInput {
	historyItems: HistoryItem[];
	snippetFolders: SnippetFolder[];
	snippetItems: SnippetItem[];
	query?: string;
}

export function buildPopupMenuRootEntries(
	input: BuildPopupMenuRootEntriesInput,
): PopupMenuEntry[] {
	const normalizedQuery = normalizePopupQuery(input.query);
	if (normalizedQuery.length > 0) {
		return buildSearchPopupMenuEntries(input, normalizedQuery);
	}

	return buildDefaultPopupMenuEntries(input);
}

function buildDefaultPopupMenuEntries(
	input: BuildPopupMenuRootEntriesInput,
): PopupMenuEntry[] {
	const historyEntries = buildHistoryRangeEntries(input.historyItems);

	const entries: PopupMenuEntry[] = [
		createSectionEntry("history-section", "历史"),
		...historyEntries,
		createSeparatorEntry("history-divider"),
	];

	const snippetEntries = buildSnippetFolderEntries(
		input.snippetFolders,
		input.snippetItems,
	);
	if (snippetEntries.length > 0) {
		entries.push(
			createSectionEntry("snippets-section", "片断"),
			...snippetEntries,
			createSeparatorEntry("snippets-divider"),
		);
	}

	appendPopupActionEntries(entries);

	return entries;
}

function buildSearchPopupMenuEntries(
	input: BuildPopupMenuRootEntriesInput,
	query: string,
): PopupMenuEntry[] {
	const historyEntries = buildHistorySearchEntries(
		filterHistoryItemsByQuery(input.historyItems, query),
	);
	const snippetEntries = buildSnippetSearchEntries(
		input.snippetFolders,
		filterSnippetItemsByQuery(input.snippetItems, query),
	);

	const entries: PopupMenuEntry[] = [
		createSectionEntry("history-section", "历史"),
		...historyEntries,
		createSeparatorEntry("history-divider"),
	];

	if (input.snippetItems.length > 0) {
		entries.push(
			createSectionEntry("snippets-section", "片断"),
			...(snippetEntries.length > 0
				? snippetEntries
				: [createEmptyEntry("未找到匹配的片断")]),
			createSeparatorEntry("snippets-divider"),
		);
	}

	appendPopupActionEntries(entries);
	return entries;
}

export function resolvePopupMenuContext(
	rootEntries: PopupMenuEntry[],
	rawPath: string[],
): PopupMenuContext {
	let entries = rootEntries;
	const path: string[] = [];
	const breadcrumb: string[] = [];

	for (const segmentId of rawPath) {
		const match = entries.find(
			(entry): entry is PopupSubmenuEntry =>
				entry.kind === "submenu" && entry.id === segmentId,
		);
		if (!match) {
			break;
		}

		path.push(segmentId);
		breadcrumb.push(match.label);
		entries = match.children;
	}

	return {
		path,
		breadcrumb,
		entries,
	};
}

export function isPopupSubmenuEntry(
	entry: PopupMenuEntry,
): entry is PopupSubmenuEntry {
	return entry.kind === "submenu";
}

export function isPopupSelectableEntry(entry: PopupMenuEntry): boolean {
	return (
		entry.kind !== "section" &&
		entry.kind !== "separator" &&
		entry.kind !== "empty"
	);
}

function buildHistoryRangeEntries(
	historyItems: HistoryItem[],
	emptyLabel = "暂无历史记录",
): PopupMenuEntry[] {
	const limitedHistoryItems = historyItems.slice(0, POPUP_HISTORY_LIMIT);
	if (limitedHistoryItems.length === 0) {
		return [createEmptyEntry(emptyLabel)];
	}

	const rangeEntries: PopupMenuEntry[] = [];
	for (
		let startIndex = 0;
		startIndex < limitedHistoryItems.length;
		startIndex += POPUP_HISTORY_GROUP_SIZE
	) {
		const endIndex = Math.min(
			startIndex + POPUP_HISTORY_GROUP_SIZE,
			limitedHistoryItems.length,
		);
		const group = limitedHistoryItems.slice(startIndex, endIndex);

		rangeEntries.push({
			id: `history-range-${startIndex + 1}-${endIndex}`,
			kind: "submenu",
			label: `${startIndex + 1} - ${endIndex}`,
			children: group.map((item, index) => ({
				id: `history-item-${item.id}`,
				kind: "history-item",
				label: `${index + 1}. ${toClipboardPreview(item.text, 54)}`,
				text: item.text,
				detail: new Date(item.createdAt).toLocaleString(),
			})),
		});
	}

	return rangeEntries;
}

function buildHistorySearchEntries(
	historyItems: HistoryItem[],
): PopupMenuEntry[] {
	const limitedHistoryItems = historyItems.slice(0, POPUP_HISTORY_LIMIT);
	if (limitedHistoryItems.length === 0) {
		return [createEmptyEntry("未找到匹配的历史记录")];
	}

	return limitedHistoryItems.map((item, index) => {
		return {
			id: `history-search-item-${item.id}`,
			kind: "history-item",
			label: `${index + 1}. ${toClipboardPreview(item.text, 54)}`,
			text: item.text,
			detail: new Date(item.createdAt).toLocaleString(),
		} satisfies PopupHistoryItemEntry;
	});
}

function buildSnippetFolderEntries(
	snippetFolders: SnippetFolder[],
	snippetItems: SnippetItem[],
): PopupMenuEntry[] {
	if (snippetItems.length === 0 || snippetFolders.length === 0) {
		return [];
	}

	const snippetsByFolderId = new Map<string, SnippetItem[]>();
	for (const snippet of snippetItems) {
		const list = snippetsByFolderId.get(snippet.folderId) ?? [];
		list.push(snippet);
		snippetsByFolderId.set(snippet.folderId, list);
	}

	const folderEntries = snippetFolders
		.map((folder) => {
			const snippetsInFolder = snippetsByFolderId.get(folder.id) ?? [];
			if (snippetsInFolder.length === 0) {
				return null;
			}

			const children: PopupMenuEntry[] = snippetsInFolder.map(
				(snippet, index) => {
					return {
						id: `snippet-item-${snippet.id}`,
						kind: "snippet-item",
						label: `${index + 1}. ${toClipboardPreview(snippet.title, 54)}`,
						text: snippet.text,
						detail: toClipboardPreview(snippet.text, 72),
					} satisfies PopupSnippetItemEntry;
				},
			);

			return {
				id: `snippet-folder-${folder.id}`,
				kind: "submenu",
				label: folder.name,
				children,
			} satisfies PopupSubmenuEntry;
		})
		.filter((entry): entry is PopupSubmenuEntry => entry !== null);

	return folderEntries;
}

function buildSnippetSearchEntries(
	snippetFolders: SnippetFolder[],
	snippetItems: SnippetItem[],
): PopupMenuEntry[] {
	if (snippetItems.length === 0) {
		return [];
	}

	const folderNameById = new Map<string, string>();
	for (const folder of snippetFolders) {
		folderNameById.set(folder.id, folder.name);
	}

	const limitedSnippetItems = snippetItems.slice(0, POPUP_HISTORY_LIMIT);
	return limitedSnippetItems.map((snippet, index) => {
		const folderName = folderNameById.get(snippet.folderId) ?? "General";
		return {
			id: `snippet-search-item-${snippet.id}`,
			kind: "snippet-item",
			label: `${index + 1}. ${toClipboardPreview(snippet.title, 54)}`,
			text: snippet.text,
			detail: `${folderName} · ${toClipboardPreview(snippet.text, 64)}`,
		} satisfies PopupSnippetItemEntry;
	});
}

function normalizePopupQuery(query: string | undefined): string {
	if (typeof query !== "string") {
		return "";
	}

	return query.trim().toLowerCase();
}

function filterHistoryItemsByQuery(
	historyItems: HistoryItem[],
	query: string,
): HistoryItem[] {
	return historyItems.filter((item) => item.text.toLowerCase().includes(query));
}

function filterSnippetItemsByQuery(
	snippetItems: SnippetItem[],
	query: string,
): SnippetItem[] {
	return snippetItems.filter((item) => {
		return (
			item.title.toLowerCase().includes(query) ||
			item.text.toLowerCase().includes(query)
		);
	});
}

function createSectionEntry(id: string, label: string): PopupSectionEntry {
	return {
		id,
		kind: "section",
		label,
	};
}

function createSeparatorEntry(id: string): PopupSeparatorEntry {
	return {
		id,
		kind: "separator",
		label: "",
	};
}

function createEmptyEntry(label: string): PopupEmptyEntry {
	return {
		id: `empty-${label.toLowerCase().replace(/\s+/g, "-")}`,
		kind: "empty",
		label,
	};
}

function appendPopupActionEntries(entries: PopupMenuEntry[]) {
	entries.push(
		{
			id: "clear-history",
			kind: "action",
			label: "清除历史",
			action: "clear-history",
		},
		{
			id: "edit-snippets",
			kind: "action",
			label: "编辑片断...",
			action: "edit-snippets",
		},
		{
			id: "preferences",
			kind: "action",
			label: "偏好设置...",
			action: "open-preferences",
		},
		createSeparatorEntry("quit-divider"),
		{
			id: "quit-klip",
			kind: "action",
			label: "退出 Klip",
			action: "quit-app",
		},
	);
}
