export function toClipboardPreview(value: string, maxLength = 80): string {
	const normalized = value.replace(/\s+/g, " ").trim();

	if (normalized.length <= maxLength) {
		return normalized;
	}

	return `${normalized.slice(0, maxLength - 1)}…`;
}
