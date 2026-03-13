/**
 * Clipboard Preview Utility
 *
 * Provides a function to convert clipboard text into a preview format
 * suitable for display in UI components.
 */

/**
 * Convert clipboard text to a preview string for display.
 *
 * This function normalizes whitespace and truncates the text if it exceeds
 * the maximum length. Truncated text is marked with an ellipsis (…) character.
 *
 * @param value - The original clipboard text to preview
 * @param maxLength - Maximum length of the preview string (default: 80)
 * @returns A preview string, possibly truncated with an ellipsis
 *
 * @example
 * ```ts
 * // Short text - no truncation
 * toClipboardPreview("Hello", 80); // "Hello"
 *
 * // Long text - truncated
 * toClipboardPreview("This is a very long text that needs truncation", 20);
 * // "This is a very long…"
 *
 * // Normalized whitespace
 * toClipboardPreview("  Multiple   spaces   here  ", 80); // "Multiple spaces here"
 * ```
 */
export function toClipboardPreview(value: string, maxLength = 80): string {
	const normalized = value.replace(/\s+/g, " ").trim();

	if (normalized.length <= maxLength) {
		return normalized;
	}

	return `${normalized.slice(0, maxLength - 1)}…`;
}
