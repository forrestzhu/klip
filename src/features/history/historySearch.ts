/**
 * History search utilities
 */

import type { HistoryItem } from "./history.types";

/**
 * Search history items by text content
 */
export function searchHistoryItems(items: HistoryItem[], query: string): HistoryItem[] {
	if (!query || query.trim().length === 0) {
		return items;
	}

	const normalizedQuery = query.toLowerCase().trim();
	return items.filter(item => 
		item.text.toLowerCase().includes(normalizedQuery)
	);
}

/**
 * Search history items with case sensitivity option
 */
export function searchHistoryItemsAdvanced(
	items: HistoryItem[], 
	query: string, 
	caseSensitive: boolean = false
): HistoryItem[] {
	if (!query || query.trim().length === 0) {
		return items;
	}

	const searchQuery = caseSensitive ? query : query.toLowerCase();
	return items.filter(item => {
		const text = caseSensitive ? item.text : item.text.toLowerCase();
		return text.includes(searchQuery);
	});
}
