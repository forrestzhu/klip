import { afterEach, describe, expect, it, vi } from "vitest";
import { createBrowserClipboardPort } from "../src/features/history/browserClipboard";

describe("createBrowserClipboardPort", () => {
	afterEach(() => {
		restoreNavigator();
	});

	it("returns null when read api is unavailable", async () => {
		mockNavigatorClipboard(null);
		const port = createBrowserClipboardPort();

		await expect(port.readText()).resolves.toBeNull();
	});

	it("reads text when clipboard api is available", async () => {
		mockNavigatorClipboard({
			readText: vi.fn(async () => "hello"),
			writeText: vi.fn(async () => undefined),
		});
		const port = createBrowserClipboardPort();

		await expect(port.readText()).resolves.toBe("hello");
	});

	it("returns null when read api throws", async () => {
		mockNavigatorClipboard({
			readText: vi.fn(async () => {
				throw new Error("permission denied");
			}),
			writeText: vi.fn(async () => undefined),
		});
		const port = createBrowserClipboardPort();

		await expect(port.readText()).resolves.toBeNull();
	});

	it("writes text when clipboard api is available", async () => {
		const writeText = vi.fn(async () => undefined);
		mockNavigatorClipboard({
			readText: vi.fn(async () => "ignored"),
			writeText,
		});
		const port = createBrowserClipboardPort();

		await port.writeText("copy me");
		expect(writeText).toHaveBeenCalledWith("copy me");
	});

	it("throws when write api is unavailable", async () => {
		mockNavigatorClipboard(null);
		const port = createBrowserClipboardPort();

		await expect(port.writeText("test")).rejects.toThrow(
			"Browser clipboard write API is unavailable",
		);
	});

	it("returns empty unsubscribe function for subscribeChanges", async () => {
		mockNavigatorClipboard({
			readText: vi.fn(async () => "test"),
			writeText: vi.fn(async () => undefined),
		});
		const port = createBrowserClipboardPort();

		const unsubscribe = await port.subscribeChanges(() => {});
		expect(typeof unsubscribe).toBe("function");
		expect(unsubscribe()).toBeUndefined();
	});
});

const originalNavigator = globalThis.navigator;

function mockNavigatorClipboard(
	clipboard: {
		readText: () => Promise<string>;
		writeText: (value: string) => Promise<void>;
	} | null,
) {
	Object.defineProperty(globalThis, "navigator", {
		configurable: true,
		value: clipboard ? { clipboard } : {},
	});
}

function restoreNavigator() {
	Object.defineProperty(globalThis, "navigator", {
		configurable: true,
		value: originalNavigator,
	});
}
