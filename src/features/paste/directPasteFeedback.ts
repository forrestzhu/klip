import type { DirectPasteMode } from "./directPasteRuntime";

export function shouldHidePanelAfterDirectPaste(
	mode: DirectPasteMode,
): boolean {
	return mode === "direct";
}
