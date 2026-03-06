import {
	DEFAULT_SNIPPET_ALIAS_MAX_LENGTH,
	DEFAULT_SNIPPET_TITLE_MAX_LENGTH,
	DEFAULT_SNIPPETS_FOLDER_NAME,
} from "./snippet.constants";

export function isNonEmptyText(
	value: string | null | undefined,
): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

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

export function normalizeFolderName(value: string | null | undefined): string {
	if (typeof value === "string" && value.trim().length > 0) {
		return value.trim();
	}

	return DEFAULT_SNIPPETS_FOLDER_NAME;
}

export function deriveSnippetTitle(text: string): string {
	const collapsed = text.replace(/\s+/g, " ").trim();
	if (collapsed.length === 0) {
		return "Untitled Snippet";
	}

	return truncateTitle(collapsed);
}

export function normalizeSnippetText(
	value: string | null | undefined,
): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? value : null;
}

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

export function createSnippetId(): string {
	if (typeof globalThis.crypto?.randomUUID === "function") {
		return globalThis.crypto.randomUUID();
	}

	const random = Math.random().toString(36).slice(2, 12);
	return `snpt-${Date.now()}-${random}`;
}

function truncateTitle(value: string): string {
	if (value.length <= DEFAULT_SNIPPET_TITLE_MAX_LENGTH) {
		return value;
	}

	return `${value.slice(0, DEFAULT_SNIPPET_TITLE_MAX_LENGTH - 1)}…`;
}
