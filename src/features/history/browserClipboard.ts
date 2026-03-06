import { invoke } from "@tauri-apps/api/core";
import type { ClipboardReader } from "./clipboardMonitor";

export interface ClipboardWriter {
	writeText(text: string): Promise<void>;
}

export type ClipboardChangeUnsubscribe = () => Promise<void> | void;
type ClipboardChangeHandler = () => void;

export interface ClipboardChangeSubscriber {
	subscribeChanges(
		handler: ClipboardChangeHandler,
	): Promise<ClipboardChangeUnsubscribe>;
}

export interface ClipboardPort
	extends ClipboardReader,
		ClipboardWriter,
		ClipboardChangeSubscriber {}

const DESKTOP_CLIPBOARD_UPDATED_EVENT = "klip://clipboard-updated";

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
		async subscribeChanges() {
			return () => {};
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
		async subscribeChanges(handler) {
			await invoke("start_clipboard_listener");

			try {
				const { getCurrentWindow } = await import("@tauri-apps/api/window");
				const unlisten = await getCurrentWindow().listen(
					DESKTOP_CLIPBOARD_UPDATED_EVENT,
					() => {
						handler();
					},
				);

				return async () => {
					await unlisten();
					await invoke("stop_clipboard_listener");
				};
			} catch (error) {
				await invoke("stop_clipboard_listener").catch(() => {});
				throw error;
			}
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
