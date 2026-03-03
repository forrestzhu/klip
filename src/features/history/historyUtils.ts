import {
	DEFAULT_HISTORY_MAX_ITEMS,
	MAX_HISTORY_MAX_ITEMS,
	MIN_HISTORY_MAX_ITEMS,
} from "./history.constants";

export function isCapturableText(
	value: string | null | undefined,
): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function normalizeSourceApp(
	value: string | null | undefined,
): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const normalized = value.trim();
	return normalized.length > 0 ? normalized : null;
}

export function clampHistoryMaxItems(value: number): number {
	const safeValue = Number.isFinite(value)
		? Math.trunc(value)
		: DEFAULT_HISTORY_MAX_ITEMS;

	return Math.min(
		MAX_HISTORY_MAX_ITEMS,
		Math.max(MIN_HISTORY_MAX_ITEMS, safeValue),
	);
}

export function createHistoryId(): string {
	if (typeof globalThis.crypto?.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	const random = Math.random().toString(36).slice(2, 12);
	return `hist-${Date.now()}-${random}`;
}
