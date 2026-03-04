import {
	DEFAULT_HISTORY_MAX_ITEMS,
	HISTORY_SCHEMA_VERSION,
} from "./history.constants";
import type {
	HistoryItem,
	HistoryState,
	HistoryStorage,
} from "./history.types";
import {
	clampHistoryMaxItems,
	createHistoryId,
	isCapturableText,
	normalizeSourceApp,
} from "./historyUtils";

interface HistoryRepositoryOptions {
	storage: HistoryStorage;
	defaultMaxItems?: number;
	now?: () => Date;
	createId?: () => string;
}

interface AddCapturedTextInput {
	text: string;
	sourceApp?: string | null;
}

export class HistoryRepository {
	private readonly storage: HistoryStorage;
	private readonly now: () => Date;
	private readonly createId: () => string;
	private readonly defaultMaxItems: number;

	private state: HistoryState;
	private hasLoaded = false;

	public constructor(options: HistoryRepositoryOptions) {
		this.storage = options.storage;
		this.now = options.now ?? (() => new Date());
		this.createId = options.createId ?? createHistoryId;
		this.defaultMaxItems = clampHistoryMaxItems(
			options.defaultMaxItems ?? DEFAULT_HISTORY_MAX_ITEMS,
		);
		this.state = this.createDefaultState(this.defaultMaxItems);
	}

	public async load(): Promise<HistoryState> {
		if (this.hasLoaded) {
			return this.getState();
		}

		const loadedState = await this.storage.load();
		let shouldPersist = false;

		if (loadedState === null) {
			this.state = this.createDefaultState(this.defaultMaxItems);
			shouldPersist = true;
		} else {
			const normalized = this.normalizeState(loadedState);
			shouldPersist = !isSameState(normalized, loadedState);
			this.state = normalized;
		}

		this.hasLoaded = true;

		if (shouldPersist) {
			await this.persist();
		}

		return this.getState();
	}

	public getState(): HistoryState {
		return {
			...this.state,
			items: this.state.items.map((item) => ({ ...item })),
		};
	}

	public getItems(): HistoryItem[] {
		return this.state.items.map((item) => ({ ...item }));
	}

	public getMaxItems(): number {
		return this.state.maxItems;
	}

	public async setMaxItems(maxItems: number): Promise<number> {
		await this.ensureLoaded();

		const clamped = clampHistoryMaxItems(maxItems);
		if (clamped === this.state.maxItems) {
			return clamped;
		}

		this.state.maxItems = clamped;
		this.state.items = this.state.items.slice(0, clamped);
		await this.persist();
		return clamped;
	}

	public async clearItems(): Promise<void> {
		await this.ensureLoaded();

		if (this.state.items.length === 0) {
			return;
		}

		this.state.items = [];
		await this.persist();
	}

	public async addCapturedText(
		input: AddCapturedTextInput,
	): Promise<HistoryItem | null> {
		await this.ensureLoaded();

		if (!isCapturableText(input.text)) {
			return null;
		}

		const latestItem = this.state.items[0];
		if (latestItem?.text === input.text) {
			return null;
		}

		const item: HistoryItem = {
			id: this.createId(),
			text: input.text,
			createdAt: this.now().toISOString(),
			sourceApp: normalizeSourceApp(input.sourceApp),
		};

		this.state.items = [item, ...this.state.items].slice(
			0,
			this.state.maxItems,
		);
		await this.persist();

		return { ...item };
	}

	private async ensureLoaded() {
		if (this.hasLoaded) {
			return;
		}

		await this.load();
	}

	private createDefaultState(maxItems: number): HistoryState {
		return {
			schemaVersion: HISTORY_SCHEMA_VERSION,
			maxItems: clampHistoryMaxItems(maxItems),
			items: [],
		};
	}

	private normalizeState(input: HistoryState): HistoryState {
		return {
			schemaVersion:
				typeof input.schemaVersion === "number"
					? input.schemaVersion
					: HISTORY_SCHEMA_VERSION,
			maxItems: clampHistoryMaxItems(input.maxItems),
			items: Array.isArray(input.items)
				? input.items
						.filter((item): item is HistoryItem => {
							return (
								typeof item?.id === "string" &&
								typeof item?.text === "string" &&
								typeof item?.createdAt === "string"
							);
						})
						.slice(
							0,
							clampHistoryMaxItems(
								typeof input.maxItems === "number"
									? input.maxItems
									: this.defaultMaxItems,
							),
						)
						.map((item) => ({
							id: item.id,
							text: item.text,
							createdAt: item.createdAt,
							sourceApp: normalizeSourceApp(item.sourceApp),
						}))
				: [],
		};
	}

	private async persist() {
		await this.storage.save(this.state);
	}
}

function isSameState(left: HistoryState, right: HistoryState): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}
