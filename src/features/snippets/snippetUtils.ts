/**
 * Snippet utility functions
 *
 * Provides helper functions for normalizing and validating snippet data.
 * Includes title derivation, text truncation, and alias generation utilities.
 */

import {
	DEFAULT_SNIPPET_ALIAS_MAX_LENGTH,
	DEFAULT_SNIPPET_TITLE_MAX_LENGTH,
	DEFAULT_SNIPPETS_FOLDER_NAME,
} from "./snippet.constants";

/**
 * Check if a value is non-empty text
 * @param value - Value to check
 * @returns True if value is a non-empty string
 */
export function isNonEmptyText(
	value: string | null | undefined,
): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

/**
 * Normalize a snippet title with optional fallback text.
 *
 * If the provided value is a non-empty string, it will be trimmed and truncated.
 * Otherwise, the function will derive a title from the fallback text if provided.
 * If both value and fallback are empty, returns "Untitled Snippet".
 *
 * @param value - The title to normalize
 * @param fallbackText - Optional text to derive title from if value is empty
 * @returns A normalized snippet title
 *
 * @example
 * ```ts
 * normalizeSnippetTitle("  My Snippet  "); // "My Snippet"
 * normalizeSnippetTitle("", "Hello World"); // "Hello World"
 * normalizeSnippetTitle(""); // "Untitled Snippet"
 * ```
 */
export function normalizeSnippetTitle(
	value: string | null | undefined,
	fallbackText?: string,
): string {
	if (typeof value === "string" && value.trim().length > 0) {
		return truncateTitle(value.trim());
	}

	if (typeof fallbackText === "string" && fallbackText.trim().length > 0) {
		return deriveSnippetTitle(fallbackText);
	}

	return "Untitled Snippet";
}

/**
 * Normalize a snippet folder name.
 *
 * If the provided value is a non-empty string, it will be trimmed.
 * Otherwise, returns the default folder name "General".
 *
 * @param value - The folder name to normalize
 * @returns A normalized folder name
 *
 * @example
 * ```ts
 * normalizeFolderName("  My Folder  "); // "My Folder"
 * normalizeFolderName(""); // "General"
 * normalizeFolderName(null); // "General"
 * ```
 */
export function normalizeFolderName(value: string | null | undefined): string {
	if (typeof value === "string" && value.trim().length > 0) {
		return value.trim();
	}

	return DEFAULT_SNIPPETS_FOLDER_NAME;
}

/**
 * Derive a snippet title from the given text.
 *
 * This function collapses whitespace and truncates the text to create
 * a suitable title. If the text is empty, returns "Untitled Snippet".
 *
 * @param text - The text to derive a title from
 * @returns A derived snippet title
 *
 * @example
 * ```ts
 * deriveSnippetTitle("  Hello   World  "); // "Hello World"
 * deriveSnippetTitle(""); // "Untitled Snippet"
 * deriveSnippetTitle("This is a very long title that will be truncated");
 * // "This is a very long title…"
 * ```
 */
export function deriveSnippetTitle(text: string): string {
	const collapsed = text.replace(/\s+/g, " ").trim();
	if (collapsed.length === 0) {
		return "Untitled Snippet";
	}

	return truncateTitle(collapsed);
}

/**
 * Normalize snippet text.
 *
 * Checks if the value is a non-empty string and returns it if valid.
 * Returns null for invalid values (null, undefined, or empty strings).
 *
 * @param value - The text to normalize
 * @returns The original text if valid, null otherwise
 *
 * @example
 * ```ts
 * normalizeSnippetText("  Hello  "); // "  Hello  " (preserves original)
 * normalizeSnippetText(""); // null
 * normalizeSnippetText(null); // null
 * normalizeSnippetText("Hello"); // "Hello"
 * ```
 */
export function normalizeSnippetText(
	value: string | null | undefined,
): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? value : null;
}

/**
 * Normalize a snippet alias.
 *
 * This function processes alias strings by:
 * - Converting to lowercase
 * - Removing leading semicolon if present
 * - Replacing spaces with hyphens
 * - Removing invalid characters (only allows a-z, 0-9, hyphens, and underscores)
 * - Truncating to maximum length if necessary
 *
 * @param value - The alias to normalize
 * @returns A normalized alias string, or null if invalid
 *
 * @example
 * ```ts
 * normalizeSnippetAlias("my-alias"); // "my-alias"
 * normalizeSnippetAlias(";my-alias"); // "my-alias"
 * normalizeSnippetAlias("My Alias"); // "my-alias"
 * normalizeSnippetAlias("My@Alias!123"); // "my-alias123"
 * normalizeSnippetAlias(""); // null
 * ```
 */
export function normalizeSnippetAlias(
	value: string | null | undefined,
): string | null {
	if (typeof value !== "string") {
		return null;
	}

	let alias = value.trim().toLowerCase();
	if (alias.startsWith(";")) {
		alias = alias.slice(1).trim();
	}
	if (alias.length === 0) {
		return null;
	}

	const normalizedAlias = alias
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9_-]/g, "");
	if (normalizedAlias.length === 0) {
		return null;
	}

	if (normalizedAlias.length > DEFAULT_SNIPPET_ALIAS_MAX_LENGTH) {
		return normalizedAlias.slice(0, DEFAULT_SNIPPET_ALIAS_MAX_LENGTH);
	}

	return normalizedAlias;
}

/**
 * Create a unique snippet identifier.
 *
 * Uses the Web Crypto API's randomUUID function if available,
 * otherwise falls back to a timestamp-based random string.
 *
 * @returns A unique snippet ID
 *
 * @example
 * ```ts
 * const id = createSnippetId();
 * // Possible output: "550e8400-e29b-41d4-a716-446655440000"
 * // Or (fallback): "snpt-1678901234567-a1b2c3d4e5"
 * ```
 */
export function createSnippetId(): string {
	if (typeof globalThis.crypto?.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	const random = Math.random().toString(36).slice(2, 12);
	return `snpt-${Date.now()}-${random}`;
}

/**
 * Truncate a title to the maximum length.
 *
 * If the title exceeds the maximum length, truncates it and adds an ellipsis.
 * Otherwise, returns the title unchanged.
 *
 * @param value - The title to truncate
 * @returns A truncated title with ellipsis if necessary
 *
 * @private
 */
function truncateTitle(value: string): string {
	if (value.length <= DEFAULT_SNIPPET_TITLE_MAX_LENGTH) {
		return value;
	}

	return `${value.slice(0, DEFAULT_SNIPPET_TITLE_MAX_LENGTH - 1)}…`;
}
