/**
 * Clipboard Monitor
 *
 * Monitors clipboard changes and captures text content. Supports both
 * polling and event-based change detection, with suppression of own writes.
 */

import {
	DEFAULT_CLIPBOARD_POLL_INTERVAL_MS,
	DEFAULT_CLIPBOARD_READY_TIMEOUT_MS,
	DEFAULT_SELF_WRITE_SUPPRESSION_MS,
} from "./history.constants";
import { isCapturableText } from "./historyUtils";

/**
 * Interface for reading clipboard text content.
 */
export interface ClipboardReader {
	/**
	 * Reads the current text from the clipboard.
	 * @returns The clipboard text content, or null if unavailable.
	 */
	readText(): Promise<string | null>;
}

/**
 * Unsubscribe function for clipboard change events.
 */
type ClipboardChangeUnsubscribe = () => Promise<void> | void;

/**
 * Subscriber function for clipboard change events.
 * @param handler - Callback to invoke when clipboard changes.
 * @returns Unsubscribe function.
 */
type ClipboardChangeSubscriber = (
	handler: () => void,
) => Promise<ClipboardChangeUnsubscribe>;

/**
 * Configuration options for ClipboardMonitor.
 */
interface ClipboardMonitorOptions {
	/** Reader for clipboard text content */
	reader: ClipboardReader;
	/** Callback invoked when new text is captured */
	onTextCaptured: (text: string) => Promise<void> | void;
	/** Optional subscriber for clipboard change events */
	subscribeChanges?: ClipboardChangeSubscriber;
	/** Polling interval in milliseconds (default: 350ms) */
	pollIntervalMs?: number;
	/** Timeout for clipboard ready check in milliseconds (default: 2000ms) */
	readyTimeoutMs?: number;
	/** Custom function to get current timestamp */
	now?: () => number;
	/** Custom setInterval implementation */
	setIntervalImpl?: typeof setInterval;
	/** Custom clearInterval implementation */
	clearIntervalImpl?: typeof clearInterval;
	/** Custom setTimeout implementation */
	setTimeoutImpl?: typeof setTimeout;
	/** Custom clearTimeout implementation */
	clearTimeoutImpl?: typeof clearTimeout;
}

/**
 * Monitors clipboard changes and captures text content.
 *
 * Supports both polling-based and event-based change detection.
 * Automatically suppresses detection of own writes to prevent
 * feedback loops.
 */
export class ClipboardMonitor {
	private readonly reader: ClipboardReader;
	private readonly onTextCaptured: (text: string) => Promise<void> | void;
	private readonly subscribeChanges: ClipboardChangeSubscriber | null;
	private readonly pollIntervalMs: number;
	private readonly readyTimeoutMs: number;
	private readonly now: () => number;
	private readonly setIntervalImpl: typeof setInterval;
	private readonly clearIntervalImpl: typeof clearInterval;
	private readonly setTimeoutImpl: typeof setTimeout;
	private readonly clearTimeoutImpl: typeof clearTimeout;

	private intervalId: ReturnType<typeof setInterval> | null = null;
	private readyTimeoutId: ReturnType<typeof setTimeout> | null = null;
	private unsubscribeChanges: (() => Promise<void> | void) | null = null;
	private latestText: string | null = null;
	private isTickRunning = false;
	private suppressionMap = new Map<string, number>();

	private readyResolver: (() => void) | null = null;
	private readyPromise: Promise<void>;
	private ready = false;

	/**
	 * Creates a new ClipboardMonitor instance.
	 * @param options - Configuration options
	 */
	public constructor(options: ClipboardMonitorOptions) {
		this.reader = options.reader;
		this.onTextCaptured = options.onTextCaptured;
		this.subscribeChanges = options.subscribeChanges ?? null;
		this.pollIntervalMs =
			options.pollIntervalMs ?? DEFAULT_CLIPBOARD_POLL_INTERVAL_MS;
		this.readyTimeoutMs =
			options.readyTimeoutMs ?? DEFAULT_CLIPBOARD_READY_TIMEOUT_MS;
		this.now = options.now ?? Date.now;
		this.setIntervalImpl =
			options.setIntervalImpl ?? globalThis.setInterval.bind(globalThis);
		this.clearIntervalImpl =
			options.clearIntervalImpl ?? globalThis.clearInterval.bind(globalThis);
		this.setTimeoutImpl =
			options.setTimeoutImpl ?? globalThis.setTimeout.bind(globalThis);
		this.clearTimeoutImpl =
			this.clearTimeoutImpl ?? globalThis.clearTimeout.bind(globalThis);
		this.readyPromise = new Promise((resolve) => {
			this.readyResolver = resolve;
		});
	}

	/**
	 * Starts monitoring clipboard changes.
	 */
	public start() {
		if (this.intervalId !== null) {
			return;
		}

		this.readyTimeoutId = this.setTimeoutImpl(() => {
			this.markReady();
		}, this.readyTimeoutMs);

		this.intervalId = this.setIntervalImpl(() => {
			void this.tick();
		}, this.pollIntervalMs);

		void this.initializeChangeSubscription();
		void this.tick();
	}

	/**
	 * Stops monitoring clipboard changes.
	 */
	public stop() {
		if (this.intervalId !== null) {
			this.clearIntervalImpl(this.intervalId);
			this.intervalId = null;
		}

		if (this.readyTimeoutId !== null) {
			this.clearTimeoutImpl(this.readyTimeoutId);
			this.readyTimeoutId = null;
		}

		const unsubscribeChanges = this.unsubscribeChanges;
		this.unsubscribeChanges = null;
		if (typeof unsubscribeChanges === "function") {
			void Promise.resolve(unsubscribeChanges()).catch(() => {});
		}
	}

	/**
	 * Suppresses detection of the specified text for a duration.
	 * Useful to prevent capturing text that the app itself writes.
	 * @param text - Text to suppress detection for
	 * @param ttlMs - Time to live in milliseconds (default: 1500ms)
	 */
	public suppressText(
		text: string,
		ttlMs = DEFAULT_SELF_WRITE_SUPPRESSION_MS,
	): void {
		if (!isCapturableText(text)) {
			return;
		}

		this.suppressionMap.set(text, this.now() + Math.max(0, ttlMs));
	}

	/**
	 * Returns a promise that resolves when the monitor is ready.
	 * @returns Promise that resolves when ready
	 */
	public whenReady(): Promise<void> {
		return this.readyPromise;
	}

	/**
	 * Checks if the monitor is ready.
	 * @returns True if ready, false otherwise
	 */
	public isReady(): boolean {
		return this.ready;
	}

	private markReady() {
		if (this.ready) {
			return;
		}

		this.ready = true;
		if (this.readyTimeoutId !== null) {
			this.clearTimeoutImpl(this.readyTimeoutId);
			this.readyTimeoutId = null;
		}
		this.readyResolver?.();
		this.readyResolver = null;
	}

	private cleanupSuppressionMap() {
		const now = this.now();
		for (const [text, expiresAt] of this.suppressionMap.entries()) {
			if (expiresAt <= now) {
				this.suppressionMap.delete(text);
			}
		}
	}

	private isSuppressed(text: string): boolean {
		this.cleanupSuppressionMap();
		const expiresAt = this.suppressionMap.get(text);
		return typeof expiresAt === "number" && expiresAt > this.now();
	}

	private async tick() {
		if (this.intervalId === null || this.isTickRunning) {
			return;
		}

		this.isTickRunning = true;

		try {
			const text = await this.reader.readText();
			this.markReady();

			if (!isCapturableText(text)) {
				this.latestText = text;
				return;
			}

			if (text === this.latestText) {
				return;
			}

			this.latestText = text;
			if (this.isSuppressed(text)) {
				return;
			}

			await this.onTextCaptured(text);
		} finally {
			this.isTickRunning = false;
		}
	}

	private async initializeChangeSubscription() {
		if (this.subscribeChanges === null || this.unsubscribeChanges) {
			return;
		}

		try {
			const unsubscribeChanges = await this.subscribeChanges(() => {
				void this.tick();
			});

			if (typeof unsubscribeChanges !== "function") {
				return;
			}

			if (this.intervalId === null) {
				await unsubscribeChanges();
				return;
			}

			this.unsubscribeChanges = unsubscribeChanges;
		} catch {
			// Event subscription is best-effort. Polling remains fallback path.
		}
	}
}
