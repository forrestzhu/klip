import { invoke } from "@tauri-apps/api/core";

export type DirectPasteMode = "direct" | "fallback";

export interface DirectPasteResult {
	mode: DirectPasteMode;
	message: string;
}

export async function directPasteText(
	text: string,
): Promise<DirectPasteResult> {
	return invoke<DirectPasteResult>("direct_paste_text", { text });
}
