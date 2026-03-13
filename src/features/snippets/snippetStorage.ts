/**
 * Snippet Storage Module
 *
 * Manages persistent storage of snippet folders and items.
 * Provides a key-value storage abstraction for browser and desktop environments.
 *
 * Features:
 * - Load/save snippets state from/to storage
 * - Validate and normalize loaded data
 * - Handle schema versioning
 *
 * @module snippetStorage
 */

import { SNIPPETS_SCHEMA_VERSION } from "./snippet.constants";
import type {
	SnippetFolder,
	SnippetItem,
	SnippetsState,
	SnippetsStorage,
} from "./snippet.types";

export const SNIPPETS_STORAGE_KEY = "klip.snippets.v1";

/**
 * Key-value storage interface
 * Abstracts localStorage and other storage mechanisms
 */
export interface KeyValueStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/**
 * Create a browser-based snippets storage
 * Uses key-value storage (typically localStorage)
 * @param storage - Key-value storage implementation
 * @param storageKey - Storage key (defaults to SNIPPETS_STORAGE_KEY)
 * @returns SnippetsStorage instance
 */
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

/**
 * Normalize loaded state from storage
 * Validates and sanitizes folders and snippets
 * @param input - Partial state from storage
 * @returns Normalized snippets state
 */
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

/**
 * Validate snippet folder object
 * @param value - Value to validate
 * @returns true if valid SnippetFolder
 */
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

/**
 * Validate snippet item object
 * @param value - Value to validate
 * @returns true if valid SnippetItem
 */
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
