import {
	DEFAULT_HISTORY_MAX_ITEMS,
	HISTORY_SCHEMA_VERSION,
} from "./history.constants";
import type { HistoryState, HistoryStorage } from "./history.types";
import { clampHistoryMaxItems, normalizeSourceApp } from "./historyUtils";

export const HISTORY_STORAGE_KEY = "klip.history.v1";

export interface KeyValueStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

export function createBrowserHistoryStorage(
	storage: KeyValueStorage,
	storageKey = HISTORY_STORAGE_KEY,
): HistoryStorage {
	return {
		async load() {
			const raw = storage.getItem(storageKey);
			if (!raw) {
				return null;
			}

			try {
				const parsed = JSON.parse(raw) as Partial<HistoryState>;
				return normalizeLoadedState(parsed);
			} catch {
				return null;
			}
		},
		async save(state) {
			storage.setItem(storageKey, JSON.stringify(state));
		},
	};
}

function normalizeLoadedState(input: Partial<HistoryState>): HistoryState {
	const items = Array.isArray(input.items) ? input.items : [];

	return {
		schemaVersion:
			typeof input.schemaVersion === "number"
				? input.schemaVersion
				: HISTORY_SCHEMA_VERSION,
		maxItems: clampHistoryMaxItems(
			typeof input.maxItems === "number"
				? input.maxItems
				: DEFAULT_HISTORY_MAX_ITEMS,
		),
		items: items
			.filter((item): item is HistoryState["items"][number] => {
				return (
					typeof item?.id === "string" &&
					typeof item?.text === "string" &&
					typeof item?.createdAt === "string"
				);
			})
			.map((item) => ({
				id: item.id,
				text: item.text,
				createdAt: item.createdAt,
				sourceApp: normalizeSourceApp(item.sourceApp),
			})),
	};
}
