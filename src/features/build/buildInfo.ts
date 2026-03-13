/**
 * Build Information Module
 *
 * Provides utilities for reading and formatting build commit information.
 * The commit hash is injected at build time via Vite define plugin.
 */

/** Placeholder value when commit information is unavailable */
export const UNKNOWN_BUILD_COMMIT = "unknown";

/**
 * Normalize a build commit value.
 *
 * @param value - Raw commit value (may be null or undefined)
 * @returns Normalized commit hash or UNKNOWN_BUILD_COMMIT
 */
export function normalizeBuildCommitValue(
	value: string | null | undefined,
): string {
	const normalizedValue = value?.trim() ?? "";
	return normalizedValue.length > 0 ? normalizedValue : UNKNOWN_BUILD_COMMIT;
}

/**
 * Format a build commit value as a display label.
 *
 * @param value - Raw commit value
 * @returns Formatted label like "Commit: abc123"
 */
export function formatBuildCommitLabel(
	value: string | null | undefined,
): string {
	return `Commit: ${normalizeBuildCommitValue(value)}`;
}

/**
 * Read the build commit injected by Vite at build time.
 *
 * @returns The injected commit hash or empty string
 *
 * @private
 */
function readInjectedBuildCommit(): string {
	return typeof __KLIP_BUILD_COMMIT__ === "string" ? __KLIP_BUILD_COMMIT__ : "";
}

/** Normalized build commit hash */
export const BUILD_COMMIT = normalizeBuildCommitValue(
	readInjectedBuildCommit(),
);

/** Formatted build commit label for display */
export const BUILD_COMMIT_LABEL = formatBuildCommitLabel(BUILD_COMMIT);
