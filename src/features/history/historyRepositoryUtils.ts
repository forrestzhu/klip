/**
 * Utility functions for HistoryRepository
 */

import type { HistoryItem } from "./history.types";
import { isEmptyHistoryItem, validateHistoryItem } from "./historyUtils";

/**
 * Filter out invalid history items
 */
export function filterInvalidHistoryItems(items: HistoryItem[]): HistoryItem[] {
	return items.filter(item => validateHistoryItem(item.text));
}

/**
 * Remove duplicate history items (by text content)
 */
export function removeDuplicateHistoryItems(items: HistoryItem[]): HistoryItem[] {
	const seen = new Set<string>();
	return items.filter(item => {
		if (seen.has(item.text)) {
			return false;
		}
		seen.add(item.text);
		return true;
	});
}

/**
 * Sort history items by creation date (newest first)
 */
export function sortHistoryItemsByDate(items: HistoryItem[]): HistoryItem[] {
	return [...items].sort((a, b) => {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});
}
