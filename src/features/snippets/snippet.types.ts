/**
 * Snippet Type Definitions
 *
 * Provides TypeScript type definitions for the snippets feature.
 * Snippets are saved text fragments that can be quickly inserted
 * via keyboard shortcuts or the popup menu.
 *
 * @module snippetTypes
 */

/**
 * Represents a folder for organizing snippets.
 */
export interface SnippetFolder {
	/** Unique identifier for the folder */
	id: string;
	/** Display name of the folder */
	name: string;
	/** ISO 8601 timestamp when the folder was created */
	createdAt: string;
	/** ISO 8601 timestamp when the folder was last updated */
	updatedAt: string;
}

/**
 * Represents a single snippet item.
 */
export interface SnippetItem {
	/** Unique identifier for the snippet */
	id: string;
	/** Display title for the snippet (shown in UI) */
	title: string;
	/** The actual text content of the snippet */
	text: string;
	/** Optional short alias for quick access (e.g., ";email") */
	alias?: string | null;
	/** ID of the folder this snippet belongs to */
	folderId: string;
	/** ISO 8601 timestamp when the snippet was created */
	createdAt: string;
	/** ISO 8601 timestamp when the snippet was last updated */
	updatedAt: string;
}

/**
 * Complete state of the snippets feature.
 * This is the structure persisted to storage.
 */
export interface SnippetsState {
	/** Schema version for migration purposes */
	schemaVersion: number;
	/** List of snippet folders */
	folders: SnippetFolder[];
	/** List of snippet items */
	snippets: SnippetItem[];
}

/**
 * Storage interface for persisting snippets state.
 * Implementations can use different storage backends (localStorage, file, etc.)
 */
export interface SnippetsStorage {
	/**
	 * Load the snippets state from storage.
	 * @returns The snippets state, or null if not found or invalid
	 */
	load(): Promise<SnippetsState | null>;

	/**
	 * Save the snippets state to storage.
	 * @param state - The snippets state to persist
	 */
	save(state: SnippetsState): Promise<void>;
}
