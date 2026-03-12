/**
 * History import utilities
 */

import type { HistoryItem } from "./history.types";
import { createHistoryId } from "./historyUtils";

/**
 * Import history items from JSON
 */
export function importHistoryFromJSON(json: string): HistoryItem[] {
	try {
		const items = JSON.parse(json);
		if (!Array.isArray(items)) {
			throw new Error("Invalid format: expected array");
		}
		return items.map((item) => ({
			id: item.id || createHistoryId(),
			text: item.text || "",
			createdAt: item.createdAt || new Date().toISOString(),
			sourceApp: item.sourceApp || null,
		}));
	} catch (error) {
		throw new Error(`Failed to parse JSON: ${error}`);
	}
}

/**
 * Import history items from CSV
 */
export function importHistoryFromCSV(csv: string): HistoryItem[] {
	const lines = csv.split("\n").slice(1); // Skip header
	return lines
		.filter((line) => line.trim().length > 0)
		.map((line) => {
			const parts = line.match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g);
			if (!parts || parts.length < 4) return null;

			const cleanValue = (val: string) =>
				val.replace(/^,?"?|"?$/g, "").replace(/""/g, '"');

			return {
				id: cleanValue(parts[0]),
				text: cleanValue(parts[1]),
				createdAt: cleanValue(parts[2]),
				sourceApp: cleanValue(parts[3]) || null,
			} as HistoryItem;
		})
		.filter((item): item is HistoryItem => item !== null);
}

/**
 * Import history items from plain text
 */
export function importHistoryFromText(text: string): HistoryItem[] {
	const lines = text.split("\n");
	return lines
		.filter((line) => line.trim().length > 0)
		.map((line) => {
			const match = line.match(/^\[([^\]]+)\]\s+(.+)$/);
			if (!match) return null;

			return {
				id: createHistoryId(),
				text: match[2],
				createdAt: match[1],
				sourceApp: null,
			} as HistoryItem;
		})
		.filter((item): item is HistoryItem => item !== null);
}
