import { invoke } from "@tauri-apps/api/core";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ClipboardMonitor,
	type ClipboardPort,
	createBrowserHistoryStorage,
	createClipboardPort,
	type HistoryItem,
	HistoryRepository,
} from "./features/history";
import {
	buildPopupMenuRootEntries,
	isPopupSelectableEntry,
	isPopupSubmenuEntry,
	type PopupMenuEntry,
	resolvePopupMenuContext,
} from "./features/menu/popupMenuModel";
import { directPasteText } from "./features/paste";
import {
	canonicalizePanelHotkey,
	DEFAULT_PANEL_HOTKEY,
	DEFAULT_PASTE_MODE,
	DEFAULT_STARTUP_LAUNCH_ENABLED,
	formatPanelHotkeyForDisplay,
	hideDesktopPanelWindow,
	isDesktopRuntime,
	PASTE_MODE_CLIPBOARD_ONLY,
	PASTE_MODE_DIRECT_WITH_FALLBACK,
	type PasteMode,
	readDesktopStartupLaunchEnabled,
	readPanelHotkey,
	readPasteMode,
	readStartupLaunchEnabled,
	registerDesktopPanelHotkey,
	writeDesktopStartupLaunchEnabled,
	writePanelHotkey,
	writePasteMode,
	writeStartupLaunchEnabled,
} from "./features/settings";
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
type PanelView = "menu" | "snippet-editor" | "settings";

const ALL_SNIPPET_FOLDERS_VALUE = "__all_folders__";
const COMPACT_PANEL_SIZE = { width: 340, height: 720 };
const EXPANDED_PANEL_SIZE = { width: 1024, height: 720 };

export function App() {
	const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
	const [maxItems, setMaxItems] = useState(200);
	const [panelHotkey, setPanelHotkey] = useState(DEFAULT_PANEL_HOTKEY);
	const [panelHotkeyDraft, setPanelHotkeyDraft] =
		useState(DEFAULT_PANEL_HOTKEY);
	const [pasteMode, setPasteMode] = useState<PasteMode>(DEFAULT_PASTE_MODE);
	const [startupLaunchEnabled, setStartupLaunchEnabled] = useState(
		DEFAULT_STARTUP_LAUNCH_ENABLED,
	);
	const [snippetFolders, setSnippetFolders] = useState<SnippetFolder[]>([]);
	const [snippetItems, setSnippetItems] = useState<SnippetItem[]>([]);
	const [selectedSnippetFolderId, setSelectedSnippetFolderId] = useState(
		ALL_SNIPPET_FOLDERS_VALUE,
	);
	const [query, setQuery] = useState("");
	const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0);
	const [panelView, setPanelView] = useState<PanelView>("menu");
	const [menuPath, setMenuPath] = useState<string[]>([]);
	const [selectedMenuIndexes, setSelectedMenuIndexes] = useState<number[]>([0]);
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
	const popupPanelRef = useRef<HTMLElement | null>(null);
	const activatePopupEntryRef = useRef<
		(entry: PopupMenuEntry, depth: number, index: number) => Promise<void>
	>(async () => {});
	const panelHotkeyDraftDisplay = canonicalizePanelHotkey(panelHotkeyDraft);

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

	const popupRootEntries = useMemo(() => {
		return buildPopupMenuRootEntries({
			historyItems,
			snippetFolders,
			snippetItems,
		});
	}, [historyItems, snippetFolders, snippetItems]);

	const popupContext = useMemo(
		() => resolvePopupMenuContext(popupRootEntries, menuPath),
		[popupRootEntries, menuPath],
	);

	const popupColumns = useMemo(() => {
		const columns: PopupMenuEntry[][] = [popupRootEntries];
		for (let depth = 0; depth < popupContext.path.length; depth += 1) {
			const context = resolvePopupMenuContext(
				popupRootEntries,
				popupContext.path.slice(0, depth + 1),
			);
			columns.push(context.entries);
		}
		return columns;
	}, [popupContext.path, popupRootEntries]);

	const activeMenuDepth = popupColumns.length - 1;
	const activePopupEntries = popupColumns[activeMenuDepth] ?? popupRootEntries;
	const activeSelectedMenuIndex = selectedMenuIndexes[activeMenuDepth] ?? 0;
	const activePopupEntry = activePopupEntries[activeSelectedMenuIndex];
	const selectedSnippetPreview =
		activePopupEntry?.kind === "snippet-item" ? activePopupEntry.text : null;

	useEffect(() => {
		setSelectedSnippetIndex((current) => {
			if (filteredSnippetItems.length === 0) {
				return 0;
			}
			return Math.min(current, filteredSnippetItems.length - 1);
		});
	}, [filteredSnippetItems.length]);

	useEffect(() => {
		if (isSameStringArray(menuPath, popupContext.path)) {
			return;
		}
		setMenuPath(popupContext.path);
	}, [menuPath, popupContext.path]);

	useEffect(() => {
		setSelectedMenuIndexes((current) => {
			if (popupColumns.length === 0) {
				return [0];
			}

			let hasChanged = current.length !== popupColumns.length;
			const next = popupColumns.map((entries, depth) => {
				const preferredIndex = current[depth] ?? 0;
				const resolvedIndex = resolveSelectableIndex(entries, preferredIndex);
				if (resolvedIndex !== preferredIndex) {
					hasChanged = true;
				}
				return resolvedIndex;
			});

			return hasChanged ? next : current;
		});
	}, [popupColumns]);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState !== "hidden") {
				return;
			}
			setPanelView("menu");
			setMenuPath([]);
			setSelectedMenuIndexes([0]);
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const handleEscapeClose = (event: globalThis.KeyboardEvent) => {
			if (event.key !== "Escape" || !isDesktopRuntime()) {
				return;
			}

			event.preventDefault();
			setPanelView("menu");
			setMenuPath([]);
			setSelectedMenuIndexes([0]);
			void hideDesktopPanelWindow().catch((error) => {
				setActionMessage(`Failed to close panel: ${toErrorMessage(error)}`);
			});
		};

		window.addEventListener("keydown", handleEscapeClose);
		return () => {
			window.removeEventListener("keydown", handleEscapeClose);
		};
	}, []);

	useEffect(() => {
		let disposed = false;

		if (typeof window === "undefined") {
			setListenerStatus("error");
			setListenerMessage("Browser runtime unavailable.");
			return undefined;
		}

		const initializeSettings = async () => {
			const savedPanelHotkey = normalizePanelHotkeyValue(
				readPanelHotkey(window.localStorage),
			);
			const savedStartupLaunchEnabled = readStartupLaunchEnabled(
				window.localStorage,
			);
			setPanelHotkey(savedPanelHotkey);
			setPanelHotkeyDraft(savedPanelHotkey);
			setPasteMode(readPasteMode(window.localStorage));
			setStartupLaunchEnabled(savedStartupLaunchEnabled);

			if (!isDesktopRuntime()) {
				return;
			}

			try {
				const registeredHotkey =
					await registerDesktopPanelHotkey(savedPanelHotkey);
				if (disposed) {
					return;
				}

				const persistedHotkey = normalizePanelHotkeyValue(
					writePanelHotkey(window.localStorage, registeredHotkey),
				);
				setPanelHotkey(persistedHotkey);
				setPanelHotkeyDraft(persistedHotkey);
			} catch (error) {
				if (disposed) {
					return;
				}

				setActionMessage(
					`Global hotkey setup failed: ${toErrorMessage(error)}`,
				);
			}

			try {
				const runtimeStartupLaunchEnabled =
					await readDesktopStartupLaunchEnabled();
				if (disposed) {
					return;
				}

				const persistedStartupLaunchEnabled = writeStartupLaunchEnabled(
					window.localStorage,
					runtimeStartupLaunchEnabled,
				);
				setStartupLaunchEnabled(persistedStartupLaunchEnabled);
			} catch (error) {
				if (disposed) {
					return;
				}

				setActionMessage(
					`Startup launch status check failed: ${toErrorMessage(error)}`,
				);
			}
		};

		const historyRepository = new HistoryRepository({
			storage: createBrowserHistoryStorage(window.localStorage),
		});
		const snippetRepository = new SnippetRepository({
			storage: createBrowserSnippetsStorage(window.localStorage),
		});
		const clipboard = createClipboardPort();
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
				await initializeSettings();
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

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (panelView !== "menu") {
			return;
		}

		const handleMenuNavigation = (event: globalThis.KeyboardEvent) => {
			if (isEditableTarget(event.target)) {
				return;
			}

			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedMenuIndexes((current) => {
					const next = [...current];
					const entries = popupColumns[activeMenuDepth] ?? [];
					const currentIndex = next[activeMenuDepth] ?? 0;
					next[activeMenuDepth] = findNextSelectableIndex(
						entries,
						currentIndex,
						1,
					);
					return next;
				});
				return;
			}

			if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedMenuIndexes((current) => {
					const next = [...current];
					const entries = popupColumns[activeMenuDepth] ?? [];
					const currentIndex = next[activeMenuDepth] ?? 0;
					next[activeMenuDepth] = findNextSelectableIndex(
						entries,
						currentIndex,
						-1,
					);
					return next;
				});
				return;
			}

			if (event.key === "ArrowLeft") {
				if (menuPath.length === 0) {
					return;
				}
				event.preventDefault();
				setMenuPath((current) => current.slice(0, current.length - 1));
				setSelectedMenuIndexes((current) =>
					current.slice(0, Math.max(1, current.length - 1)),
				);
				return;
			}

			if (event.key !== "ArrowRight" && event.key !== "Enter") {
				return;
			}

			if (!activePopupEntry || !isPopupSelectableEntry(activePopupEntry)) {
				return;
			}

			event.preventDefault();
			void activatePopupEntryRef.current(
				activePopupEntry,
				activeMenuDepth,
				activeSelectedMenuIndex,
			);
		};

		window.addEventListener("keydown", handleMenuNavigation);
		return () => {
			window.removeEventListener("keydown", handleMenuNavigation);
		};
	}, [
		activeMenuDepth,
		activePopupEntry,
		activeSelectedMenuIndex,
		menuPath.length,
		panelView,
		popupColumns,
	]);

	useEffect(() => {
		void syncDesktopWindowSize(panelView, {
			popupPanelElement: popupPanelRef.current,
		});
	}, [panelView]);

	useEffect(() => {
		if (typeof window === "undefined" || panelView !== "menu") {
			return;
		}

		const panelElement = popupPanelRef.current;
		if (!panelElement || typeof ResizeObserver === "undefined") {
			return;
		}

		let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
		const observer = new ResizeObserver(() => {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			resizeTimeout = setTimeout(() => {
				void syncDesktopWindowSize("menu", {
					popupPanelElement: panelElement,
				});
			}, 50);
		});
		observer.observe(panelElement);

		return () => {
			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
			}
			observer.disconnect();
		};
	}, [panelView]);

	const handleSnippetSearchKeyDown = async (
		event: KeyboardEvent<HTMLInputElement>,
	) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setSelectedSnippetIndex((current) =>
				Math.min(current + 1, Math.max(0, filteredSnippetItems.length - 1)),
			);
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setSelectedSnippetIndex((current) => Math.max(current - 1, 0));
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			await pasteSelectedSnippet();
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

	const handleApplyPanelHotkey = async () => {
		if (typeof window === "undefined") {
			return;
		}

		const candidateHotkey = panelHotkeyDraft.trim();
		const normalizedCandidateHotkey = canonicalizePanelHotkey(candidateHotkey);
		if (normalizedCandidateHotkey.length === 0) {
			setActionMessage(
				"Shortcut cannot be empty. Use a format like CommandOrControl+Shift+V.",
			);
			return;
		}

		if (!isDesktopRuntime()) {
			const persisted = normalizePanelHotkeyValue(
				writePanelHotkey(window.localStorage, normalizedCandidateHotkey),
			);
			setPanelHotkey(persisted);
			setPanelHotkeyDraft(persisted);
			setActionMessage(
				"Shortcut saved in browser preview. Desktop runtime is required to activate global hotkey.",
			);
			return;
		}

		try {
			const registered = await registerDesktopPanelHotkey(
				normalizedCandidateHotkey,
			);
			const persisted = normalizePanelHotkeyValue(
				writePanelHotkey(window.localStorage, registered),
			);
			setPanelHotkey(persisted);
			setPanelHotkeyDraft(persisted);
			setActionMessage(
				`Panel hotkey updated to ${formatPanelHotkeyForDisplay(persisted)}.`,
			);
		} catch (error) {
			setActionMessage(`Panel hotkey update failed: ${toErrorMessage(error)}`);
		}
	};

	const handleChangePasteMode = (event: ChangeEvent<HTMLSelectElement>) => {
		if (typeof window === "undefined") {
			return;
		}

		const persisted = writePasteMode(
			window.localStorage,
			event.currentTarget.value,
		);
		setPasteMode(persisted);
		setActionMessage(
			persisted === PASTE_MODE_CLIPBOARD_ONLY
				? "Paste mode updated: clipboard only."
				: "Paste mode updated: direct paste with clipboard fallback.",
		);
	};

	const handleChangeStartupLaunch = async (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		if (typeof window === "undefined") {
			return;
		}

		const requestedEnabled = event.currentTarget.checked;

		if (!isDesktopRuntime()) {
			const persisted = writeStartupLaunchEnabled(
				window.localStorage,
				requestedEnabled,
			);
			setStartupLaunchEnabled(persisted);
			setActionMessage(
				"Startup launch preference saved in browser preview. Desktop runtime is required to configure OS login items.",
			);
			return;
		}

		try {
			const applied = await writeDesktopStartupLaunchEnabled(requestedEnabled);
			const persisted = writeStartupLaunchEnabled(window.localStorage, applied);
			setStartupLaunchEnabled(persisted);
			setActionMessage(
				persisted ? "Startup launch enabled." : "Startup launch disabled.",
			);
		} catch (error) {
			setActionMessage(
				`Startup launch update failed: ${toErrorMessage(error)}`,
			);
		}
	};

	const hidePanelAfterSuccess = async (hideAfterSuccess: boolean) => {
		if (!hideAfterSuccess || !isDesktopRuntime()) {
			return;
		}

		setPanelView("menu");
		setMenuPath([]);
		setSelectedMenuIndexes([0]);

		try {
			await hideDesktopPanelWindow();
		} catch (error) {
			setActionMessage(`Failed to close panel: ${toErrorMessage(error)}`);
		}
	};

	const pasteTextWithFallback = async ({
		text,
		directSuccessMessage,
		fallbackSuccessMessage,
		hideAfterSuccess = false,
	}: {
		text: string;
		directSuccessMessage: string;
		fallbackSuccessMessage: string;
		hideAfterSuccess?: boolean;
	}) => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		runtime.monitor.suppressText(text);

		if (!isDesktopRuntime()) {
			try {
				await runtime.clipboard.writeText(text);
				setActionMessage(fallbackSuccessMessage);
				await hidePanelAfterSuccess(hideAfterSuccess);
			} catch (error) {
				setActionMessage(`Copy failed: ${toErrorMessage(error)}`);
			}
			return;
		}

		if (pasteMode === PASTE_MODE_CLIPBOARD_ONLY) {
			try {
				await runtime.clipboard.writeText(text);
				setActionMessage(
					`Clipboard-only mode is active. ${fallbackSuccessMessage}`,
				);
				await hidePanelAfterSuccess(hideAfterSuccess);
			} catch (error) {
				setActionMessage(`Copy failed: ${toErrorMessage(error)}`);
			}
			return;
		}

		try {
			const result = await directPasteText(text);
			if (result.mode === "direct") {
				setActionMessage(
					result.message.trim().length > 0
						? result.message
						: directSuccessMessage,
				);
				await hidePanelAfterSuccess(hideAfterSuccess);
				return;
			}

			await runtime.clipboard.writeText(text);
			setActionMessage(
				result.message.trim().length > 0
					? result.message
					: fallbackSuccessMessage,
			);
			await hidePanelAfterSuccess(hideAfterSuccess);
		} catch (error) {
			try {
				await runtime.clipboard.writeText(text);
				setActionMessage(
					`Direct paste failed: ${toErrorMessage(
						error,
					)}. Text copied to clipboard instead.`,
				);
			} catch (clipboardError) {
				setActionMessage(
					`Paste failed: ${toErrorMessage(
						error,
					)}. Clipboard fallback also failed: ${toErrorMessage(clipboardError)}.`,
				);
			}
		}
	};

	const pasteSelectedSnippet = async () => {
		const selectedSnippet = filteredSnippetItems[selectedSnippetIndex];
		if (!selectedSnippet) {
			return;
		}

		await pasteTextWithFallback({
			text: selectedSnippet.text,
			directSuccessMessage: "Snippet pasted into active app.",
			fallbackSuccessMessage:
				"Direct paste unavailable. Snippet copied to clipboard.",
			hideAfterSuccess: false,
		});
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
		setPanelView("snippet-editor");
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

	const handleClearHistory = async () => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		if (historyItems.length === 0) {
			setActionMessage("当前没有可清除的历史记录。");
			return;
		}

		const shouldClear =
			typeof window === "undefined"
				? true
				: window.confirm("确认清除所有历史记录吗？");
		if (!shouldClear) {
			return;
		}

		await runtime.historyRepository.clearItems();
		setHistoryItems(runtime.historyRepository.getItems());
		setMenuPath([]);
		setSelectedMenuIndexes([0]);
		setActionMessage("历史记录已清除。");
	};

	const handleQuitApp = async () => {
		if (!isDesktopRuntime()) {
			setActionMessage("Browser preview cannot quit desktop app.");
			return;
		}

		try {
			await invoke("quit_app");
		} catch (error) {
			setActionMessage(`Failed to quit app: ${toErrorMessage(error)}`);
		}
	};

	const openPopupSubmenu = (
		entry: PopupMenuEntry,
		depth: number,
		index: number,
	) => {
		if (!isPopupSubmenuEntry(entry)) {
			return;
		}

		setMenuPath((current) => [...current.slice(0, depth), entry.id]);
		setSelectedMenuIndexes((current) => {
			const next = current.slice(0, depth + 2);
			next[depth] = index;
			next[depth + 1] = resolveSelectableIndex(entry.children, 0);
			return next;
		});
	};

	const activatePopupEntry = async (
		entry: PopupMenuEntry,
		depth: number,
		index: number,
	) => {
		if (!isPopupSelectableEntry(entry)) {
			return;
		}

		if (isPopupSubmenuEntry(entry)) {
			openPopupSubmenu(entry, depth, index);
			return;
		}

		if (entry.kind === "action") {
			if (entry.action === "clear-history") {
				await handleClearHistory();
				return;
			}

			if (entry.action === "edit-snippets") {
				setPanelView("snippet-editor");
				return;
			}

			if (entry.action === "open-preferences") {
				setPanelView("settings");
				return;
			}

			await handleQuitApp();
			return;
		}

		if (entry.kind === "history-item") {
			await pasteTextWithFallback({
				text: entry.text,
				directSuccessMessage: "Pasted selected history text into active app.",
				fallbackSuccessMessage:
					"Direct paste unavailable. Selected history text copied to clipboard.",
				hideAfterSuccess: true,
			});
			return;
		}

		if (entry.kind !== "snippet-item") {
			return;
		}

		await pasteTextWithFallback({
			text: entry.text,
			directSuccessMessage: "Snippet pasted into active app.",
			fallbackSuccessMessage:
				"Direct paste unavailable. Snippet copied to clipboard.",
			hideAfterSuccess: true,
		});
	};
	activatePopupEntryRef.current = activatePopupEntry;

	const handlePopupEntryHover = (
		entry: PopupMenuEntry,
		depth: number,
		index: number,
	) => {
		if (!isPopupSelectableEntry(entry)) {
			return;
		}

		if (isPopupSubmenuEntry(entry)) {
			openPopupSubmenu(entry, depth, index);
			return;
		}

		setMenuPath((current) => current.slice(0, depth));
		setSelectedMenuIndexes((current) => {
			const next = current.slice(0, depth + 1);
			next[depth] = index;
			return next;
		});
	};

	const renderPopupPanel = () => {
		return (
			<section
				className="popup-panel"
				ref={(element) => {
					popupPanelRef.current = element;
				}}
			>
				<div className="popup-columns">
					{popupColumns.map((entries, depth) => {
						return (
							<ul
								key={
									depth === 0
										? "popup-column-root"
										: `popup-column-${popupContext.path.slice(0, depth).join(".")}`
								}
								className="popup-list"
							>
								{entries.map((entry, index) => {
									if (entry.kind === "separator") {
										return (
											<li key={entry.id} className="popup-entry-separator" />
										);
									}

									if (entry.kind === "section") {
										return (
											<li key={entry.id} className="popup-entry-section">
												{entry.label}
											</li>
										);
									}

									if (entry.kind === "empty") {
										return (
											<li key={entry.id} className="popup-entry-empty">
												{entry.label}
											</li>
										);
									}

									const selected =
										isPopupSelectableEntry(entry) &&
										selectedMenuIndexes[depth] === index;
									const showFolderIcon =
										entry.kind === "submenu" || entry.kind === "snippet-item";

									return (
										<li key={entry.id}>
											<button
												type="button"
												className={`popup-entry popup-entry-${entry.kind} ${
													selected ? "selected" : ""
												}`}
												onMouseEnter={() => {
													handlePopupEntryHover(entry, depth, index);
												}}
												onFocus={() => {
													handlePopupEntryHover(entry, depth, index);
												}}
												onClick={() => {
													void activatePopupEntry(entry, depth, index);
												}}
											>
												<span className="popup-entry-main">
													{showFolderIcon ? (
														<span
															aria-hidden="true"
															className="popup-folder-icon"
														/>
													) : null}
													<span className="popup-entry-title">
														{entry.label}
													</span>
												</span>
												{entry.kind === "submenu" ? (
													<span className="popup-entry-chevron">›</span>
												) : null}
											</button>
										</li>
									);
								})}
							</ul>
						);
					})}
					{selectedSnippetPreview ? (
						<aside className="popup-preview-panel">
							{selectedSnippetPreview}
						</aside>
					) : null}
				</div>
			</section>
		);
	};

	const renderSnippetEditorPanel = () => {
		return (
			<section className="editor-panel">
				<div className="panel-title-row">
					<h2>Snippet Editor</h2>
					<button
						className="ghost-button"
						type="button"
						onClick={() => {
							setPanelView("menu");
							setMenuPath([]);
							setSelectedMenuIndexes([0]);
						}}
					>
						Back to Menu
					</button>
				</div>

				<label className="search-field" htmlFor="snippet-search">
					Search snippets
				</label>
				<input
					id="snippet-search"
					autoComplete="off"
					className="search-input"
					placeholder="Search snippets by title or text..."
					type="text"
					value={query}
					onChange={(event) => {
						setQuery(event.currentTarget.value);
						setSelectedSnippetIndex(0);
					}}
					onKeyDown={(event) => {
						void handleSnippetSearchKeyDown(event);
					}}
				/>

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
										{toClipboardPreview(item.text, 120)}
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
			</section>
		);
	};

	const renderSettingsPanel = () => {
		return (
			<section className="settings-panel">
				<div className="panel-title-row">
					<h2>Preferences</h2>
					<button
						className="ghost-button"
						type="button"
						onClick={() => {
							setPanelView("menu");
							setMenuPath([]);
							setSelectedMenuIndexes([0]);
						}}
					>
						Back to Menu
					</button>
				</div>

				<div className="settings-grid">
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
					<label className="paste-mode-field">
						Paste mode
						<select
							aria-label="Paste mode"
							className="search-input"
							value={pasteMode}
							onChange={handleChangePasteMode}
						>
							<option value={PASTE_MODE_DIRECT_WITH_FALLBACK}>
								Direct paste + clipboard fallback
							</option>
							<option value={PASTE_MODE_CLIPBOARD_ONLY}>Clipboard only</option>
						</select>
					</label>
					<label className="startup-launch-field">
						Launch on login
						<span className="startup-launch-row">
							<input
								aria-label="Launch on login"
								checked={startupLaunchEnabled}
								type="checkbox"
								onChange={(event) => {
									void handleChangeStartupLaunch(event);
								}}
							/>
							<span>{startupLaunchEnabled ? "Enabled" : "Disabled"}</span>
						</span>
					</label>
				</div>

				<label className="hotkey-field">
					Panel hotkey
					<div className="hotkey-row">
						<input
							aria-label="Panel hotkey"
							className="hotkey-input"
							placeholder="CommandOrControl+Shift+V"
							type="text"
							value={panelHotkeyDraftDisplay}
							onChange={(event) => {
								setPanelHotkeyDraft(
									canonicalizePanelHotkey(event.currentTarget.value),
								);
							}}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									void handleApplyPanelHotkey();
								}
							}}
						/>
						<button
							className="ghost-button"
							type="button"
							onClick={() => {
								void handleApplyPanelHotkey();
							}}
						>
							Apply
						</button>
					</div>
					<span className="hotkey-hint">
						Current: {formatPanelHotkeyForDisplay(panelHotkey)}
					</span>
					<span className="hotkey-hint">
						{isDesktopRuntime()
							? "Hotkey registration is active in desktop runtime."
							: "Browser preview only persists settings; desktop runtime is needed for global hotkey registration."}
					</span>
				</label>

				<p className="settings-note">
					{isDesktopRuntime()
						? "Startup launch changes apply to OS login items immediately."
						: "Browser preview only saves startup preference locally; desktop runtime is required to configure OS login items."}
				</p>
			</section>
		);
	};

	if (panelView === "menu") {
		return (
			<main className="popup-shell">
				{renderPopupPanel()}
				{actionMessage ? (
					<p className="popup-action-message">{actionMessage}</p>
				) : null}
			</main>
		);
	}

	return (
		<main className="app-shell app-shell-expanded">
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
			</header>

			{panelView === "snippet-editor"
				? renderSnippetEditorPanel()
				: renderSettingsPanel()}
			{actionMessage ? <p className="action-message">{actionMessage}</p> : null}
		</main>
	);
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof (error as { message?: unknown }).message === "string"
	) {
		const message = (error as { message: string }).message.trim();
		if (message.length > 0) {
			return message;
		}
	}

	if (typeof error === "string" && error.trim().length > 0) {
		return error;
	}

	return "Unexpected runtime error.";
}

function normalizePanelHotkeyValue(value: string): string {
	const normalized = canonicalizePanelHotkey(value);
	return normalized.length > 0 ? normalized : DEFAULT_PANEL_HOTKEY;
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) {
		return false;
	}

	const tagName = target.tagName.toLowerCase();
	return (
		tagName === "input" ||
		tagName === "textarea" ||
		tagName === "select" ||
		target.isContentEditable
	);
}

function isSameStringArray(left: string[], right: string[]): boolean {
	if (left.length !== right.length) {
		return false;
	}

	for (let index = 0; index < left.length; index += 1) {
		if (left[index] !== right[index]) {
			return false;
		}
	}

	return true;
}

function resolveSelectableIndex(
	entries: PopupMenuEntry[],
	preferredIndex: number,
): number {
	if (entries.length === 0) {
		return 0;
	}

	const clampedPreferredIndex = Math.max(
		0,
		Math.min(preferredIndex, entries.length - 1),
	);
	if (isPopupSelectableEntry(entries[clampedPreferredIndex])) {
		return clampedPreferredIndex;
	}

	const fallbackIndex = entries.findIndex((entry) =>
		isPopupSelectableEntry(entry),
	);
	return fallbackIndex >= 0 ? fallbackIndex : 0;
}

function findNextSelectableIndex(
	entries: PopupMenuEntry[],
	currentIndex: number,
	direction: 1 | -1,
): number {
	if (entries.length === 0) {
		return 0;
	}

	let nextIndex = Math.max(0, Math.min(currentIndex, entries.length - 1));
	for (let attempt = 0; attempt < entries.length; attempt += 1) {
		nextIndex += direction;
		if (nextIndex < 0 || nextIndex >= entries.length) {
			nextIndex = direction > 0 ? 0 : entries.length - 1;
		}

		if (isPopupSelectableEntry(entries[nextIndex])) {
			return nextIndex;
		}
	}

	return resolveSelectableIndex(entries, currentIndex);
}

async function syncDesktopWindowSize(
	panelView: PanelView,
	options?: {
		popupPanelElement: HTMLElement | null;
	},
): Promise<void> {
	if (!isDesktopRuntime()) {
		return;
	}

	try {
		const { LogicalSize, getCurrentWindow } = await import(
			"@tauri-apps/api/window"
		);
		const appWindow = getCurrentWindow();
		let nextSize =
			panelView === "menu" ? COMPACT_PANEL_SIZE : EXPANDED_PANEL_SIZE;
		if (panelView === "menu") {
			const panelElement = options?.popupPanelElement;
			if (panelElement) {
				const measuredWidth = Math.ceil(panelElement.scrollWidth);
				const measuredHeight = Math.ceil(panelElement.scrollHeight);
				if (measuredWidth > 0 && measuredHeight > 0) {
					nextSize = {
						width: clampNumber(measuredWidth + 2, 200, 1400),
						height: clampNumber(measuredHeight + 2, 200, 900),
					};
				}
			}
		}
		await appWindow.setSize(new LogicalSize(nextSize.width, nextSize.height));
	} catch (error) {
		console.warn("Window resize failed:", error);
	}
}

function clampNumber(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
