/**
 * History statistics utilities
 */

import type { HistoryItem } from "./history.types";

/**
 * Calculate history statistics
 */
export function calculateHistoryStats(items: HistoryItem[]) {
	return {
		total: items.length,
		unique: new Set(items.map((item) => item.text)).size,
		withSourceApp: items.filter((item) => item.sourceApp !== null).length,
		oldestItem: items.length > 0 ? items[items.length - 1].createdAt : null,
		newestItem: items.length > 0 ? items[0].createdAt : null,
	};
}

/**
 * Get top N most recent items
 */
export function getRecentItems(
	items: HistoryItem[],
	count: number = 10,
): HistoryItem[] {
	return items.slice(0, Math.min(count, items.length));
}

/**
 * Group items by date
 */
export function groupItemsByDate(
	items: HistoryItem[],
): Map<string, HistoryItem[]> {
	const grouped = new Map<string, HistoryItem[]>();

	for (const item of items) {
		const date = new Date(item.createdAt).toISOString().split("T")[0];
		if (!grouped.has(date)) {
			grouped.set(date, []);
		}
		const group = grouped.get(date);
		if (group) {
			group.push(item);
		}
	}

	return grouped;
}
