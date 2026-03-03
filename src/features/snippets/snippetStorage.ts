import { SNIPPETS_SCHEMA_VERSION } from "./snippet.constants";
import type {
	SnippetFolder,
	SnippetItem,
	SnippetsState,
	SnippetsStorage,
} from "./snippet.types";

export const SNIPPETS_STORAGE_KEY = "klip.snippets.v1";

export interface KeyValueStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export function createBrowserSnippetsStorage(
	storage: KeyValueStorage,
	storageKey = SNIPPETS_STORAGE_KEY,
): SnippetsStorage {
	return {
		async load() {
			const raw = storage.getItem(storageKey);
			if (!raw) {
				return null;
			}

			try {
				const parsed = JSON.parse(raw) as Partial<SnippetsState>;
				return normalizeLoadedState(parsed);
			} catch {
				return null;
			}
		},
		async save(state) {
			storage.setItem(storageKey, JSON.stringify(state));
		},
	};
}

function normalizeLoadedState(input: Partial<SnippetsState>): SnippetsState {
	const folders = Array.isArray(input.folders) ? input.folders : [];
	const snippets = Array.isArray(input.snippets) ? input.snippets : [];

	return {
		schemaVersion:
			typeof input.schemaVersion === "number"
				? input.schemaVersion
				: SNIPPETS_SCHEMA_VERSION,
		folders: folders.filter(isValidFolder).map((folder) => ({ ...folder })),
		snippets: snippets
			.filter(isValidSnippet)
			.map((snippet) => ({ ...snippet })),
	};
}

function isValidFolder(value: unknown): value is SnippetFolder {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as SnippetFolder).id === "string" &&
		typeof (value as SnippetFolder).name === "string" &&
		typeof (value as SnippetFolder).createdAt === "string" &&
		typeof (value as SnippetFolder).updatedAt === "string"
	);
}

function isValidSnippet(value: unknown): value is SnippetItem {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as SnippetItem).id === "string" &&
		typeof (value as SnippetItem).title === "string" &&
		typeof (value as SnippetItem).text === "string" &&
		typeof (value as SnippetItem).folderId === "string" &&
		typeof (value as SnippetItem).createdAt === "string" &&
		typeof (value as SnippetItem).updatedAt === "string"
	);
}
