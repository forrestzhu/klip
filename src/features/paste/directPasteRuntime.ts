/**
 * Direct Paste Runtime Module
 *
 * Provides functionality for pasting text directly to the active application.
 * This module offers desktop-specific functionality that requires Tauri runtime.
 */

import { invoke } from "@tauri-apps/api/core";

/**
 * The mode used for pasting text.
 * - `direct`: Text was pasted directly using accessibility APIs
 * - `fallback`: Text was pasted using clipboard fallback method
 */
export type DirectPasteMode = "direct" | "fallback";

/**
 * Result of a direct paste operation.
 */
export interface DirectPasteResult {
	/** The mode that was used for pasting */
	mode: DirectPasteMode;
	/** A message describing the result or any errors */
	message: string;
}

/**
 * Pastes text directly to the active application.
 *
 * This function attempts to paste text directly to the currently focused application
 * using system accessibility APIs. If direct paste is not available or fails,
 * it falls back to using the clipboard.
 *
 * @param text - The text to paste
 * @returns A promise that resolves to the result of the paste operation
 * @throws {Error} If called in a non-desktop environment or Tauri command fails
 *
 * @example
 * ```ts
 * const result = await directPasteText('Hello, World!');
 * if (result.mode === 'direct') {
 *   console.log('Pasted directly!');
 * } else {
 *   console.log('Used clipboard fallback:', result.message);
 * }
 * ```
 */
export async function directPasteText(
	text: string,
): Promise<DirectPasteResult> {
	return invoke<DirectPasteResult>("direct_paste_text", { text });
}
