export const UNKNOWN_BUILD_COMMIT = "unknown";

export function normalizeBuildCommitValue(
	value: string | null | undefined,
): string {
	const normalizedValue = value?.trim() ?? "";
	return normalizedValue.length > 0 ? normalizedValue : UNKNOWN_BUILD_COMMIT;
}

export function formatBuildCommitLabel(
	value: string | null | undefined,
): string {
	return `Commit: ${normalizeBuildCommitValue(value)}`;
}

function readInjectedBuildCommit(): string {
	return typeof __KLIP_BUILD_COMMIT__ === "string" ? __KLIP_BUILD_COMMIT__ : "";
}

export const BUILD_COMMIT = normalizeBuildCommitValue(
	readInjectedBuildCommit(),
);
export const BUILD_COMMIT_LABEL = formatBuildCommitLabel(BUILD_COMMIT);
