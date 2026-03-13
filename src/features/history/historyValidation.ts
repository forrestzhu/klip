/**
 * History Validation Utilities
 *
 * Provides validation functions for clipboard history items.
 * Supports type guards, batch validation, and storage eligibility checks.
 *
 * @module historyValidation
 */

import type { HistoryItem } from "./history.types";

/**
 * Maximum allowed text size for a history item (10MB).
 * Prevents storing excessively large clipboard contents.
 */
const MAX_TEXT_SIZE = 10 * 1024 * 1024;

/**
 * Type guard to validate a single history item.
 *
 * Checks that the item has all required fields with correct types:
 * - id: non-empty string
 * - text: string
 * - createdAt: string (ISO timestamp)
 * - sourceApp: string or null
 *
 * @param item - Unknown value to validate
 * @returns True if item is a valid HistoryItem, false otherwise
 *
 * @example
 * ```ts
 * if (validateHistoryItem(data)) {
 *   // data is now typed as HistoryItem
 *   console.log(data.text);
 * }
 * ```
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
 * Validate and filter an array of history items.
 *
 * Returns only valid HistoryItem objects from the input array.
 * Invalid items are silently filtered out.
 *
 * @param items - Unknown value to validate (should be an array)
 * @returns Array of valid HistoryItem objects
 *
 * @example
 * ```ts
 * const validItems = validateHistoryItems(rawData);
 * // validItems contains only properly formatted history items
 * ```
 */
export function validateHistoryItems(items: unknown): HistoryItem[] {
	if (!Array.isArray(items)) return [];

	return items.filter(validateHistoryItem);
}

/**
 * Check if a history item is eligible for storage.
 *
 * Validates that:
 * - Text content is non-empty (after trimming)
 * - Text size does not exceed 10MB limit
 * - ID is non-empty (after trimming)
 *
 * @param item - History item to check
 * @returns True if item is valid for storage, false otherwise
 *
 * @example
 * ```ts
 * if (isValidForStorage(historyItem)) {
 *   await storage.save(historyItem);
 * }
 * ```
 */
export function isValidForStorage(item: HistoryItem): boolean {
	return (
		item.text.trim().length > 0 &&
		item.text.length <= MAX_TEXT_SIZE &&
		item.id.trim().length > 0
	);
}
