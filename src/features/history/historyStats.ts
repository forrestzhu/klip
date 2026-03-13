/**
 * History Statistics Utilities
 *
 * Provides statistical analysis and aggregation functions for clipboard history.
 * Supports calculating totals, unique counts, date grouping, and recent item retrieval.
 *
 * @module historyStats
 */

import type { HistoryItem } from "./history.types";

/**
 * Statistics result from calculating history metrics.
 */
interface HistoryStats {
	/** Total number of items in history */
	total: number;
	/** Number of unique text contents */
	unique: number;
	/** Count of items with source application information */
	withSourceApp: number;
	/** Timestamp of the oldest item (null if empty) */
	oldestItem: number | null;
	/** Timestamp of the newest item (null if empty) */
	newestItem: number | null;
}

/**
 * Calculate comprehensive statistics for clipboard history.
 *
 * Computes total count, unique content count, items with source app info,
 * and oldest/newest item timestamps.
 *
 * @param items - Array of history items to analyze
 * @returns Statistics object with computed metrics
 *
 * @example
 * ```ts
 * const stats = calculateHistoryStats(historyItems);
 * // {
 * //   total: 150,
 * //   unique: 142,
 * //   withSourceApp: 120,
 * //   oldestItem: 1710345600000,
 * //   newestItem: 1710432000000
 * // }
 * ```
 */
export function calculateHistoryStats(items: HistoryItem[]): HistoryStats {
	return {
		total: items.length,
		unique: new Set(items.map((item) => item.text)).size,
		withSourceApp: items.filter((item) => item.sourceApp !== null).length,
		oldestItem: items.length > 0 ? items[items.length - 1].createdAt : null,
		newestItem: items.length > 0 ? items[0].createdAt : null,
	};
}

/**
 * Get the N most recent history items.
 *
 * Returns a slice of the history array containing the most recent items.
 * Items are assumed to be sorted by creation time (newest first).
 *
 * @param items - Array of history items (sorted newest first)
 * @param count - Number of items to return (default: 10)
 * @returns Array of recent history items
 *
 * @example
 * ```ts
 * const recent = getRecentItems(historyItems, 5);
 * // Returns the 5 most recent clipboard items
 * ```
 */
export function getRecentItems(
	items: HistoryItem[],
	count: number = 10,
): HistoryItem[] {
	return items.slice(0, Math.min(count, items.length));
}

/**
 * Group history items by date (YYYY-MM-DD format).
 *
 * Organizes items into a map where keys are ISO date strings
 * and values are arrays of items created on that date.
 *
 * @param items - Array of history items to group
 * @returns Map of date strings to arrays of history items
 *
 * @example
 * ```ts
 * const grouped = groupItemsByDate(historyItems);
 * // Map {
 * //   "2026-03-14" => [item1, item2, ...],
 * //   "2026-03-13" => [item3, item4, ...]
 * // }
 * ```
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
