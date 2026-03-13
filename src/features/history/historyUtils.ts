/**
 * History Utilities
 *
 * Helper functions for validating, normalizing, and managing
 * clipboard history items. Provides core validation logic,
 * ID generation, and data normalization utilities.
 *
 * @module historyUtils
 */

import {
	DEFAULT_HISTORY_MAX_ITEMS,
	MAX_HISTORY_MAX_ITEMS,
	MIN_HISTORY_MAX_ITEMS,
} from "./history.constants";

/**
 * Type guard to check if a value is non-empty capturable text.
 *
 * Validates that the value is a string and contains non-whitespace content.
 * Used to filter out empty clipboard entries before capturing.
 *
 * @param value - Value to check (may be null, undefined, or string)
 * @returns True if value is a non-empty string with content beyond whitespace
 *
 * @example
 * ```ts
 * isCapturableText("Hello"); // true
 * isCapturableText("   "); // false (whitespace only)
 * isCapturableText(""); // false (empty)
 * isCapturableText(null); // false
 * isCapturableText(undefined); // false
 * ```
 */
export function isCapturableText(
	value: string | null | undefined,
): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

/**
 * Normalizes the source application name.
 *
 * Trims whitespace and validates source app name.
 * Returns null for invalid or empty values.
 *
 * @param value - Source app name to normalize (e.g., "com.apple.Safari")
 * @returns Trimmed and validated app name, or null if invalid/empty
 *
 * @example
 * ```ts
 * normalizeSourceApp("com.apple.Safari"); // "com.apple.Safari"
 * normalizeSourceApp("  Safari  "); // "Safari"
 * normalizeSourceApp(""); // null (empty)
 * normalizeSourceApp(null); // null
 * ```
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
 *
 * Ensures the max items configuration stays within safe bounds.
 * Non-finite values default to DEFAULT_HISTORY_MAX_ITEMS.
 *
 * @param value - Value to clamp (user-provided max items setting)
 * @returns Clamped integer value between MIN_HISTORY_MAX_ITEMS and MAX_HISTORY_MAX_ITEMS
 *
 * @example
 * ```ts
 * clampHistoryMaxItems(100); // 100 (within range)
 * clampHistoryMaxItems(0); // 1 (minimum)
 * clampHistoryMaxItems(99999); // 10000 (maximum)
 * clampHistoryMaxItems(NaN); // 100 (default)
 * clampHistoryMaxItems(Infinity); // 100 (default)
 * ```
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
 *
 * Generates a cryptographically secure UUID when available (modern browsers/Node.js).
 * Falls back to timestamp + random string for older environments.
 *
 * @returns Unique ID string in format "hist-{timestamp}-{random}" or UUID
 *
 * @example
 * ```ts
 * createHistoryId(); // "hist-1710374400000-a1b2c3d4e5" (fallback)
 * createHistoryId(); // "550e8400-e29b-41d4-a716-446655440000" (crypto API)
 * ```
 */
export function createHistoryId(): string {
	if (typeof globalThis.crypto?.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	const random = Math.random().toString(36).slice(2, 12);
	return `hist-${Date.now()}-${random}`;
}

/**
 * Check if a history item is empty.
 *
 * Validates whether text content should be considered an empty entry.
 * Empty or whitespace-only strings are treated as empty items.
 *
 * @param text - Text content to check
 * @returns True if text is null, undefined, empty, or whitespace only
 *
 * @example
 * ```ts
 * isEmptyHistoryItem("Hello"); // false
 * isEmptyHistoryItem(""); // true
 * isEmptyHistoryItem("   "); // true
 * isEmptyHistoryItem(null); // true
 * ```
 */
export function isEmptyHistoryItem(text: string): boolean {
	return !text || text.trim().length === 0;
}

/**
 * Validate history item content.
 *
 * Comprehensive validation for clipboard history entries.
 * Checks that content is not empty and within size limits (10MB).
 *
 * @param text - Text content to validate
 * @returns True if text is valid (non-empty and ≤10MB)
 *
 * @example
 * ```ts
 * validateHistoryItem("Short text"); // true
 * validateHistoryItem(""); // false (empty)
 * validateHistoryItem("x".repeat(11 * 1024 * 1024)); // false (too long)
 * ```
 */
export function validateHistoryItem(text: string): boolean {
	// Not empty and not too long (max 10MB)
	return !isEmptyHistoryItem(text) && text.length <= 10 * 1024 * 1024;
}
