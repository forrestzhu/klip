import {
	DEFAULT_PANEL_HOTKEY,
	DEFAULT_SNIPPET_ALIAS_HOTKEY,
	PANEL_HOTKEY_STORAGE_KEY,
	SNIPPET_ALIAS_HOTKEY_STORAGE_KEY,
} from "./hotkey.constants";

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

export function writePanelHotkey(storage: Storage, value: string): string {
	const normalized = canonicalizePanelHotkey(value);
	const persistedValue =
		normalized.length === 0 ? DEFAULT_PANEL_HOTKEY : normalized;

	storage.setItem(PANEL_HOTKEY_STORAGE_KEY, persistedValue);
	return persistedValue;
}

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

export function writeSnippetAliasHotkey(
	storage: Storage,
	value: string,
): string {
	const normalized = canonicalizePanelHotkey(value);
	storage.setItem(SNIPPET_ALIAS_HOTKEY_STORAGE_KEY, normalized);
	return normalized;
}

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

function isLegacyDefaultPanelHotkey(value: string): boolean {
	const normalized = value.replaceAll(" ", "").toLowerCase();
	return (
		normalized === "commandorcontrol+shift+k" ||
		normalized === "shift+super+keyk"
	);
}

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
