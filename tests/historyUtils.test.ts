import { describe, expect, it, vi } from "vitest";
import {
	MAX_HISTORY_MAX_ITEMS,
	MIN_HISTORY_MAX_ITEMS,
} from "../src/features/history/history.constants";
import {
	clampHistoryMaxItems,
	createHistoryId,
	isCapturableText,
	normalizeSourceApp,
} from "../src/features/history/historyUtils";

describe("historyUtils", () => {
	it("validates capturable text", () => {
		expect(isCapturableText("hello")).toBe(true);
		expect(isCapturableText("  ")).toBe(false);
		expect(isCapturableText(null)).toBe(false);
		expect(isCapturableText(undefined)).toBe(false);
	});

	it("normalizes source app name", () => {
		expect(normalizeSourceApp("  Terminal  ")).toBe("Terminal");
		expect(normalizeSourceApp(" ")).toBeNull();
		expect(normalizeSourceApp(null)).toBeNull();
		expect(normalizeSourceApp(undefined)).toBeNull();
	});

	it("clamps history max items into supported range", () => {
		expect(clampHistoryMaxItems(MIN_HISTORY_MAX_ITEMS - 100)).toBe(
			MIN_HISTORY_MAX_ITEMS,
		);
		expect(clampHistoryMaxItems(MAX_HISTORY_MAX_ITEMS + 100)).toBe(
			MAX_HISTORY_MAX_ITEMS,
		);
		expect(clampHistoryMaxItems(Number.NaN)).toBeGreaterThanOrEqual(
			MIN_HISTORY_MAX_ITEMS,
		);
	});

	it("uses randomUUID when available", () => {
		const randomUUID = vi.fn(() => "uuid-1");
		const originalCrypto = globalThis.crypto;

		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: { randomUUID },
		});

		expect(createHistoryId()).toBe("uuid-1");
		expect(randomUUID).toHaveBeenCalledTimes(1);

		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: originalCrypto,
		});
	});

	it("falls back to synthetic id when randomUUID is unavailable", () => {
		const originalCrypto = globalThis.crypto;
		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: {},
		});

		const id = createHistoryId();
		expect(id.startsWith("hist-")).toBe(true);

		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: originalCrypto,
		});
	});
});
