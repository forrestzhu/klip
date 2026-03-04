export const PASTE_MODE_STORAGE_KEY = "klip.settings.pasteMode";

export const PASTE_MODE_DIRECT_WITH_FALLBACK = "direct-with-fallback";
export const PASTE_MODE_CLIPBOARD_ONLY = "clipboard-only";

export type PasteMode =
	| typeof PASTE_MODE_DIRECT_WITH_FALLBACK
	| typeof PASTE_MODE_CLIPBOARD_ONLY;

export const DEFAULT_PASTE_MODE: PasteMode = PASTE_MODE_DIRECT_WITH_FALLBACK;

export function readPasteMode(storage: Storage): PasteMode {
	const rawValue = storage.getItem(PASTE_MODE_STORAGE_KEY);
	if (rawValue === null) {
		return DEFAULT_PASTE_MODE;
	}

	return normalizePasteMode(rawValue);
}

export function writePasteMode(storage: Storage, value: string): PasteMode {
	const normalized = normalizePasteMode(value);
	storage.setItem(PASTE_MODE_STORAGE_KEY, normalized);
	return normalized;
}

function normalizePasteMode(value: string): PasteMode {
	const normalized = value.trim();
	if (normalized === PASTE_MODE_CLIPBOARD_ONLY) {
		return PASTE_MODE_CLIPBOARD_ONLY;
	}

	return PASTE_MODE_DIRECT_WITH_FALLBACK;
}
