/**
 * Paste Feature Module
 *
 * Public API for the paste feature. Provides direct paste functionality
 * and paste mode configuration for pasting text into active applications.
 */

export { shouldHidePanelAfterDirectPaste } from "./directPasteFeedback";
export {
	type DirectPasteMode,
	type DirectPasteResult,
	directPasteText,
} from "./directPasteRuntime";
