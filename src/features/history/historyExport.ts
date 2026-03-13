/**
 * History Export Utilities
 *
 * Provides functions to export clipboard history items to various formats.
 * Supports JSON, CSV, and plain text export formats.
 *
 * @module historyExport
 */

import type { HistoryItem } from "./history.types";

/**
 * Export history items to JSON format.
 *
 * Serializes history items to a formatted JSON string with 2-space indentation.
 * Suitable for backup, migration, or data interchange.
 *
 * @param items - Array of history items to export
 * @returns Formatted JSON string representation
 *
 * @example
 * ```ts
 * const json = exportHistoryToJSON(historyItems);
 * // '{"id":"abc123","text":"Hello","createdAt":"2026-03-14T03:00:00Z",...}'
 * ```
 */
export function exportHistoryToJSON(items: HistoryItem[]): string {
	return JSON.stringify(items, null, 2);
}

/**
 * Export history items to CSV format.
 *
 * Creates a CSV string with headers: id, text, createdAt, sourceApp.
 * Handles text escaping for CSV format (quotes are doubled).
 *
 * @param items - Array of history items to export
 * @returns CSV string with header row and data rows
 *
 * @example
 * ```ts
 * const csv = exportHistoryToCSV(historyItems);
 * // 'id,text,createdAt,sourceApp\nabc123,"Hello",2026-03-14T03:00:00Z,Chrome'
 * ```
 */
export function exportHistoryToCSV(items: HistoryItem[]): string {
	const header = "id,text,createdAt,sourceApp\n";
	const rows = items.map(
		(item) =>
			`${item.id},"${item.text.replace(/"/g, '""')}",${item.createdAt},${item.sourceApp || ""}`,
	);
	return header + rows.join("\n");
}

/**
 * Export history items to plain text format.
 *
 * Creates a human-readable text representation with timestamps.
 * Each line contains the creation timestamp and text content.
 *
 * @param items - Array of history items to export
 * @returns Plain text string with formatted items
 *
 * @example
 * ```ts
 * const text = exportHistoryToText(historyItems);
 * // '[2026-03-14T03:00:00Z] Hello World\n[2026-03-14T03:01:00Z] Another item'
 * ```
 */
export function exportHistoryToText(items: HistoryItem[]): string {
	return items.map((item) => `[${item.createdAt}] ${item.text}`).join("\n");
}
