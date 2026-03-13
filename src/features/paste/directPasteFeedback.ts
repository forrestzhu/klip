/**
 * Direct Paste Feedback
 *
 * Determines UI feedback behavior after direct paste operations.
 */

import type { DirectPasteMode } from "./directPasteRuntime";

/**
 * Determines whether the panel should be hidden after a direct paste.
 * @param mode - The direct paste mode that was used
 * @returns True if panel should be hidden, false otherwise
 */
export function shouldHidePanelAfterDirectPaste(
	mode: DirectPasteMode,
): boolean {
	return mode === "direct";
}
