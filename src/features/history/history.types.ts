export interface HistoryItem {
	id: string;
	text: string;
	createdAt: string;
	sourceApp: string | null;
}

export interface HistoryState {
	schemaVersion: number;
	maxItems: number;
	items: HistoryItem[];
}

export interface HistoryStorage {
	load(): Promise<HistoryState | null>;
	save(state: HistoryState): Promise<void>;
}
