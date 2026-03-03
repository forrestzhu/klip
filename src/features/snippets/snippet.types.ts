export interface SnippetFolder {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

export interface SnippetItem {
	id: string;
	title: string;
	text: string;
	folderId: string;
	createdAt: string;
	updatedAt: string;
}

export interface SnippetsState {
	schemaVersion: number;
	folders: SnippetFolder[];
	snippets: SnippetItem[];
}

export interface SnippetsStorage {
	load(): Promise<SnippetsState | null>;
	save(state: SnippetsState): Promise<void>;
}
