/**
 * Paste Mode Storage
 *
 * Manages persistent storage of paste behavior settings.
 * Controls how clipboard content is pasted into target applications.
 *
 * Modes:
 * - `direct-with-fallback`: Try direct paste first, fall back to clipboard
 * - `clipboard-only`: Only use system clipboard
 *
 * @module pasteModeStorage
 */

export const PASTE_MODE_STORAGE_KEY = "klip.settings.pasteMode";

export const PASTE_MODE_DIRECT_WITH_FALLBACK = "direct-with-fallback";
export const PASTE_MODE_CLIPBOARD_ONLY = "clipboard-only";

export type PasteMode =
	| typeof PASTE_MODE_DIRECT_WITH_FALLBACK
	| typeof PASTE_MODE_CLIPBOARD_ONLY;

export const DEFAULT_PASTE_MODE: PasteMode = PASTE_MODE_DIRECT_WITH_FALLBACK;

/**
 * Read paste mode from storage
 * @param storage - Storage interface (typically localStorage)
 * @returns Current paste mode
 */
export function readPasteMode(storage: Storage): PasteMode {
	const rawValue = storage.getItem(PASTE_MODE_STORAGE_KEY);
	if (rawValue === null) {
		return DEFAULT_PASTE_MODE;
	}

	return normalizePasteMode(rawValue);
}

/**
 * Write paste mode to storage
 * @param storage - Storage interface (typically localStorage)
 * @param value - Paste mode value (will be normalized)
 * @returns Normalized paste mode that was persisted
 */
export function writePasteMode(storage: Storage, value: string): PasteMode {
	const normalized = normalizePasteMode(value);
	storage.setItem(PASTE_MODE_STORAGE_KEY, normalized);
	return normalized;
}

/**
 * Normalize paste mode value
 * Handles legacy formats and validates input
 * @param value - Value to normalize
 * @returns Valid paste mode or default
 */
function normalizePasteMode(value: string): PasteMode {
	const normalized = value.trim();
	if (normalized === PASTE_MODE_CLIPBOARD_ONLY) {
		return PASTE_MODE_CLIPBOARD_ONLY;
	}

	return PASTE_MODE_DIRECT_WITH_FALLBACK;
}
