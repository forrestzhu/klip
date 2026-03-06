import { afterEach, describe, expect, it, vi } from "vitest";
import { ClipboardMonitor } from "../src/features/history/clipboardMonitor";

describe("ClipboardMonitor", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("becomes ready within the startup window", async () => {
		vi.useFakeTimers();
		const reader = createReader(null);
		const captured: string[] = [];

		const monitor = new ClipboardMonitor({
			reader,
			onTextCaptured: (text) => {
				captured.push(text);
			},
			pollIntervalMs: 300,
			readyTimeoutMs: 2_000,
		});

		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		await expect(monitor.whenReady()).resolves.toBeUndefined();
		expect(monitor.isReady()).toBe(true);
		expect(captured).toEqual([]);
		monitor.stop();
	});

	it("captures only new text values", async () => {
		vi.useFakeTimers();
		const reader = createReader("alpha");
		const captured: string[] = [];

		const monitor = new ClipboardMonitor({
			reader,
			onTextCaptured: (text) => {
				captured.push(text);
			},
			pollIntervalMs: 300,
		});

		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(captured).toEqual(["alpha"]);

		await vi.advanceTimersByTimeAsync(600);
		expect(captured).toEqual(["alpha"]);

		reader.setValue("beta");
		await vi.advanceTimersByTimeAsync(300);
		expect(captured).toEqual(["alpha", "beta"]);
		monitor.stop();
	});

	it("ignores null and empty clipboard payloads", async () => {
		vi.useFakeTimers();
		const reader = createReader("  ");
		const captured: string[] = [];

		const monitor = new ClipboardMonitor({
			reader,
			onTextCaptured: (text) => {
				captured.push(text);
			},
			pollIntervalMs: 300,
		});

		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(captured).toEqual([]);

		reader.setValue(null);
		await vi.advanceTimersByTimeAsync(300);
		expect(captured).toEqual([]);

		reader.setValue("gamma");
		await vi.advanceTimersByTimeAsync(300);
		expect(captured).toEqual(["gamma"]);
		monitor.stop();
	});

	it("suppresses self-written text and captures later user copies", async () => {
		vi.useFakeTimers();
		let now = 0;
		const reader = createReader("internal");
		const captured: string[] = [];

		const monitor = new ClipboardMonitor({
			reader,
			onTextCaptured: (text) => {
				captured.push(text);
			},
			now: () => now,
			pollIntervalMs: 300,
		});

		monitor.suppressText("internal", 1_000);
		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(captured).toEqual([]);

		now += 500;
		reader.setValue("user-copy");
		await vi.advanceTimersByTimeAsync(300);
		expect(captured).toEqual(["user-copy"]);
		monitor.stop();
	});

	it("stops polling after stop is called", async () => {
		vi.useFakeTimers();
		const reader = createReader("alpha");
		const captured: string[] = [];

		const monitor = new ClipboardMonitor({
			reader,
			onTextCaptured: (text) => {
				captured.push(text);
			},
			pollIntervalMs: 300,
		});

		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(captured).toEqual(["alpha"]);

		monitor.stop();
		reader.setValue("beta");
		await vi.advanceTimersByTimeAsync(2_000);
		expect(captured).toEqual(["alpha"]);
	});

	it("captures updates from subscribed clipboard change events", async () => {
		vi.useFakeTimers();
		const reader = createReader("alpha");
		const captured: string[] = [];
		const subscribeChanges = vi.fn(async (_handler: () => void) => {
			return () => {};
		});

		const monitor = new ClipboardMonitor({
			reader: reader,
			subscribeChanges,
			onTextCaptured: (text) => {
				captured.push(text);
			},
			pollIntervalMs: 60_000,
		});

		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(subscribeChanges).toHaveBeenCalledTimes(1);
		expect(captured).toEqual(["alpha"]);

		reader.setValue("beta");
		const registeredHandler = subscribeChanges.mock.calls.at(0)?.[0];
		if (typeof registeredHandler === "function") {
			registeredHandler();
		}
		await vi.advanceTimersByTimeAsync(0);
		expect(captured).toEqual(["alpha", "beta"]);
		monitor.stop();
	});

	it("unsubscribes clipboard event listener when stopped", async () => {
		vi.useFakeTimers();
		const reader = createReader("alpha");
		const unsubscribe = vi.fn();
		const subscribeChanges = vi.fn(async () => unsubscribe);

		const monitor = new ClipboardMonitor({
			reader: reader,
			subscribeChanges,
			onTextCaptured: () => {},
		});

		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		monitor.stop();
		await vi.advanceTimersByTimeAsync(0);
		expect(unsubscribe).toHaveBeenCalledTimes(1);
	});

	it("falls back to polling when event subscription fails", async () => {
		vi.useFakeTimers();
		const reader = createReader("alpha");
		const captured: string[] = [];

		const monitor = new ClipboardMonitor({
			reader: reader,
			subscribeChanges: async () => {
				throw new Error("listener unavailable");
			},
			onTextCaptured: (text) => {
				captured.push(text);
			},
			pollIntervalMs: 300,
		});

		monitor.start();
		await vi.advanceTimersByTimeAsync(0);
		expect(captured).toEqual(["alpha"]);

		reader.setValue("beta");
		await vi.advanceTimersByTimeAsync(300);
		expect(captured).toEqual(["alpha", "beta"]);
		monitor.stop();
	});

	it("binds default timer APIs to globalThis", async () => {
		const originalSetTimeout = globalThis.setTimeout;
		const originalClearTimeout = globalThis.clearTimeout;
		const originalSetInterval = globalThis.setInterval;
		const originalClearInterval = globalThis.clearInterval;

		try {
			let nextTimerId = 1;

			const strictSetTimeout = function (
				this: unknown,
				handler: TimerHandler,
				_timeout?: number,
				...args: unknown[]
			): ReturnType<typeof setTimeout> {
				if (this !== globalThis) {
					throw new TypeError("setTimeout called with invalid this");
				}

				if (typeof handler === "function") {
					handler(...args);
				}

				return nextTimerId++ as unknown as ReturnType<typeof setTimeout>;
			} as unknown as typeof globalThis.setTimeout;

			const strictClearTimeout = function (
				this: unknown,
				_timerId: ReturnType<typeof setTimeout>,
			): void {
				if (this !== globalThis) {
					throw new TypeError("clearTimeout called with invalid this");
				}
			} as unknown as typeof globalThis.clearTimeout;

			const strictSetInterval = function (
				this: unknown,
				handler: TimerHandler,
				_timeout?: number,
				...args: unknown[]
			): ReturnType<typeof setInterval> {
				if (this !== globalThis) {
					throw new TypeError("setInterval called with invalid this");
				}

				if (typeof handler === "function") {
					handler(...args);
				}

				return nextTimerId++ as unknown as ReturnType<typeof setInterval>;
			} as unknown as typeof globalThis.setInterval;

			const strictClearInterval = function (
				this: unknown,
				_timerId: ReturnType<typeof setInterval>,
			): void {
				if (this !== globalThis) {
					throw new TypeError("clearInterval called with invalid this");
				}
			} as unknown as typeof globalThis.clearInterval;

			globalThis.setTimeout = strictSetTimeout;
			globalThis.clearTimeout = strictClearTimeout;
			globalThis.setInterval = strictSetInterval;
			globalThis.clearInterval = strictClearInterval;

			const reader = createReader("alpha");
			const captured: string[] = [];
			const monitor = new ClipboardMonitor({
				reader,
				onTextCaptured: (text) => {
					captured.push(text);
				},
			});

			monitor.start();
			await Promise.resolve();
			expect(captured).toEqual(["alpha"]);
			monitor.stop();
		} finally {
			globalThis.setTimeout = originalSetTimeout;
			globalThis.clearTimeout = originalClearTimeout;
			globalThis.setInterval = originalSetInterval;
			globalThis.clearInterval = originalClearInterval;
		}
	});
});

function createReader(initialValue: string | null) {
	let value = initialValue;

	return {
		readText: vi.fn(async () => value),
		setValue(nextValue: string | null) {
			value = nextValue;
		},
	};
}
