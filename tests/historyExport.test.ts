import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history/history.types";
import {
	exportHistoryToCSV,
	exportHistoryToJSON,
	exportHistoryToText,
} from "../src/features/history/historyExport";

describe("historyExport", () => {
	const items: HistoryItem[] = [
		{ id: "1", text: "hello", createdAt: "2026-03-11T10:00:00Z", sourceApp: "app1" },
		{ id: "2", text: "world", createdAt: "2026-03-11T11:00:00Z", sourceApp: null },
	];

	describe("exportHistoryToJSON", () => {
		it("exports to valid JSON", () => {
			const json = exportHistoryToJSON(items);
			const parsed = JSON.parse(json);
			expect(parsed).toHaveLength(2);
		});
	});

	describe("exportHistoryToCSV", () => {
		it("exports to CSV format", () => {
			const csv = exportHistoryToCSV(items);
			expect(csv).toContain("id,text,createdAt,sourceApp");
			expect(csv).toContain("hello");
		});
	});

	describe("exportHistoryToText", () => {
		it("exports to plain text", () => {
			const text = exportHistoryToText(items);
			expect(text).toContain("[2026-03-11T10:00:00Z] hello");
		});
	});
});
