/**
 * History export utilities
 */

import type { HistoryItem } from "./history.types";

/**
 * Export history items to JSON
 */
export function exportHistoryToJSON(items: HistoryItem[]): string {
	return JSON.stringify(items, null, 2);
}

/**
 * Export history items to CSV
 */
export function exportHistoryToCSV(items: HistoryItem[]): string {
	const header = "id,text,createdAt,sourceApp\n";
	const rows = items.map(item => 
		`${item.id},"${item.text.replace(/"/g, '""')}",${item.createdAt},${item.sourceApp || ""}`
	);
	return header + rows.join("\n");
}

/**
 * Export history items to plain text
 */
export function exportHistoryToText(items: HistoryItem[]): string {
	return items.map(item => `[${item.createdAt}] ${item.text}`).join("\n");
}
