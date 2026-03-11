import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history/history.types";
import {
	isValidForStorage,
	validateHistoryItem,
	validateHistoryItems,
} from "../src/features/history/historyValidation";

describe("historyValidation", () => {
	describe("validateHistoryItem", () => {
		it("validates a correct history item", () => {
			const item = { id: "1", text: "hello", createdAt: "2026-03-11T00:00:00Z", sourceApp: null };
			expect(validateHistoryItem(item)).toBe(true);
		});

		it("rejects invalid items", () => {
			expect(validateHistoryItem(null)).toBe(false);
			expect(validateHistoryItem({})).toBe(false);
			expect(validateHistoryItem({ id: 1 })).toBe(false);
		});
	});

	describe("validateHistoryItems", () => {
		it("filters valid items", () => {
			const items = [
				{ id: "1", text: "hello", createdAt: "2026-03-11T00:00:00Z", sourceApp: null },
				{ id: "2", text: "world", createdAt: "2026-03-11T00:01:00Z", sourceApp: "app" },
				null,
			];
			const valid = validateHistoryItems(items);
			expect(valid).toHaveLength(2);
		});
	});

	describe("isValidForStorage", () => {
		it("accepts valid items", () => {
			const item: HistoryItem = { id: "1", text: "hello", createdAt: "2026-03-11T00:00:00Z", sourceApp: null };
			expect(isValidForStorage(item)).toBe(true);
		});

		it("rejects empty text", () => {
			const item: HistoryItem = { id: "1", text: "", createdAt: "2026-03-11T00:00:00Z", sourceApp: null };
			expect(isValidForStorage(item)).toBe(false);
		});
	});
});
