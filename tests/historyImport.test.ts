import { describe, expect, it } from "vitest";
import type { HistoryItem } from "../src/features/history/history.types";
import {
	importHistoryFromCSV,
	importHistoryFromJSON,
	importHistoryFromText,
} from "../src/features/history/historyImport";

describe("historyImport", () => {
	describe("importHistoryFromJSON", () => {
		it("imports valid JSON", () => {
			const json = JSON.stringify([
				{ id: "1", text: "hello", createdAt: "2026-03-11T10:00:00Z", sourceApp: null },
			]);
			const items = importHistoryFromJSON(json);
			expect(items).toHaveLength(1);
			expect(items[0].text).toBe("hello");
		});

		it("throws on invalid JSON", () => {
			expect(() => importHistoryFromJSON("not json")).toThrow();
		});
	});

	describe("importHistoryFromCSV", () => {
		it("imports CSV format", () => {
			const csv = "id,text,createdAt,sourceApp\n1,hello,2026-03-11T10:00:00Z,";
			const items = importHistoryFromCSV(csv);
			expect(items).toHaveLength(1);
			expect(items[0].text).toBe("hello");
		});
	});

	describe("importHistoryFromText", () => {
		it("imports plain text format", () => {
			const text = "[2026-03-11T10:00:00Z] hello";
			const items = importHistoryFromText(text);
			expect(items).toHaveLength(1);
			expect(items[0].text).toBe("hello");
		});
	});
});
