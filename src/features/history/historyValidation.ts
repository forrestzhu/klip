/**
 * History validation utilities
 */

import type { HistoryItem } from "./history.types";

/**
 * Validate a single history item
 */
export function validateHistoryItem(item: unknown): item is HistoryItem {
	if (typeof item !== "object" || item === null) return false;

	const candidate = item as Record<string, unknown>;

	return (
		typeof candidate.id === "string" &&
		typeof candidate.text === "string" &&
		typeof candidate.createdAt === "string" &&
		(candidate.sourceApp === null || typeof candidate.sourceApp === "string")
	);
}

/**
 * Validate an array of history items
 */
export function validateHistoryItems(items: unknown): HistoryItem[] {
	if (!Array.isArray(items)) return [];

	return items.filter(validateHistoryItem);
}

/**
 * Check if history item is valid for storage
 */
export function isValidForStorage(item: HistoryItem): boolean {
	return (
		item.text.trim().length > 0 &&
		item.text.length <= 10 * 1024 * 1024 && // Max 10MB
		item.id.trim().length > 0
	);
}
