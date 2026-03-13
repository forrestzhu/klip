/**
 * History Import Utilities
 *
 * Provides functions to import clipboard history from various formats.
 * Supports JSON, CSV, and plain text formats with automatic validation.
 *
 * @module historyImport
 */

import type { HistoryItem } from "./history.types";
import { createHistoryId } from "./historyUtils";

/**
 * Import history items from JSON string.
 *
 * Parses JSON array and validates each item has required fields.
 * Missing fields are filled with defaults (empty string, current timestamp).
 * If item ID is missing, a new unique ID is generated.
 *
 * @param json - JSON string containing array of history items
 * @returns Array of validated history items
 * @throws Error if JSON is invalid or not an array
 *
 * @example
 * ```ts
 * const json = `[
 *   {"id": "1", "text": "Hello", "createdAt": "2024-01-01T00:00:00Z"},
 *   {"text": "World"} // Missing id and createdAt, will use defaults
 * ]`;
 * const items = importHistoryFromJSON(json);
 * ```
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
 * Import history items from CSV string.
 *
 * Expects CSV format with header row: id,text,createdAt,sourceApp
 * Handles quoted fields with escaped quotes (RFC 4180 compliant).
 * First row (header) is skipped. Empty lines are ignored.
 *
 * @param csv - CSV string with header row
 * @returns Array of parsed history items
 *
 * @example
 * ```ts
 * const csv = `id,text,createdAt,sourceApp
 * 1,Hello World,2024-01-01T00:00:00Z,com.apple.Safari
 * 2,"Text with ""quotes""",2024-01-02T00:00:00Z,`;
 * const items = importHistoryFromCSV(csv);
 * ```
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
 * Import history items from plain text format.
 *
 * Expects each line in format: [timestamp] text content
 * Lines not matching this format are ignored.
 * New unique IDs are generated for all imported items.
 *
 * @param text - Plain text with one history item per line
 * @returns Array of parsed history items
 *
 * @example
 * ```ts
 * const text = `[2024-01-01 10:00:00] Hello World
 * [2024-01-01 10:05:00] Another clipboard item`;
 * const items = importHistoryFromText(text);
 * ```
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
