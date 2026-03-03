import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ClipboardMonitor,
	type ClipboardPort,
	createBrowserClipboardPort,
	createBrowserHistoryStorage,
	type HistoryItem,
	HistoryRepository,
} from "./features/history";
import {
	createBrowserSnippetsStorage,
	DEFAULT_SNIPPETS_FOLDER_ID,
	type SnippetFolder,
	type SnippetItem,
	SnippetRepository,
} from "./features/snippets";
import { toClipboardPreview } from "./utils/toClipboardPreview";

interface RuntimeContext {
	clipboard: ClipboardPort;
	monitor: ClipboardMonitor;
	historyRepository: HistoryRepository;
	snippetRepository: SnippetRepository;
}

type ListenerStatus = "starting" | "ready" | "error";
type PanelMode = "history" | "snippets";

const PANEL_MODE_STORAGE_KEY = "klip.ui.panel.mode";
const ALL_SNIPPET_FOLDERS_VALUE = "__all_folders__";

export function App() {
	const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
	const [maxItems, setMaxItems] = useState(200);
	const [snippetFolders, setSnippetFolders] = useState<SnippetFolder[]>([]);
	const [snippetItems, setSnippetItems] = useState<SnippetItem[]>([]);
	const [selectedSnippetFolderId, setSelectedSnippetFolderId] = useState(
		ALL_SNIPPET_FOLDERS_VALUE,
	);
	const [query, setQuery] = useState("");
	const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(0);
	const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0);
	const [panelMode, setPanelMode] = useState<PanelMode>(() =>
		readInitialPanelMode(),
	);
	const [listenerStatus, setListenerStatus] =
		useState<ListenerStatus>("starting");
	const [listenerMessage, setListenerMessage] = useState(
		"Starting clipboard listener...",
	);
	const [actionMessage, setActionMessage] = useState<string | null>(null);
	const [folderNameDraft, setFolderNameDraft] = useState("");
	const [snippetTitleDraft, setSnippetTitleDraft] = useState("");
	const [snippetTextDraft, setSnippetTextDraft] = useState("");
	const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);

	const runtimeRef = useRef<RuntimeContext | null>(null);

	const filteredHistoryItems = useMemo(() => {
		const keyword = query.trim().toLowerCase();
		if (keyword.length === 0) {
			return historyItems;
		}

		return historyItems.filter((item) =>
			item.text.toLowerCase().includes(keyword),
		);
	}, [historyItems, query]);

	const filteredSnippetItems = useMemo(() => {
		const keyword = query.trim().toLowerCase();
		const folderFilter =
			selectedSnippetFolderId === ALL_SNIPPET_FOLDERS_VALUE
				? null
				: selectedSnippetFolderId;

		return snippetItems.filter((item) => {
			if (folderFilter !== null && item.folderId !== folderFilter) {
				return false;
			}
			if (keyword.length === 0) {
				return true;
			}

			return (
				item.title.toLowerCase().includes(keyword) ||
				item.text.toLowerCase().includes(keyword)
			);
		});
	}, [snippetItems, query, selectedSnippetFolderId]);

	const folderNameById = useMemo(() => {
		return new Map(snippetFolders.map((folder) => [folder.id, folder.name]));
	}, [snippetFolders]);

	useEffect(() => {
		setSelectedHistoryIndex((current) => {
			if (filteredHistoryItems.length === 0) {
				return 0;
			}
			return Math.min(current, filteredHistoryItems.length - 1);
		});
	}, [filteredHistoryItems.length]);

	useEffect(() => {
		setSelectedSnippetIndex((current) => {
			if (filteredSnippetItems.length === 0) {
				return 0;
			}
			return Math.min(current, filteredSnippetItems.length - 1);
		});
	}, [filteredSnippetItems.length]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		window.localStorage.setItem(PANEL_MODE_STORAGE_KEY, panelMode);
	}, [panelMode]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const handleModeSwitch = (event: globalThis.KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey)) {
				return;
			}

			if (event.key === "1") {
				event.preventDefault();
				setPanelMode("history");
			}

			if (event.key === "2") {
				event.preventDefault();
				setPanelMode("snippets");
			}
		};

		window.addEventListener("keydown", handleModeSwitch);
		return () => {
			window.removeEventListener("keydown", handleModeSwitch);
		};
	}, []);

	useEffect(() => {
		let disposed = false;

		if (typeof window === "undefined") {
			setListenerStatus("error");
			setListenerMessage("Browser runtime unavailable.");
			return undefined;
		}

		const historyRepository = new HistoryRepository({
			storage: createBrowserHistoryStorage(window.localStorage),
		});
		const snippetRepository = new SnippetRepository({
			storage: createBrowserSnippetsStorage(window.localStorage),
		});
		const clipboard = createBrowserClipboardPort();
		const refreshHistory = () => {
			if (disposed) {
				return;
			}

			setHistoryItems(historyRepository.getItems());
			setMaxItems(historyRepository.getMaxItems());
		};
		const refreshSnippets = () => {
			if (disposed) {
				return;
			}

			setSnippetItems(snippetRepository.getSnippets());
			setSnippetFolders(snippetRepository.getFolders());
		};
		const refreshAll = () => {
			refreshHistory();
			refreshSnippets();
		};

		const monitor = new ClipboardMonitor({
			reader: clipboard,
			onTextCaptured: async (text) => {
				const created = await historyRepository.addCapturedText({ text });
				if (created !== null) {
					refreshHistory();
				}
			},
		});

		runtimeRef.current = {
			clipboard,
			monitor,
			historyRepository,
			snippetRepository,
		};

		const bootstrap = async () => {
			try {
				setListenerStatus("starting");
				setListenerMessage("Starting clipboard listener...");
				await Promise.all([historyRepository.load(), snippetRepository.load()]);
				refreshAll();
				monitor.start();
				await monitor.whenReady();

				if (disposed) {
					return;
				}

				setListenerStatus("ready");
				setListenerMessage("Clipboard listener is ready.");
			} catch (error) {
				if (disposed) {
					return;
				}

				setListenerStatus("error");
				setListenerMessage(toErrorMessage(error));
			}
		};

		void bootstrap();

		return () => {
			disposed = true;
			monitor.stop();
			runtimeRef.current = null;
		};
	}, []);

	const handleSearchKeyDown = async (
		event: KeyboardEvent<HTMLInputElement>,
	) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			if (panelMode === "history") {
				setSelectedHistoryIndex((current) =>
					Math.min(current + 1, Math.max(0, filteredHistoryItems.length - 1)),
				);
			} else {
				setSelectedSnippetIndex((current) =>
					Math.min(current + 1, Math.max(0, filteredSnippetItems.length - 1)),
				);
			}
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			if (panelMode === "history") {
				setSelectedHistoryIndex((current) => Math.max(current - 1, 0));
			} else {
				setSelectedSnippetIndex((current) => Math.max(current - 1, 0));
			}
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			if (panelMode === "history") {
				await copySelectedHistory();
			} else {
				await pasteSelectedSnippet();
			}
			return;
		}

		if ((event.ctrlKey || event.metaKey) && event.key === "1") {
			event.preventDefault();
			setPanelMode("history");
		}

		if ((event.ctrlKey || event.metaKey) && event.key === "2") {
			event.preventDefault();
			setPanelMode("snippets");
		}
	};

	const handleChangeMaxItems = async (event: ChangeEvent<HTMLInputElement>) => {
		const value = Number(event.currentTarget.value);
		if (!Number.isFinite(value)) {
			return;
		}

		const runtime = runtimeRef.current;
		if (!runtime) {
			return;
		}

		const applied = await runtime.historyRepository.setMaxItems(value);
		setMaxItems(applied);
		setHistoryItems(runtime.historyRepository.getItems());
		setActionMessage(`History limit updated to ${applied}.`);
	};

	const copySelectedHistory = async () => {
		const selectedItem = filteredHistoryItems[selectedHistoryIndex];
		if (!selectedItem) {
			return;
		}

		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		try {
			runtime.monitor.suppressText(selectedItem.text);
			await runtime.clipboard.writeText(selectedItem.text);
			setActionMessage("Copied selected history text to clipboard.");
		} catch (error) {
			setActionMessage(`Copy failed: ${toErrorMessage(error)}`);
		}
	};

	const pasteSelectedSnippet = async () => {
		const selectedSnippet = filteredSnippetItems[selectedSnippetIndex];
		if (!selectedSnippet) {
			return;
		}

		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		try {
			runtime.monitor.suppressText(selectedSnippet.text);
			await runtime.clipboard.writeText(selectedSnippet.text);
			setActionMessage(
				"Snippet copied to clipboard. Paste in target app with system shortcut.",
			);
		} catch (error) {
			setActionMessage(`Snippet copy failed: ${toErrorMessage(error)}`);
		}
	};

	const handleSaveSnippet = async () => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		const folderId =
			selectedSnippetFolderId === ALL_SNIPPET_FOLDERS_VALUE
				? DEFAULT_SNIPPETS_FOLDER_ID
				: selectedSnippetFolderId;

		if (editingSnippetId !== null) {
			const updated = await runtime.snippetRepository.updateSnippet({
				id: editingSnippetId,
				text: snippetTextDraft,
				title: snippetTitleDraft,
				folderId,
			});
			if (updated === null) {
				setActionMessage("Snippet update failed. Text cannot be empty.");
				return;
			}

			setActionMessage("Snippet updated.");
		} else {
			const created = await runtime.snippetRepository.addSnippet({
				text: snippetTextDraft,
				title: snippetTitleDraft,
				folderId,
			});
			if (created === null) {
				setActionMessage("Snippet save failed. Text cannot be empty.");
				return;
			}

			setActionMessage("Snippet created.");
		}

		setSnippetItems(runtime.snippetRepository.getSnippets());
		setSnippetFolders(runtime.snippetRepository.getFolders());
		setSnippetTitleDraft("");
		setSnippetTextDraft("");
		setEditingSnippetId(null);
	};

	const handleEditSnippet = (snippet: SnippetItem) => {
		setPanelMode("snippets");
		setEditingSnippetId(snippet.id);
		setSnippetTitleDraft(snippet.title);
		setSnippetTextDraft(snippet.text);
		setSelectedSnippetFolderId(snippet.folderId);
	};

	const handleDeleteSnippet = async (snippet: SnippetItem) => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		const shouldDelete =
			typeof window === "undefined"
				? true
				: window.confirm(`Delete snippet "${snippet.title}"?`);
		if (!shouldDelete) {
			return;
		}

		const deleted = await runtime.snippetRepository.deleteSnippet(snippet.id);
		if (!deleted) {
			setActionMessage("Snippet was not found.");
			return;
		}

		if (editingSnippetId === snippet.id) {
			setEditingSnippetId(null);
			setSnippetTitleDraft("");
			setSnippetTextDraft("");
		}

		setSnippetItems(runtime.snippetRepository.getSnippets());
		setSnippetFolders(runtime.snippetRepository.getFolders());
		setActionMessage("Snippet deleted.");
	};

	const handleAddFolder = async () => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		if (folderNameDraft.trim().length === 0) {
			setActionMessage("Folder name cannot be empty.");
			return;
		}

		const created = await runtime.snippetRepository.addFolder(folderNameDraft);
		setSnippetFolders(runtime.snippetRepository.getFolders());
		setSelectedSnippetFolderId(created.id);
		setFolderNameDraft("");
		setActionMessage(`Folder ready: ${created.name}.`);
	};

	const handleRenameFolder = async () => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		if (selectedSnippetFolderId === ALL_SNIPPET_FOLDERS_VALUE) {
			setActionMessage("Select one folder to rename.");
			return;
		}

		if (folderNameDraft.trim().length === 0) {
			setActionMessage("Folder name cannot be empty.");
			return;
		}

		const renamed = await runtime.snippetRepository.renameFolder(
			selectedSnippetFolderId,
			folderNameDraft,
		);
		if (renamed === null) {
			setActionMessage("Folder rename failed. Name might conflict.");
			return;
		}

		setSnippetFolders(runtime.snippetRepository.getFolders());
		setFolderNameDraft("");
		setActionMessage(`Folder renamed to ${renamed.name}.`);
	};

	const handleDeleteFolder = async () => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		if (selectedSnippetFolderId === ALL_SNIPPET_FOLDERS_VALUE) {
			setActionMessage("Select one folder to delete.");
			return;
		}

		if (selectedSnippetFolderId === DEFAULT_SNIPPETS_FOLDER_ID) {
			setActionMessage("General folder cannot be deleted.");
			return;
		}

		const folderName =
			folderNameById.get(selectedSnippetFolderId) ?? selectedSnippetFolderId;
		const shouldDelete =
			typeof window === "undefined"
				? true
				: window.confirm(
						`Delete folder "${folderName}" and move snippets to General?`,
					);
		if (!shouldDelete) {
			return;
		}

		const deleted = await runtime.snippetRepository.deleteFolder(
			selectedSnippetFolderId,
		);
		if (!deleted) {
			setActionMessage("Folder delete failed.");
			return;
		}

		setSnippetFolders(runtime.snippetRepository.getFolders());
		setSnippetItems(runtime.snippetRepository.getSnippets());
		setSelectedSnippetFolderId(ALL_SNIPPET_FOLDERS_VALUE);
		setActionMessage("Folder deleted and snippets moved to General.");
	};

	const renderHistoryPanel = () => {
		return (
			<ul className="history-list">
				{filteredHistoryItems.length === 0 ? (
					<li className="empty-row">No history items yet.</li>
				) : (
					filteredHistoryItems.map((item, index) => (
						<li key={item.id}>
							<button
								className={`history-item ${
									index === selectedHistoryIndex ? "selected" : ""
								}`}
								type="button"
								onClick={() => {
									setSelectedHistoryIndex(index);
									void copySelectedHistory();
								}}
							>
								<div className="history-main">
									{toClipboardPreview(item.text, 96)}
								</div>
								<div className="history-meta">
									{new Date(item.createdAt).toLocaleString()}
								</div>
							</button>
						</li>
					))
				)}
			</ul>
		);
	};

	const renderSnippetsPanel = () => {
		return (
			<>
				<section className="snippet-controls">
					<div className="snippet-folder-row">
						<label className="search-field" htmlFor="snippet-folder-select">
							Folder
						</label>
						<select
							id="snippet-folder-select"
							className="search-input"
							value={selectedSnippetFolderId}
							onChange={(event) => {
								setSelectedSnippetFolderId(event.currentTarget.value);
								setSelectedSnippetIndex(0);
							}}
						>
							<option value={ALL_SNIPPET_FOLDERS_VALUE}>All folders</option>
							{snippetFolders.map((folder) => (
								<option key={folder.id} value={folder.id}>
									{folder.name}
								</option>
							))}
						</select>

						<input
							className="search-input"
							placeholder="Folder name"
							type="text"
							value={folderNameDraft}
							onChange={(event) => {
								setFolderNameDraft(event.currentTarget.value);
							}}
						/>

						<div className="inline-actions">
							<button
								className="ghost-button"
								type="button"
								onClick={() => {
									void handleAddFolder();
								}}
							>
								Add Folder
							</button>
							<button
								className="ghost-button"
								type="button"
								onClick={() => {
									void handleRenameFolder();
								}}
							>
								Rename
							</button>
							<button
								className="ghost-button danger"
								type="button"
								onClick={() => {
									void handleDeleteFolder();
								}}
							>
								Delete
							</button>
						</div>
					</div>

					<div className="snippet-editor">
						<input
							className="search-input"
							placeholder="Snippet title (optional)"
							type="text"
							value={snippetTitleDraft}
							onChange={(event) => {
								setSnippetTitleDraft(event.currentTarget.value);
							}}
						/>
						<textarea
							className="snippet-textarea"
							placeholder="Snippet text"
							value={snippetTextDraft}
							onChange={(event) => {
								setSnippetTextDraft(event.currentTarget.value);
							}}
						/>
						<div className="inline-actions">
							<button
								className="ghost-button"
								type="button"
								onClick={() => {
									void handleSaveSnippet();
								}}
							>
								{editingSnippetId === null ? "Create Snippet" : "Save Changes"}
							</button>
							<button
								className="ghost-button"
								type="button"
								onClick={() => {
									setEditingSnippetId(null);
									setSnippetTitleDraft("");
									setSnippetTextDraft("");
								}}
							>
								Clear
							</button>
						</div>
					</div>
				</section>

				<ul className="history-list">
					{filteredSnippetItems.length === 0 ? (
						<li className="empty-row">No snippets found.</li>
					) : (
						filteredSnippetItems.map((item, index) => (
							<li
								key={item.id}
								className={`snippet-row ${
									index === selectedSnippetIndex ? "selected" : ""
								}`}
							>
								<button
									type="button"
									className="snippet-item"
									onClick={() => {
										setSelectedSnippetIndex(index);
										void pasteSelectedSnippet();
									}}
								>
									<div className="history-main">{item.title}</div>
									<div className="history-meta">
										{folderNameById.get(item.folderId) ?? "General"} ·{" "}
										{new Date(item.updatedAt).toLocaleString()}
									</div>
									<div className="snippet-preview">
										{toClipboardPreview(item.text, 96)}
									</div>
								</button>
								<div className="inline-actions">
									<button
										className="ghost-button"
										type="button"
										onClick={() => {
											handleEditSnippet(item);
										}}
									>
										Edit
									</button>
									<button
										className="ghost-button danger"
										type="button"
										onClick={() => {
											void handleDeleteSnippet(item);
										}}
									>
										Delete
									</button>
								</div>
							</li>
						))
					)}
				</ul>
			</>
		);
	};

	return (
		<main className="app-shell">
			<header className="topbar">
				<div>
					<h1>Klip</h1>
					<p className="status-line">
						Status:{" "}
						<span className={`status-pill status-${listenerStatus}`}>
							{listenerStatus}
						</span>{" "}
						{listenerMessage}
					</p>
				</div>
				<label className="max-items-field">
					Max history
					<input
						aria-label="Max history items"
						min={10}
						max={5000}
						type="number"
						value={maxItems}
						onChange={(event) => {
							void handleChangeMaxItems(event);
						}}
					/>
				</label>
			</header>

			<section className="panel">
				<div className="panel-title-row">
					<div className="mode-switch">
						<button
							type="button"
							className={`mode-button ${
								panelMode === "history" ? "active" : ""
							}`}
							onClick={() => {
								setPanelMode("history");
							}}
						>
							History
						</button>
						<button
							type="button"
							className={`mode-button ${
								panelMode === "snippets" ? "active" : ""
							}`}
							onClick={() => {
								setPanelMode("snippets");
							}}
						>
							Snippets
						</button>
					</div>
					<button
						className="ghost-button"
						type="button"
						onClick={() => {
							if (panelMode === "history") {
								void copySelectedHistory();
							} else {
								void pasteSelectedSnippet();
							}
						}}
					>
						{panelMode === "history" ? "Copy Selected" : "Paste Snippet"}
					</button>
				</div>
				<p className="mode-hint">Switch mode with Ctrl/Cmd+1 and Ctrl/Cmd+2.</p>

				<label className="search-field" htmlFor="panel-search">
					{panelMode === "history" ? "Search history" : "Search snippets"}
				</label>
				<input
					id="panel-search"
					autoComplete="off"
					className="search-input"
					placeholder={
						panelMode === "history"
							? "Type to filter history..."
							: "Search snippets by title or text..."
					}
					type="text"
					value={query}
					onChange={(event) => {
						setQuery(event.currentTarget.value);
						setSelectedHistoryIndex(0);
						setSelectedSnippetIndex(0);
					}}
					onKeyDown={(event) => {
						void handleSearchKeyDown(event);
					}}
				/>

				{panelMode === "history" ? renderHistoryPanel() : renderSnippetsPanel()}
				{actionMessage ? (
					<p className="action-message">{actionMessage}</p>
				) : null}
			</section>
		</main>
	);
}

function readInitialPanelMode(): PanelMode {
	if (typeof window === "undefined") {
		return "history";
	}

	const savedValue = window.localStorage.getItem(PANEL_MODE_STORAGE_KEY);
	return savedValue === "snippets" ? "snippets" : "history";
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return "Unexpected runtime error.";
}
