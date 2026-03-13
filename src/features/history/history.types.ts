/**
 * History Type Definitions
 *
 * Provides TypeScript type definitions for the clipboard history feature.
 * History items represent clipboard content that has been copied by the user.
 *
 * @module historyTypes
 */

/**
 * Represents a single clipboard history item.
 */
export interface HistoryItem {
	/** Unique identifier for the history item */
	id: string;
	/** The clipboard text content */
	text: string;
	/** ISO 8601 timestamp when the item was created (copied) */
	createdAt: string;
	/** Source application name (if available) or null */
	sourceApp: string | null;
}

/**
 * Complete state of the clipboard history feature.
 * This is the structure persisted to storage.
 */
export interface HistoryState {
	/** Schema version for migration purposes */
	schemaVersion: number;
	/** Maximum number of items to retain in history */
	maxItems: number;
	/** List of history items (newest first) */
	items: HistoryItem[];
}

/**
 * Storage interface for persisting clipboard history state.
 * Implementations can use different storage backends (localStorage, file, etc.)
 */
export interface HistoryStorage {
	/**
	 * Load the history state from storage.
	 * @returns The history state, or null if not found or invalid
	 */
	load(): Promise<HistoryState | null>;

	/**
	 * Save the history state to storage.
	 * @param state - The history state to persist
	 */
	save(state: HistoryState): Promise<void>;
}
