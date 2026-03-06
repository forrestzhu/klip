import type { Page } from "@playwright/test";
import {
	DEFAULT_HISTORY_MAX_ITEMS,
	HISTORY_SCHEMA_VERSION,
} from "../../src/features/history/history.constants";
import type { HistoryItem } from "../../src/features/history/history.types";
import { HISTORY_STORAGE_KEY } from "../../src/features/history/historyStorage";
import {
	DEFAULT_PANEL_HOTKEY,
	DEFAULT_SNIPPET_ALIAS_HOTKEY,
	PANEL_HOTKEY_STORAGE_KEY,
	SNIPPET_ALIAS_HOTKEY_STORAGE_KEY,
} from "../../src/features/settings/hotkey.constants";
import {
	DEFAULT_PASTE_MODE,
	PASTE_MODE_STORAGE_KEY,
	type PasteMode,
} from "../../src/features/settings/pasteModeStorage";
import {
	DEFAULT_STARTUP_LAUNCH_ENABLED,
	STARTUP_LAUNCH_STORAGE_KEY,
} from "../../src/features/settings/startupLaunchStorage";
import {
	DEFAULT_SNIPPETS_FOLDER_ID,
	DEFAULT_SNIPPETS_FOLDER_NAME,
	SNIPPETS_SCHEMA_VERSION,
} from "../../src/features/snippets/snippet.constants";
import type {
	SnippetFolder,
	SnippetItem,
} from "../../src/features/snippets/snippet.types";
import { SNIPPETS_STORAGE_KEY } from "../../src/features/snippets/snippetStorage";

const E2E_STORAGE_MARKER_KEY = "klip.e2e.storageSeeded";
const E2E_CLIPBOARD_KEY = "__klipE2eClipboardText";
const FIXED_TIMESTAMP = "2026-03-06T12:00:00.000Z";

interface BrowserPreviewSeed {
	initialClipboardText?: string;
	historyItems?: HistoryItem[];
	maxHistoryItems?: number;
	snippetFolders?: SnippetFolder[];
	snippetItems?: SnippetItem[];
	pasteMode?: PasteMode;
	panelHotkey?: string;
	snippetAliasHotkey?: string;
	startupLaunchEnabled?: boolean;
}

export async function seedBrowserPreview(
	page: Page,
	seed: BrowserPreviewSeed = {},
): Promise<void> {
	const storageEntries: Array<[string, string]> = [
		[
			HISTORY_STORAGE_KEY,
			JSON.stringify({
				schemaVersion: HISTORY_SCHEMA_VERSION,
				maxItems: seed.maxHistoryItems ?? DEFAULT_HISTORY_MAX_ITEMS,
				items: seed.historyItems ?? [],
			}),
		],
		[
			SNIPPETS_STORAGE_KEY,
			JSON.stringify({
				schemaVersion: SNIPPETS_SCHEMA_VERSION,
				folders: buildSnippetFolders(seed.snippetFolders),
				snippets: seed.snippetItems ?? [],
			}),
		],
		[PASTE_MODE_STORAGE_KEY, seed.pasteMode ?? DEFAULT_PASTE_MODE],
		[PANEL_HOTKEY_STORAGE_KEY, seed.panelHotkey ?? DEFAULT_PANEL_HOTKEY],
		[
			SNIPPET_ALIAS_HOTKEY_STORAGE_KEY,
			seed.snippetAliasHotkey ?? DEFAULT_SNIPPET_ALIAS_HOTKEY,
		],
		[
			STARTUP_LAUNCH_STORAGE_KEY,
			(seed.startupLaunchEnabled ?? DEFAULT_STARTUP_LAUNCH_ENABLED)
				? "enabled"
				: "disabled",
		],
	];

	await page.addInitScript(
		({
			clipboardKey,
			initialClipboardText,
			markerKey,
			seedEntries,
		}: {
			clipboardKey: string;
			initialClipboardText: string;
			markerKey: string;
			seedEntries: Array<[string, string]>;
		}) => {
			let clipboardText = initialClipboardText;

			Object.defineProperty(window, clipboardKey, {
				configurable: true,
				get() {
					return clipboardText;
				},
				set(value: string) {
					clipboardText = value;
				},
			});

			Object.defineProperty(navigator, "clipboard", {
				configurable: true,
				value: {
					readText: async () => clipboardText,
					writeText: async (value: string) => {
						clipboardText = String(value);
					},
				},
			});

			if (window.localStorage.getItem(markerKey) === "1") {
				return;
			}

			window.localStorage.clear();
			for (const [key, value] of seedEntries) {
				window.localStorage.setItem(key, value);
			}
			window.localStorage.setItem(markerKey, "1");
		},
		{
			clipboardKey: E2E_CLIPBOARD_KEY,
			initialClipboardText: seed.initialClipboardText ?? "",
			markerKey: E2E_STORAGE_MARKER_KEY,
			seedEntries: storageEntries,
		},
	);
}

export async function readBrowserPreviewClipboard(page: Page): Promise<string> {
	return page.evaluate((clipboardKey) => {
		const browserWindow = window as unknown as Record<string, unknown>;
		const value = browserWindow[clipboardKey];
		return typeof value === "string" ? value : "";
	}, E2E_CLIPBOARD_KEY);
}

function buildSnippetFolders(
	folders: SnippetFolder[] | undefined,
): SnippetFolder[] {
	const providedFolders = folders ?? [];
	const hasDefaultFolder = providedFolders.some(
		(folder) => folder.id === DEFAULT_SNIPPETS_FOLDER_ID,
	);

	if (hasDefaultFolder) {
		return providedFolders;
	}

	return [
		{
			id: DEFAULT_SNIPPETS_FOLDER_ID,
			name: DEFAULT_SNIPPETS_FOLDER_NAME,
			createdAt: FIXED_TIMESTAMP,
			updatedAt: FIXED_TIMESTAMP,
		},
		...providedFolders,
	];
}
