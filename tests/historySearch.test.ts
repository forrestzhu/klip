import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history/history.types";
import {
	searchHistoryItems,
	searchHistoryItemsAdvanced,
} from "../src/features/history/historySearch";

describe("historySearch", () => {
	const items: HistoryItem[] = [
		{ id: "1", text: "Hello World", createdAt: "2026-03-11T00:00:00Z", sourceApp: null },
		{ id: "2", text: "Goodbye", createdAt: "2026-03-11T00:01:00Z", sourceApp: null },
		{ id: "3", text: "hello again", createdAt: "2026-03-11T00:02:00Z", sourceApp: null },
	];

	describe("searchHistoryItems", () => {
		it("finds matching items (case-insensitive)", () => {
			const result = searchHistoryItems(items, "hello");
			expect(result).toHaveLength(2);
		});

		it("returns all items for empty query", () => {
			const result = searchHistoryItems(items, "");
			expect(result).toHaveLength(3);
		});

		it("returns empty array for no matches", () => {
			const result = searchHistoryItems(items, "xyz");
			expect(result).toHaveLength(0);
		});
	});

	describe("searchHistoryItemsAdvanced", () => {
		it("respects case sensitivity", () => {
			const result = searchHistoryItemsAdvanced(items, "Hello", true);
			expect(result).toHaveLength(1);
		});

		it("case-insensitive when specified", () => {
			const result = searchHistoryItemsAdvanced(items, "hello", false);
			expect(result).toHaveLength(2);
		});
	});
});
