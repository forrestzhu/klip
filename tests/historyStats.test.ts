import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history/history.types";
import {
	calculateHistoryStats,
	getRecentItems,
	groupItemsByDate,
} from "../src/features/history/historyStats";

describe("historyStats", () => {
	const items: HistoryItem[] = [
		{
			id: "1",
			text: "item1",
			createdAt: "2026-03-11T10:00:00Z",
			sourceApp: "app1",
		},
		{
			id: "2",
			text: "item2",
			createdAt: "2026-03-11T11:00:00Z",
			sourceApp: null,
		},
		{
			id: "3",
			text: "item1",
			createdAt: "2026-03-11T12:00:00Z",
			sourceApp: "app2",
		},
	];

	describe("calculateHistoryStats", () => {
		it("calculates total count", () => {
			const stats = calculateHistoryStats(items);
			expect(stats.total).toBe(3);
		});

		it("calculates unique count", () => {
			const stats = calculateHistoryStats(items);
			expect(stats.unique).toBe(2); // item1 appears twice
		});

		it("counts items with source app", () => {
			const stats = calculateHistoryStats(items);
			expect(stats.withSourceApp).toBe(2);
		});
	});

	describe("getRecentItems", () => {
		it("returns specified number of items", () => {
			const recent = getRecentItems(items, 2);
			expect(recent).toHaveLength(2);
		});

		it("returns all items if count exceeds length", () => {
			const recent = getRecentItems(items, 10);
			expect(recent).toHaveLength(3);
		});
	});

	describe("groupItemsByDate", () => {
		it("groups items by date", () => {
			const grouped = groupItemsByDate(items);
			expect(grouped.size).toBe(1); // All on same date
		});
	});
});
