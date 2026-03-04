import { toClipboardPreview } from "../../utils/toClipboardPreview";
import type { HistoryItem } from "../history";
import type { SnippetFolder, SnippetItem } from "../snippets";

export const POPUP_HISTORY_LIMIT = 30;
export const POPUP_HISTORY_GROUP_SIZE = 10;

export type PopupMenuAction = "edit-snippets" | "open-preferences";

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

export interface PopupEmptyEntry extends PopupMenuBaseEntry {
	kind: "empty";
}

export type PopupMenuEntry =
	| PopupSubmenuEntry
	| PopupHistoryItemEntry
	| PopupSnippetItemEntry
	| PopupActionEntry
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
}

export function buildPopupMenuRootEntries(
	input: BuildPopupMenuRootEntriesInput,
): PopupMenuEntry[] {
	return [
		{
			id: "history",
			kind: "submenu",
			label: "History",
			children: buildHistoryRangeEntries(input.historyItems),
		},
		{
			id: "snippets",
			kind: "submenu",
			label: "Snippets",
			children: buildSnippetFolderEntries(
				input.snippetFolders,
				input.snippetItems,
			),
		},
		{
			id: "edit-snippets",
			kind: "action",
			label: "Edit Snippets...",
			action: "edit-snippets",
		},
		{
			id: "preferences",
			kind: "action",
			label: "Preferences...",
			action: "open-preferences",
		},
	];
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

function buildHistoryRangeEntries(
	historyItems: HistoryItem[],
): PopupMenuEntry[] {
	const limitedHistoryItems = historyItems.slice(0, POPUP_HISTORY_LIMIT);
	if (limitedHistoryItems.length === 0) {
		return [createEmptyEntry("No history items yet.")];
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
			label: `${startIndex + 1}-${endIndex}`,
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

function buildSnippetFolderEntries(
	snippetFolders: SnippetFolder[],
	snippetItems: SnippetItem[],
): PopupMenuEntry[] {
	if (snippetFolders.length === 0) {
		return [createEmptyEntry("No snippet folders yet.")];
	}

	const snippetsByFolderId = new Map<string, SnippetItem[]>();
	for (const snippet of snippetItems) {
		const list = snippetsByFolderId.get(snippet.folderId) ?? [];
		list.push(snippet);
		snippetsByFolderId.set(snippet.folderId, list);
	}

	return snippetFolders.map((folder) => {
		const snippetsInFolder = snippetsByFolderId.get(folder.id) ?? [];
		const children: PopupMenuEntry[] =
			snippetsInFolder.length === 0
				? [createEmptyEntry("No snippets in this folder.")]
				: snippetsInFolder.map((snippet, index) => {
						return {
							id: `snippet-item-${snippet.id}`,
							kind: "snippet-item",
							label: `${index + 1}. ${toClipboardPreview(snippet.title, 54)}`,
							text: snippet.text,
							detail: toClipboardPreview(snippet.text, 72),
						} satisfies PopupSnippetItemEntry;
					});

		return {
			id: `snippet-folder-${folder.id}`,
			kind: "submenu",
			label: folder.name,
			children,
		} satisfies PopupSubmenuEntry;
	});
}

function createEmptyEntry(label: string): PopupEmptyEntry {
	return {
		id: `empty-${label.toLowerCase().replace(/\s+/g, "-")}`,
		kind: "empty",
		label,
	};
}
