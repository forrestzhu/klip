import { describe, expect, it } from "vitest";
import {
	createHistoryId,
	isEmptyHistoryItem,
	validateHistoryItem,
} from "../src/features/history/historyUtils";

describe("History Utils Performance Tests", () => {
	it("should validate large number of history items efficiently", () => {
		const items = Array.from({ length: 10000 }, (_, i) => `Test content ${i}`);

		const start = performance.now();
		const results = items.map((item) => validateHistoryItem(item));
		const duration = performance.now() - start;

		expect(results.every((r) => r === true)).toBe(true);
		expect(duration).toBeLessThan(50); // Should complete in <50ms
	});

	it("should check empty items efficiently", () => {
		const items = Array.from({ length: 10000 }, (_, i) =>
			i % 2 === 0 ? "" : `Content ${i}`,
		);

		const start = performance.now();
		const results = items.map((item) => isEmptyHistoryItem(item));
		const duration = performance.now() - start;

		expect(results.filter((r) => r === true).length).toBe(5000);
		expect(duration).toBeLessThan(20); // Should complete in <20ms
	});

	it("should generate unique IDs efficiently", () => {
		const start = performance.now();
		const ids = Array.from({ length: 10000 }, () => createHistoryId());
		const duration = performance.now() - start;

		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(10000); // All IDs should be unique
		expect(duration).toBeLessThan(100); // Should complete in <100ms
	});
});
