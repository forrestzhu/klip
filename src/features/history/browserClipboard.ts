import type { ClipboardReader } from "./clipboardMonitor";

export interface ClipboardWriter {
	writeText(text: string): Promise<void>;
}

export interface ClipboardPort extends ClipboardReader, ClipboardWriter {}

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

function getNavigatorClipboard(): Clipboard | null {
	const maybeNavigator =
		typeof globalThis.navigator === "object" ? globalThis.navigator : null;
	return maybeNavigator?.clipboard ?? null;
}
