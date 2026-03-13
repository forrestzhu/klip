/**
 * Hotkey Storage Module
 *
 * Manages persistent storage and normalization of keyboard shortcuts.
 * Handles reading, writing, and canonicalization of hotkey strings.
 *
 * Features:
 * - Read/write panel hotkey from localStorage
 * - Read/write snippet alias hotkey from localStorage
 * - Normalize hotkey strings to canonical format
 * - Handle legacy hotkey formats
 *
 * @module hotkeyStorage
 */

import {
	DEFAULT_PANEL_HOTKEY,
	DEFAULT_SNIPPET_ALIAS_HOTKEY,
	PANEL_HOTKEY_STORAGE_KEY,
	SNIPPET_ALIAS_HOTKEY_STORAGE_KEY,
} from "./hotkey.constants";

/**
 * Read panel hotkey from storage
 * @param storage - Storage interface (typically localStorage)
 * @returns Hotkey string in canonical format
 * @example
 * ```ts
 * const hotkey = readPanelHotkey(localStorage);
 * // Returns: "CommandOrControl+Shift+K"
 * ```
 */
export function readPanelHotkey(storage: Storage): string {
	const rawValue = storage.getItem(PANEL_HOTKEY_STORAGE_KEY);
	if (rawValue === null) {
		return DEFAULT_PANEL_HOTKEY;
	}

	const normalized = canonicalizePanelHotkey(rawValue);
	if (normalized.length === 0) {
		storage.setItem(PANEL_HOTKEY_STORAGE_KEY, DEFAULT_PANEL_HOTKEY);
		return DEFAULT_PANEL_HOTKEY;
	}

	if (isLegacyDefaultPanelHotkey(normalized)) {
		storage.setItem(PANEL_HOTKEY_STORAGE_KEY, DEFAULT_PANEL_HOTKEY);
		return DEFAULT_PANEL_HOTKEY;
	}

	if (rawValue !== normalized) {
		storage.setItem(PANEL_HOTKEY_STORAGE_KEY, normalized);
	}

	return normalized;
}

/**
 * Write panel hotkey to storage
 * @param storage - Storage interface (typically localStorage)
 * @param value - Hotkey string (will be normalized)
 * @returns Normalized hotkey string that was persisted
 * @example
 * ```ts
 * writePanelHotkey(localStorage, "cmd shift k");
 * // Persists and returns: "CommandOrControl+Shift+K"
 * ```
 */
export function writePanelHotkey(storage: Storage, value: string): string {
	const normalized = canonicalizePanelHotkey(value);
	const persistedValue =
		normalized.length === 0 ? DEFAULT_PANEL_HOTKEY : normalized;

	storage.setItem(PANEL_HOTKEY_STORAGE_KEY, persistedValue);
	return persistedValue;
}

/**
 * Read snippet alias hotkey from storage
 * @param storage - Storage interface (typically localStorage)
 * @returns Hotkey string in canonical format
 */
export function readSnippetAliasHotkey(storage: Storage): string {
	const rawValue = storage.getItem(SNIPPET_ALIAS_HOTKEY_STORAGE_KEY);
	if (rawValue === null) {
		return DEFAULT_SNIPPET_ALIAS_HOTKEY;
	}

	const normalized = canonicalizePanelHotkey(rawValue);
	if (rawValue !== normalized) {
		storage.setItem(SNIPPET_ALIAS_HOTKEY_STORAGE_KEY, normalized);
	}
	return normalized;
}

/**
 * Write snippet alias hotkey to storage
 * @param storage - Storage interface (typically localStorage)
 * @param value - Hotkey string (will be normalized)
 * @returns Normalized hotkey string that was persisted
 */
export function writeSnippetAliasHotkey(
	storage: Storage,
	value: string,
): string {
	const normalized = canonicalizePanelHotkey(value);
	storage.setItem(SNIPPET_ALIAS_HOTKEY_STORAGE_KEY, normalized);
	return normalized;
}

/**
 * Canonicalize a hotkey string to standard format
 *
 * Converts various hotkey formats to a canonical representation:
 * - Normalizes modifiers: CommandOrControl, Shift, Alt
 * - Orders modifiers consistently
 * - Uppercases letter keys
 * - Handles legacy formats (e.g., "Shift+Super+KeyK")
 *
 * @param value - Hotkey string in any format
 * @returns Canonical hotkey string (e.g., "CommandOrControl+Shift+K")
 * @example
 * ```ts
 * canonicalizePanelHotkey("cmd shift k");
 * // Returns: "CommandOrControl+Shift+K"
 *
 * canonicalizePanelHotkey("Shift+Super+KeyK");
 * // Returns: "CommandOrControl+Shift+K"
 * ```
 */
export function canonicalizePanelHotkey(value: string): string {
	const tokens =
		value
			.match(/[A-Za-z0-9]+/g)
			?.map((token) => token.trim())
			.filter((token) => token.length > 0) ?? [];
	if (tokens.length === 0) {
		return "";
	}

	const modifierSet = new Set<string>();
	const keys: string[] = [];
	for (const token of tokens) {
		const normalizedToken = token.toLowerCase();
		if (
			normalizedToken === "commandorcontrol" ||
			normalizedToken === "super" ||
			normalizedToken === "meta" ||
			normalizedToken === "command" ||
			normalizedToken === "control" ||
			normalizedToken === "ctrl"
		) {
			modifierSet.add("CommandOrControl");
			continue;
		}

		if (normalizedToken === "shift") {
			modifierSet.add("Shift");
			continue;
		}

		if (normalizedToken === "alt" || normalizedToken === "option") {
			modifierSet.add("Alt");
			continue;
		}

		keys.push(normalizeKeyToken(token));
	}

	const orderedModifiers = ["CommandOrControl", "Shift", "Alt"].filter(
		(modifier) => modifierSet.has(modifier),
	);
	return [...orderedModifiers, ...keys].join("+");
}

/**
 * Check if hotkey matches legacy default format
 * @param value - Hotkey string to check
 * @returns true if matches legacy format
 */
function isLegacyDefaultPanelHotkey(value: string): boolean {
	const normalized = value.replaceAll(" ", "").toLowerCase();
	return (
		normalized === "commandorcontrol+shift+k" ||
		normalized === "shift+super+keyk"
	);
}

/**
 * Normalize a single key token
 * Handles special formats like "KeyK" → "K", "Digit1" → "1"
 * @param value - Key token to normalize
 * @returns Normalized key token
 */
function normalizeKeyToken(value: string): string {
	const normalized = value.trim();
	const lowered = normalized.toLowerCase();

	if (/^key[a-z]$/.test(lowered)) {
		return lowered.slice(3).toUpperCase();
	}

	if (/^digit[0-9]$/.test(lowered)) {
		return lowered.slice(5);
	}

	if (/^[a-z]$/.test(lowered)) {
		return lowered.toUpperCase();
	}

	return normalized;
}
