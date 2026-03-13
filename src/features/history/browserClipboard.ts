/**
 * Browser Clipboard Module
 *
 * Provides a unified interface for clipboard operations in both browser and Tauri desktop environments.
 * Automatically detects the runtime environment and uses the appropriate clipboard API.
 *
 * Features:
 * - Read/write text from/to clipboard
 * - Subscribe to clipboard changes (desktop only)
 * - Graceful fallback for browser environments
 *
 * @module browserClipboard
 */

import { invoke } from "@tauri-apps/api/core";
import type { ClipboardReader } from "./clipboardMonitor";

/**
 * Interface for writing text to clipboard
 */
export interface ClipboardWriter {
	writeText(text: string): Promise<void>;
}

export type ClipboardChangeUnsubscribe = () => Promise<void> | void;
type ClipboardChangeHandler = () => void;

/**
 * Interface for subscribing to clipboard change events
 */
export interface ClipboardChangeSubscriber {
	subscribeChanges(
		handler: ClipboardChangeHandler,
	): Promise<ClipboardChangeUnsubscribe>;
}

/**
 * Combined interface for clipboard operations
 * Provides read, write, and change subscription capabilities
 */
export interface ClipboardPort
	extends ClipboardReader,
		ClipboardWriter,
		ClipboardChangeSubscriber {}

const DESKTOP_CLIPBOARD_UPDATED_EVENT = "klip://clipboard-updated";

/**
 * Create a clipboard port instance
 * Automatically detects runtime environment and returns appropriate implementation
 * @returns ClipboardPort instance for the current environment
 */
export function createClipboardPort(): ClipboardPort {
	if (isDesktopRuntime()) {
		return createDesktopClipboardPort();
	}

	return createBrowserClipboardPort();
}

/**
 * Create a browser-based clipboard port
 * Uses the Navigator Clipboard API when available
 * @returns ClipboardPort instance for browser environment
 */
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

/**
 * Create a Tauri desktop clipboard port
 * Uses Tauri IPC commands for clipboard operations
 * @returns ClipboardPort instance for desktop environment
 */
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

/**
 * Get the Navigator Clipboard API
 * @returns Clipboard API if available, null otherwise
 */
function getNavigatorClipboard(): Clipboard | null {
	const maybeNavigator =
		typeof globalThis.navigator === "object" ? globalThis.navigator : null;
	return maybeNavigator?.clipboard ?? null;
}

/**
 * Check if running in Tauri desktop runtime
 * @returns true if in desktop environment, false otherwise
 */
function isDesktopRuntime(): boolean {
	if (typeof window === "undefined") {
		return false;
	}

	const tauriWindow = window as Window & { __TAURI_INTERNALS__?: unknown };
	return tauriWindow.__TAURI_INTERNALS__ !== undefined;
}
