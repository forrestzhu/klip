import {
	DEFAULT_SNIPPETS_FOLDER_ID,
	DEFAULT_SNIPPETS_FOLDER_NAME,
	SNIPPETS_SCHEMA_VERSION,
} from "./snippet.constants";
import type {
	SnippetFolder,
	SnippetItem,
	SnippetsState,
	SnippetsStorage,
} from "./snippet.types";
import {
	createSnippetId,
	deriveSnippetTitle,
	normalizeFolderName,
	normalizeSnippetAlias,
	normalizeSnippetText,
	normalizeSnippetTitle,
} from "./snippetUtils";

interface SnippetRepositoryOptions {
	storage: SnippetsStorage;
	now?: () => Date;
	createId?: () => string;
}

interface AddSnippetInput {
	text: string;
	title?: string | null;
	alias?: string | null;
	folderId?: string | null;
}

interface UpdateSnippetInput {
	id: string;
	text?: string | null;
	title?: string | null;
	alias?: string | null;
	folderId?: string | null;
}

export class SnippetRepository {
	private readonly storage: SnippetsStorage;
	private readonly now: () => Date;
	private readonly createId: () => string;

	private state: SnippetsState;
	private hasLoaded = false;

	public constructor(options: SnippetRepositoryOptions) {
		this.storage = options.storage;
		this.now = options.now ?? (() => new Date());
		this.createId = options.createId ?? createSnippetId;
		this.state = this.createDefaultState();
	}

	public async load(): Promise<SnippetsState> {
		if (this.hasLoaded) {
			return this.getState();
		}

		const loadedState = await this.storage.load();
		let shouldPersist = false;

		if (loadedState === null) {
			this.state = this.createDefaultState();
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

	public getState(): SnippetsState {
		return {
			...this.state,
			folders: this.state.folders.map((folder) => ({ ...folder })),
			snippets: this.state.snippets.map((snippet) => ({ ...snippet })),
		};
	}

	public getFolders(): SnippetFolder[] {
		return this.state.folders.map((folder) => ({ ...folder }));
	}

	public getSnippets(): SnippetItem[] {
		return this.state.snippets.map((snippet) => ({ ...snippet }));
	}

	public searchSnippets(
		query: string,
		folderId?: string | null,
	): SnippetItem[] {
		const keyword = query.trim().toLowerCase();
		const folderFilter = this.resolveFolderId(folderId);

		return this.state.snippets
			.filter((snippet) => {
				if (folderFilter !== null && snippet.folderId !== folderFilter) {
					return false;
				}

				if (keyword.length === 0) {
					return true;
				}

				return (
					(snippet.alias ?? "").toLowerCase().includes(keyword) ||
					snippet.title.toLowerCase().includes(keyword) ||
					snippet.text.toLowerCase().includes(keyword)
				);
			})
			.map((snippet) => ({ ...snippet }));
	}

	public async addFolder(name: string): Promise<SnippetFolder> {
		await this.ensureLoaded();

		const normalizedName = normalizeFolderName(name);
		const existing = this.state.folders.find(
			(folder) => folder.name.toLowerCase() === normalizedName.toLowerCase(),
		);
		if (existing) {
			return { ...existing };
		}

		const nowIso = this.now().toISOString();
		const folder: SnippetFolder = {
			id: this.createId(),
			name: normalizedName,
			createdAt: nowIso,
			updatedAt: nowIso,
		};

		this.state.folders.push(folder);
		await this.persist();
		return { ...folder };
	}

	public async renameFolder(
		folderId: string,
		name: string,
	): Promise<SnippetFolder | null> {
		await this.ensureLoaded();

		const index = this.state.folders.findIndex(
			(folder) => folder.id === folderId,
		);
		if (index < 0) {
			return null;
		}

		const normalizedName = normalizeFolderName(name);
		const duplicate = this.state.folders.find(
			(folder) =>
				folder.id !== folderId &&
				folder.name.toLowerCase() === normalizedName.toLowerCase(),
		);
		if (duplicate) {
			return null;
		}

		const folder = this.state.folders[index];
		if (!folder) {
			return null;
		}

		folder.name = normalizedName;
		folder.updatedAt = this.now().toISOString();
		await this.persist();
		return { ...folder };
	}

	public async deleteFolder(folderId: string): Promise<boolean> {
		await this.ensureLoaded();

		if (folderId === DEFAULT_SNIPPETS_FOLDER_ID) {
			return false;
		}

		const folderIndex = this.state.folders.findIndex(
			(folder) => folder.id === folderId,
		);
		if (folderIndex < 0) {
			return false;
		}

		this.state.folders.splice(folderIndex, 1);

		const nowIso = this.now().toISOString();
		for (const snippet of this.state.snippets) {
			if (snippet.folderId === folderId) {
				snippet.folderId = DEFAULT_SNIPPETS_FOLDER_ID;
				snippet.updatedAt = nowIso;
			}
		}

		await this.persist();
		return true;
	}

	public async addSnippet(input: AddSnippetInput): Promise<SnippetItem | null> {
		await this.ensureLoaded();

		const normalizedText = normalizeSnippetText(input.text);
		if (normalizedText === null) {
			return null;
		}

		const nowIso = this.now().toISOString();
		const snippet: SnippetItem = {
			id: this.createId(),
			title: normalizeSnippetTitle(input.title, normalizedText),
			text: input.text,
			alias: normalizeSnippetAlias(input.alias),
			folderId:
				this.resolveFolderId(input.folderId) ?? DEFAULT_SNIPPETS_FOLDER_ID,
			createdAt: nowIso,
			updatedAt: nowIso,
		};

		this.state.snippets = [snippet, ...this.state.snippets];
		await this.persist();
		return { ...snippet };
	}

	public async updateSnippet(
		input: UpdateSnippetInput,
	): Promise<SnippetItem | null> {
		await this.ensureLoaded();

		const snippet = this.state.snippets.find((item) => item.id === input.id);
		if (!snippet) {
			return null;
		}

		let nextText = snippet.text;
		if (typeof input.text !== "undefined") {
			const normalizedText = normalizeSnippetText(input.text);
			if (normalizedText === null) {
				return null;
			}
			nextText = normalizedText;
		}

		const nextFolderId =
			this.resolveFolderId(input.folderId) ?? DEFAULT_SNIPPETS_FOLDER_ID;

		let nextTitle = snippet.title;
		if (typeof input.title !== "undefined") {
			nextTitle = normalizeSnippetTitle(input.title, nextText);
		} else if (typeof input.text !== "undefined") {
			const previousDerived = deriveSnippetTitle(snippet.text);
			if (snippet.title === previousDerived) {
				nextTitle = deriveSnippetTitle(nextText);
			}
		}
		let nextAlias = snippet.alias ?? null;
		if (typeof input.alias !== "undefined") {
			nextAlias = normalizeSnippetAlias(input.alias);
		}

		snippet.text = nextText;
		snippet.title = nextTitle;
		snippet.alias = nextAlias;
		snippet.folderId = nextFolderId;
		snippet.updatedAt = this.now().toISOString();

		await this.persist();
		return { ...snippet };
	}

	public async deleteSnippet(snippetId: string): Promise<boolean> {
		await this.ensureLoaded();

		const index = this.state.snippets.findIndex(
			(snippet) => snippet.id === snippetId,
		);
		if (index < 0) {
			return false;
		}

		this.state.snippets.splice(index, 1);
		await this.persist();
		return true;
	}

	private async ensureLoaded() {
		if (this.hasLoaded) {
			return;
		}

		await this.load();
	}

	private resolveFolderId(folderId: string | null | undefined): string | null {
		if (typeof folderId !== "string") {
			return null;
		}

		const normalizedFolderId = folderId.trim();
		if (normalizedFolderId.length === 0) {
			return null;
		}

		return this.state.folders.some((folder) => folder.id === normalizedFolderId)
			? normalizedFolderId
			: null;
	}

	private createDefaultState(): SnippetsState {
		const nowIso = this.now().toISOString();
		return {
			schemaVersion: SNIPPETS_SCHEMA_VERSION,
			folders: [
				{
					id: DEFAULT_SNIPPETS_FOLDER_ID,
					name: DEFAULT_SNIPPETS_FOLDER_NAME,
					createdAt: nowIso,
					updatedAt: nowIso,
				},
			],
			snippets: [],
		};
	}

	private normalizeState(input: SnippetsState): SnippetsState {
		const nowIso = this.now().toISOString();
		const normalizedFolders: SnippetFolder[] = [];
		const folderIds = new Set<string>();

		for (const folder of input.folders) {
			if (typeof folder.id !== "string" || folder.id.trim().length === 0) {
				continue;
			}
			if (folderIds.has(folder.id)) {
				continue;
			}

			folderIds.add(folder.id);
			normalizedFolders.push({
				id: folder.id,
				name: normalizeFolderName(folder.name),
				createdAt:
					typeof folder.createdAt === "string" && folder.createdAt.length > 0
						? folder.createdAt
						: nowIso,
				updatedAt:
					typeof folder.updatedAt === "string" && folder.updatedAt.length > 0
						? folder.updatedAt
						: nowIso,
			});
		}

		if (!folderIds.has(DEFAULT_SNIPPETS_FOLDER_ID)) {
			normalizedFolders.unshift({
				id: DEFAULT_SNIPPETS_FOLDER_ID,
				name: DEFAULT_SNIPPETS_FOLDER_NAME,
				createdAt: nowIso,
				updatedAt: nowIso,
			});
			folderIds.add(DEFAULT_SNIPPETS_FOLDER_ID);
		}

		const snippetIds = new Set<string>();
		const normalizedSnippets: SnippetItem[] = [];

		for (const snippet of input.snippets) {
			if (typeof snippet.id !== "string" || snippet.id.trim().length === 0) {
				continue;
			}
			if (snippetIds.has(snippet.id)) {
				continue;
			}

			const text = normalizeSnippetText(snippet.text);
			if (text === null) {
				continue;
			}

			snippetIds.add(snippet.id);
			normalizedSnippets.push({
				id: snippet.id,
				title: normalizeSnippetTitle(snippet.title, text),
				text: snippet.text,
				alias: normalizeSnippetAlias(snippet.alias),
				folderId: folderIds.has(snippet.folderId)
					? snippet.folderId
					: DEFAULT_SNIPPETS_FOLDER_ID,
				createdAt:
					typeof snippet.createdAt === "string" && snippet.createdAt.length > 0
						? snippet.createdAt
						: nowIso,
				updatedAt:
					typeof snippet.updatedAt === "string" && snippet.updatedAt.length > 0
						? snippet.updatedAt
						: nowIso,
			});
		}

		return {
			schemaVersion:
				typeof input.schemaVersion === "number"
					? input.schemaVersion
					: SNIPPETS_SCHEMA_VERSION,
			folders: normalizedFolders,
			snippets: normalizedSnippets,
		};
	}

	private async persist() {
		await this.storage.save(this.state);
	}
}

function isSameState(left: SnippetsState, right: SnippetsState): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}
