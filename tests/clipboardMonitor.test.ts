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
