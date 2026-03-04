import { invoke } from "@tauri-apps/api/core";
import type { ClipboardReader } from "./clipboardMonitor";

export interface ClipboardWriter {
	writeText(text: string): Promise<void>;
}

export interface ClipboardPort extends ClipboardReader, ClipboardWriter {}

export function createClipboardPort(): ClipboardPort {
	if (isDesktopRuntime()) {
		return createDesktopClipboardPort();
	}

	return createBrowserClipboardPort();
}

export function createBrowserClipboardPort(): ClipboardPort {
	return {
		async readText() {
			const clipboard = getNavigatorClipboard();
			if (!clipboard || typeof clipboard.readText !== "function") {
				return null;
			}

			try {
				const text = await clipboard.readText();
				return typeof text === "string" ? text : null;
			} catch {
				return null;
			}
		},
		async writeText(text) {
			const clipboard = getNavigatorClipboard();
			if (!clipboard || typeof clipboard.writeText !== "function") {
				throw new Error("Browser clipboard write API is unavailable");
			}

			await clipboard.writeText(text);
		},
	};
}

function createDesktopClipboardPort(): ClipboardPort {
	return {
		async readText() {
			try {
				return await invoke<string | null>("read_clipboard_text");
			} catch {
				return null;
			}
		},
		async writeText(text) {
			await invoke("write_clipboard_text", { text });
		},
	};
}

function getNavigatorClipboard(): Clipboard | null {
	const maybeNavigator =
		typeof globalThis.navigator === "object" ? globalThis.navigator : null;
	return maybeNavigator?.clipboard ?? null;
}

function isDesktopRuntime(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const tauriWindow = window as Window & { __TAURI_INTERNALS__?: unknown };
	return tauriWindow.__TAURI_INTERNALS__ !== undefined;
}
