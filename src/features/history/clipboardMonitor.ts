import {
	DEFAULT_CLIPBOARD_POLL_INTERVAL_MS,
	DEFAULT_CLIPBOARD_READY_TIMEOUT_MS,
	DEFAULT_SELF_WRITE_SUPPRESSION_MS,
} from "./history.constants";
import { isCapturableText } from "./historyUtils";

export interface ClipboardReader {
	readText(): Promise<string | null>;
}

interface ClipboardMonitorOptions {
	reader: ClipboardReader;
	onTextCaptured: (text: string) => Promise<void> | void;
	pollIntervalMs?: number;
	readyTimeoutMs?: number;
	now?: () => number;
	setIntervalImpl?: typeof setInterval;
	clearIntervalImpl?: typeof clearInterval;
	setTimeoutImpl?: typeof setTimeout;
	clearTimeoutImpl?: typeof clearTimeout;
}

export class ClipboardMonitor {
	private readonly reader: ClipboardReader;
	private readonly onTextCaptured: (text: string) => Promise<void> | void;
	private readonly pollIntervalMs: number;
	private readonly readyTimeoutMs: number;
	private readonly now: () => number;
	private readonly setIntervalImpl: typeof setInterval;
	private readonly clearIntervalImpl: typeof clearInterval;
	private readonly setTimeoutImpl: typeof setTimeout;
	private readonly clearTimeoutImpl: typeof clearTimeout;

	private intervalId: ReturnType<typeof setInterval> | null = null;
	private readyTimeoutId: ReturnType<typeof setTimeout> | null = null;
	private latestText: string | null = null;
	private isTickRunning = false;
	private suppressionMap = new Map<string, number>();

	private readyResolver: (() => void) | null = null;
	private readyPromise: Promise<void>;
	private ready = false;

	public constructor(options: ClipboardMonitorOptions) {
		this.reader = options.reader;
		this.onTextCaptured = options.onTextCaptured;
		this.pollIntervalMs =
			options.pollIntervalMs ?? DEFAULT_CLIPBOARD_POLL_INTERVAL_MS;
		this.readyTimeoutMs =
			options.readyTimeoutMs ?? DEFAULT_CLIPBOARD_READY_TIMEOUT_MS;
		this.now = options.now ?? Date.now;
		this.setIntervalImpl = options.setIntervalImpl ?? setInterval;
		this.clearIntervalImpl = options.clearIntervalImpl ?? clearInterval;
		this.setTimeoutImpl = options.setTimeoutImpl ?? setTimeout;
		this.clearTimeoutImpl = options.clearTimeoutImpl ?? clearTimeout;
		this.readyPromise = new Promise((resolve) => {
			this.readyResolver = resolve;
		});
	}

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

		void this.tick();
	}

	public stop() {
		if (this.intervalId !== null) {
			this.clearIntervalImpl(this.intervalId);
			this.intervalId = null;
		}

		if (this.readyTimeoutId !== null) {
			this.clearTimeoutImpl(this.readyTimeoutId);
			this.readyTimeoutId = null;
		}
	}

	public suppressText(
		text: string,
		ttlMs = DEFAULT_SELF_WRITE_SUPPRESSION_MS,
	): void {
		if (!isCapturableText(text)) {
			return;
		}

		this.suppressionMap.set(text, this.now() + Math.max(0, ttlMs));
	}

	public whenReady(): Promise<void> {
		return this.readyPromise;
	}

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
}
