/**
 * History Search Utilities
 *
 * Provides search functionality for clipboard history items.
 * Supports case-insensitive and case-sensitive search modes.
 *
 * @module historySearch
 */

import type { HistoryItem } from "./history.types";

/**
 * Search history items by text content (case-insensitive).
 *
 * Performs a case-insensitive substring search across all history items.
 * Empty or whitespace-only queries return all items unchanged.
 *
 * @param items - Array of history items to search
 * @param query - Search query string
 * @returns Filtered array of matching history items
 *
 * @example
 * ```ts
 * const items = [
 *   { id: "1", text: "Hello World", timestamp: Date.now() },
 *   { id: "2", text: "Goodbye World", timestamp: Date.now() }
 * ];
 * searchHistoryItems(items, "hello"); // Returns item 1
 * searchHistoryItems(items, ""); // Returns all items
 * ```
 */
export function searchHistoryItems(
	items: HistoryItem[],
	query: string,
): HistoryItem[] {
	if (!query || query.trim().length === 0) {
		return items;
	}

	const normalizedQuery = query.toLowerCase().trim();
	return items.filter((item) =>
		item.text.toLowerCase().includes(normalizedQuery),
	);
}

/**
 * Search history items with optional case sensitivity.
 *
 * Advanced search function that allows toggling case sensitivity.
 * Empty or whitespace-only queries return all items unchanged.
 *
 * @param items - Array of history items to search
 * @param query - Search query string
 * @param caseSensitive - Whether search should be case-sensitive (default: false)
 * @returns Filtered array of matching history items
 *
 * @example
 * ```ts
 * const items = [
 *   { id: "1", text: "Hello World", timestamp: Date.now() },
 *   { id: "2", text: "hello world", timestamp: Date.now() }
 * ];
 * searchHistoryItemsAdvanced(items, "Hello", true); // Returns item 1 only
 * searchHistoryItemsAdvanced(items, "Hello", false); // Returns both items
 * ```
 */
export function searchHistoryItemsAdvanced(
	items: HistoryItem[],
	query: string,
	caseSensitive: boolean = false,
): HistoryItem[] {
	if (!query || query.trim().length === 0) {
		return items;
	}

	const searchQuery = caseSensitive ? query : query.toLowerCase();
	return items.filter((item) => {
		const text = caseSensitive ? item.text : item.text.toLowerCase();
		return text.includes(searchQuery);
	});
}
