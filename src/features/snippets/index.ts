export {
	DEFAULT_SNIPPET_ALIAS_MAX_LENGTH,
	DEFAULT_SNIPPET_TITLE_MAX_LENGTH,
	DEFAULT_SNIPPETS_FOLDER_ID,
	DEFAULT_SNIPPETS_FOLDER_NAME,
	SNIPPETS_SCHEMA_VERSION,
} from "./snippet.constants";
export type {
	SnippetFolder,
	SnippetItem,
	SnippetsState,
	SnippetsStorage,
} from "./snippet.types";
export { SnippetRepository } from "./snippetRepository";
export {
	createBrowserSnippetsStorage,
	SNIPPETS_STORAGE_KEY,
} from "./snippetStorage";
export {
	createSnippetId,
	deriveSnippetTitle,
	isNonEmptyText,
	normalizeFolderName,
	normalizeSnippetAlias,
	normalizeSnippetText,
	normalizeSnippetTitle,
} from "./snippetUtils";
