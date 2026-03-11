import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history/history.types";
import {
	filterInvalidHistoryItems,
	removeDuplicateHistoryItems,
	sortHistoryItemsByDate,
} from "../src/features/history/historyRepositoryUtils";

describe("historyRepositoryUtils", () => {
	describe("filterInvalidHistoryItems", () => {
		it("filters out empty items", () => {
			const items: HistoryItem[] = [
				{ id: "1", text: "", createdAt: "2026-03-11T00:00:00Z", sourceApp: null },
				{ id: "2", text: "hello", createdAt: "2026-03-11T00:01:00Z", sourceApp: null },
			];
			const result = filterInvalidHistoryItems(items);
			expect(result).toHaveLength(1);
			expect(result[0].text).toBe("hello");
		});

		it("keeps all valid items", () => {
			const items: HistoryItem[] = [
				{ id: "1", text: "hello", createdAt: "2026-03-11T00:00:00Z", sourceApp: null },
				{ id: "2", text: "world", createdAt: "2026-03-11T00:01:00Z", sourceApp: null },
			];
			const result = filterInvalidHistoryItems(items);
			expect(result).toHaveLength(2);
		});
	});

	describe("removeDuplicateHistoryItems", () => {
		it("removes duplicates", () => {
			const items: HistoryItem[] = [
				{ id: "1", text: "hello", createdAt: "2026-03-11T00:00:00Z", sourceApp: null },
				{ id: "2", text: "hello", createdAt: "2026-03-11T00:01:00Z", sourceApp: null },
			];
			const result = removeDuplicateHistoryItems(items);
			expect(result).toHaveLength(1);
		});

		it("keeps unique items", () => {
			const items: HistoryItem[] = [
				{ id: "1", text: "hello", createdAt: "2026-03-11T00:00:00Z", sourceApp: null },
				{ id: "2", text: "world", createdAt: "2026-03-11T00:01:00Z", sourceApp: null },
			];
			const result = removeDuplicateHistoryItems(items);
			expect(result).toHaveLength(2);
		});
	});

	describe("sortHistoryItemsByDate", () => {
		it("sorts by date descending", () => {
			const items: HistoryItem[] = [
				{ id: "1", text: "old", createdAt: "2026-03-11T00:00:00Z", sourceApp: null },
				{ id: "2", text: "new", createdAt: "2026-03-11T00:01:00Z", sourceApp: null },
			];
			const result = sortHistoryItemsByDate(items);
			expect(result[0].text).toBe("new");
			expect(result[1].text).toBe("old");
		});
	});
});
