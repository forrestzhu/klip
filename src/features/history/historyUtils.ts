/**
 * History Utilities
 *
 * Helper functions for validating, normalizing, and managing
 * clipboard history items.
 */

import {
	DEFAULT_HISTORY_MAX_ITEMS,
	MAX_HISTORY_MAX_ITEMS,
	MIN_HISTORY_MAX_ITEMS,
} from "./history.constants";

/**
 * Type guard to check if a value is non-empty capturable text.
 * @param value - Value to check
 * @returns True if value is a non-empty string
 */
export function isCapturableText(
	value: string | null | undefined,
): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

/**
 * Normalizes the source application name.
 * @param value - Source app name to normalize
 * @returns Normalized name, or null if invalid
 */
export function normalizeSourceApp(
	value: string | null | undefined,
): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

/**
 * Clamps the max items value to allowed range.
 * @param value - Value to clamp
 * @returns Clamped value between MIN_HISTORY_MAX_ITEMS and MAX_HISTORY_MAX_ITEMS
 */
export function clampHistoryMaxItems(value: number): number {
	const safeValue = Number.isFinite(value)
		? Math.trunc(value)
		: DEFAULT_HISTORY_MAX_ITEMS;

	return Math.min(
		MAX_HISTORY_MAX_ITEMS,
		Math.max(MIN_HISTORY_MAX_ITEMS, safeValue),
	);
}

/**
 * Creates a unique history item ID.
 * @returns Unique ID string
 */
export function createHistoryId(): string {
	if (typeof globalThis.crypto?.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	const random = Math.random().toString(36).slice(2, 12);
	return `hist-${Date.now()}-${random}`;
}

/**
 * Check if a history item is empty
 * @param text - Text content to check
 * @returns True if text is empty or whitespace only
 */
export function isEmptyHistoryItem(text: string): boolean {
	return !text || text.trim().length === 0;
}

/**
 * Validate history item content
 * @param text - Text content to validate
 * @returns True if text is valid (not empty and not too long)
 */
export function validateHistoryItem(text: string): boolean {
	// Not empty and not too long (max 10MB)
	return !isEmptyHistoryItem(text) && text.length <= 10 * 1024 * 1024;
}
