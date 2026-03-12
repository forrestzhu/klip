import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history/history.types";
import {
	isValidForStorage,
	validateHistoryItem,
} from "../src/features/history/historyValidation";

describe("historyIntegrity", () => {
	it("should validate history item integrity", () => {
		const validItem: HistoryItem = {
			id: "test-id-1",
			text: "Test content",
			createdAt: new Date().toISOString(),
			sourceApp: null,
		};

		expect(validateHistoryItem(validItem)).toBe(true);
		expect(isValidForStorage(validItem)).toBe(true);
	});

	it("should reject invalid history items", () => {
		const invalidItem = {
			id: "",
			text: "",
			createdAt: new Date().toISOString(),
			sourceApp: null,
		};

		expect(validateHistoryItem(invalidItem as HistoryItem)).toBe(true); // validateHistoryItem only checks types
		expect(isValidForStorage(invalidItem as HistoryItem)).toBe(false); // isValidForStorage checks content
	});

	it("should validate timestamp integrity", () => {
		const itemWithFutureTimestamp: HistoryItem = {
			id: "test-id-2",
			text: "Test content",
			createdAt: new Date(Date.now() + 10000).toISOString(), // Future timestamp
			sourceApp: null,
		};

		// Should still be valid (we don't check for future timestamps)
		expect(validateHistoryItem(itemWithFutureTimestamp)).toBe(true);
	});
});
