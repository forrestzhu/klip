/**
 * History Storage Implementation
 *
 * Browser-based storage implementation for clipboard history state.
 * Provides localStorage-based persistence with normalization and validation.
 */

import {
	DEFAULT_HISTORY_MAX_ITEMS,
	HISTORY_SCHEMA_VERSION,
} from "./history.constants";
import type { HistoryState, HistoryStorage } from "./history.types";
import { clampHistoryMaxItems, normalizeSourceApp } from "./historyUtils";

/** Storage key for clipboard history in localStorage */
export const HISTORY_STORAGE_KEY = "klip.history.v1";

/**
 * Interface for key-value storage (e.g., localStorage).
 */
export interface KeyValueStorage {
	/**
	 * Gets a value from storage.
	 * @param key - Storage key
	 * @returns Stored value, or null if not found
	 */
	getItem(key: string): string | null;
	/**
	 * Sets a value in storage.
	 * @param key - Storage key
	 * @param value - Value to store
	 */
	setItem(key: string, value: string): void;
}

/**
 * Creates a browser-based history storage implementation.
 * @param storage - Key-value storage instance (e.g., localStorage)
 * @param storageKey - Optional custom storage key
 * @returns HistoryStorage instance
 */
export function createBrowserHistoryStorage(
	storage: KeyValueStorage,
	storageKey = HISTORY_STORAGE_KEY,
): HistoryStorage {
	return {
		async load() {
			const raw = storage.getItem(storageKey);
			if (!raw) {
				return null;
			}

			try {
				const parsed = JSON.parse(raw) as Partial<HistoryState>;
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
 * Normalizes loaded history state from storage.
 * Validates and sanitizes data to ensure consistency.
 * @param input - Partial history state from storage
 * @returns Normalized history state
 */
function normalizeLoadedState(input: Partial<HistoryState>): HistoryState {
	const items = Array.isArray(input.items) ? input.items : [];

	return {
		schemaVersion:
			typeof input.schemaVersion === "number"
				? input.schemaVersion
				: HISTORY_SCHEMA_VERSION,
		maxItems: clampHistoryMaxItems(
			typeof input.maxItems === "number"
				? input.maxItems
				: DEFAULT_HISTORY_MAX_ITEMS,
		),
		items: items
			.filter((item): item is HistoryState["items"][number] => {
				return (
					typeof item?.id === "string" &&
					typeof item?.text === "string" &&
					typeof item?.createdAt === "string"
				);
			})
			.map((item) => ({
				id: item.id,
				text: item.text,
				createdAt: item.createdAt,
				sourceApp: normalizeSourceApp(item.sourceApp),
			})),
	};
}
