/**
 * Klip Application Root Component
 *
 * Main application component that orchestrates clipboard history management,
 * snippet handling, and user interface interactions.
 *
 * Features:
 * - Clipboard history panel with keyboard shortcut activation
 * - Snippet management with folder organization
 * - Direct paste feedback and mode switching
 * - Build commit info display
 * - Tauri desktop integration
 *
 * @module App
 */

import { invoke } from "@tauri-apps/api/core";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BUILD_COMMIT_LABEL } from "./features/build/buildInfo";
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
import {
	directPasteText,
	shouldHidePanelAfterDirectPaste,
} from "./features/paste";
import {
	canonicalizePanelHotkey,
	DEFAULT_PANEL_HOTKEY,
	DEFAULT_PASTE_MODE,
	DEFAULT_SNIPPET_ALIAS_HOTKEY,
	DEFAULT_STARTUP_LAUNCH_ENABLED,
	formatPanelHotkeyForDisplay,
	hideDesktopPanelWindow,
	isDesktopRuntime,
	openDesktopPreferencesWindow,
	openDesktopSnippetEditorWindow,
	PASTE_MODE_CLIPBOARD_ONLY,
	PASTE_MODE_DIRECT_WITH_FALLBACK,
	type PasteMode,
	readDesktopStartupLaunchEnabled,
	readPanelHotkey,
	readPasteMode,
	readSnippetAliasHotkey,
	readStartupLaunchEnabled,
	registerDesktopPanelHotkey,
	registerDesktopSnippetAliasHotkey,
	SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT,
	writeDesktopStartupLaunchEnabled,
	writePanelHotkey,
	writePasteMode,
	writeSnippetAliasHotkey,
	writeStartupLaunchEnabled,
} from "./features/settings";
import {
	createBrowserSnippetsStorage,
	DEFAULT_SNIPPETS_FOLDER_ID,
	normalizeSnippetAlias,
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
type WindowRole = "main" | "snippet-editor" | "preferences";
type PreferencesTab =
	| "general"
	| "menu"
	| "types"
	| "exclude"
	| "hotkey"
	| "update"
	| "beta";

const ALL_SNIPPET_FOLDERS_VALUE = "__all_folders__";
const COMPACT_PANEL_SIZE = { width: 340, height: 720 };
const EXPANDED_PANEL_SIZE = { width: 1024, height: 720 };
const WINDOW_ROLE_QUERY_KEY = "window";
const CLIPBOARD_TYPE_TAB_OPTIONS = [
	{ id: "plain-text", label: "纯文本" },
	{ id: "rich-text", label: "多信息文本格式 (RTF)" },
	{ id: "rich-text-doc", label: "多信息文本格式 (RTFD)" },
	{ id: "pdf", label: "PDF" },
	{ id: "file-name", label: "文件名" },
	{ id: "url", label: "URL" },
	{ id: "tiff-image", label: "TIFF 图像" },
] as const;
const PREFERENCES_TABS: Array<{
	id: PreferencesTab;
	label: string;
	icon: string;
}> = [
	{ id: "general", label: "通用", icon: "◍" },
	{ id: "menu", label: "菜单", icon: "≡" },
	{ id: "types", label: "类型", icon: "◻" },
	{ id: "exclude", label: "排除", icon: "⊘" },
	{ id: "hotkey", label: "快捷键", icon: "⌘" },
	{ id: "update", label: "更新", icon: "↻" },
	{ id: "beta", label: "Beta测试", icon: "β" },
];
const EXCLUDE_PLACEHOLDER_ROWS = [
	"exclude-row-1",
	"exclude-row-2",
	"exclude-row-3",
	"exclude-row-4",
	"exclude-row-5",
	"exclude-row-6",
	"exclude-row-7",
	"exclude-row-8",
];

export function App() {
	const windowRole = useMemo(resolveWindowRole, []);
	const isMainPopupWindow = windowRole === "main";
	const supportsInlineManagementViews =
		!isDesktopRuntime() && isMainPopupWindow;
	const initialPanelView =
		windowRole === "snippet-editor"
			? "snippet-editor"
			: windowRole === "preferences"
				? "settings"
				: "menu";

	const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
	const [maxItems, setMaxItems] = useState(200);
	const [panelHotkey, setPanelHotkey] = useState(DEFAULT_PANEL_HOTKEY);
	const [panelHotkeyDraft, setPanelHotkeyDraft] =
		useState(DEFAULT_PANEL_HOTKEY);
	const [snippetAliasHotkey, setSnippetAliasHotkey] = useState(
		DEFAULT_SNIPPET_ALIAS_HOTKEY,
	);
	const [snippetAliasHotkeyDraft, setSnippetAliasHotkeyDraft] = useState(
		DEFAULT_SNIPPET_ALIAS_HOTKEY,
	);
	const [pasteMode, setPasteMode] = useState<PasteMode>(DEFAULT_PASTE_MODE);
	const [startupLaunchEnabled, setStartupLaunchEnabled] = useState(
		DEFAULT_STARTUP_LAUNCH_ENABLED,
	);
	const [snippetFolders, setSnippetFolders] = useState<SnippetFolder[]>([]);
	const [snippetItems, setSnippetItems] = useState<SnippetItem[]>([]);
	const [selectedSnippetFolderId, setSelectedSnippetFolderId] = useState(
		ALL_SNIPPET_FOLDERS_VALUE,
	);
	const [snippetQuery, setSnippetQuery] = useState("");
	const [popupQuery, setPopupQuery] = useState("");
	const [selectedSnippetIndex, setSelectedSnippetIndex] = useState(0);
	const [panelView, setPanelView] = useState<PanelView>(initialPanelView);
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
	const [snippetAliasDraft, setSnippetAliasDraft] = useState("");
	const [snippetTextDraft, setSnippetTextDraft] = useState("");
	const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
	const [popupStableColumnHeight, setPopupStableColumnHeight] = useState<
		number | null
	>(null);
	const [preferencesTab, setPreferencesTab] =
		useState<PreferencesTab>("general");
	const [supportedClipboardTypes, setSupportedClipboardTypes] = useState<
		Record<string, boolean>
	>(() =>
		CLIPBOARD_TYPE_TAB_OPTIONS.reduce<Record<string, boolean>>(
			(accumulator, option) => {
				accumulator[option.id] = true;
				return accumulator;
			},
			{},
		),
	);
	const [autoCheckUpdates, setAutoCheckUpdates] = useState(true);
	const [updateSchedule, setUpdateSchedule] = useState("weekly");
	const [lastUpdateCheckAt, setLastUpdateCheckAt] = useState(() =>
		new Date().toLocaleString(),
	);
	const [historyStats, setHistoryStats] = useState<{
		totalCount: number;
		uniqueCount: number;
		withSourceAppCount: number;
		oldestTimestampMs: number | null;
		newestTimestampMs: number | null;
	} | null>(null);

	const runtimeRef = useRef<RuntimeContext | null>(null);
	const popupPanelRef = useRef<HTMLElement | null>(null);
	const popupSearchInputRef = useRef<HTMLInputElement | null>(null);
	const activatePopupEntryRef = useRef<
		(entry: PopupMenuEntry, depth: number, index: number) => Promise<void>
	>(async () => {});
	const panelHotkeyDraftDisplay = canonicalizePanelHotkey(panelHotkeyDraft);
	const snippetAliasHotkeyDraftDisplay = canonicalizePanelHotkey(
		snippetAliasHotkeyDraft,
	);
	const canReturnToPopupMenu = supportsInlineManagementViews;

	const filteredSnippetItems = useMemo(() => {
		const keyword = snippetQuery.trim().toLowerCase();
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
				(item.alias ?? "").toLowerCase().includes(keyword) ||
				item.title.toLowerCase().includes(keyword) ||
				item.text.toLowerCase().includes(keyword)
			);
		});
	}, [selectedSnippetFolderId, snippetItems, snippetQuery]);

	const folderNameById = useMemo(() => {
		return new Map(snippetFolders.map((folder) => [folder.id, folder.name]));
	}, [snippetFolders]);

	const popupRootEntries = useMemo(() => {
		return buildPopupMenuRootEntries({
			historyItems,
			snippetFolders,
			snippetItems,
			query: popupQuery,
		});
	}, [historyItems, popupQuery, snippetFolders, snippetItems]);

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
	const selectedSnippetItem =
		filteredSnippetItems[selectedSnippetIndex] ?? null;
	const popupRootEntryCount = popupRootEntries.length;

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
		if (typeof document === "undefined" || !isMainPopupWindow) {
			return;
		}

		const handleVisibilityChange = () => {
			if (document.visibilityState !== "hidden") {
				return;
			}
			setPanelView("menu");
			setPopupQuery("");
			setMenuPath([]);
			setSelectedMenuIndexes([0]);
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [isMainPopupWindow]);

	useEffect(() => {
		if (typeof window === "undefined" || !isMainPopupWindow) {
			return;
		}

		const handleEscapeClose = (event: globalThis.KeyboardEvent) => {
			if (event.key !== "Escape" || !isDesktopRuntime()) {
				return;
			}

			event.preventDefault();
			setPanelView("menu");
			setPopupQuery("");
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
	}, [isMainPopupWindow]);

	useEffect(() => {
		if (!isMainPopupWindow || !isDesktopRuntime()) {
			return;
		}

		let disposed = false;
		let unlisten: (() => void) | null = null;

		const registerSnippetAliasListener = async () => {
			const { getCurrentWindow } = await import("@tauri-apps/api/window");
			unlisten = await getCurrentWindow().listen(
				SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT,
				() => {
					setPanelView("menu");
					setPopupQuery(";");
					setMenuPath([]);
					setSelectedMenuIndexes([0]);

					setTimeout(() => {
						if (disposed) {
							return;
						}

						const inputElement = popupSearchInputRef.current;
						if (!inputElement) {
							return;
						}

						inputElement.focus();
						const cursorPosition = inputElement.value.length;
						inputElement.setSelectionRange(cursorPosition, cursorPosition);
					}, 0);
				},
			);
		};

		void registerSnippetAliasListener().catch((error) => {
			if (disposed) {
				return;
			}
			setActionMessage(
				`Snippet alias hotkey listener setup failed: ${toErrorMessage(error)}`,
			);
		});

		return () => {
			disposed = true;
			if (unlisten) {
				unlisten();
			}
		};
	}, [isMainPopupWindow]);

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
			const savedSnippetAliasHotkey = normalizeOptionalHotkeyValue(
				readSnippetAliasHotkey(window.localStorage),
			);
			const savedStartupLaunchEnabled = readStartupLaunchEnabled(
				window.localStorage,
			);
			setPanelHotkey(savedPanelHotkey);
			setPanelHotkeyDraft(savedPanelHotkey);
			setSnippetAliasHotkey(savedSnippetAliasHotkey);
			setSnippetAliasHotkeyDraft(savedSnippetAliasHotkey);
			setPasteMode(readPasteMode(window.localStorage));
			setStartupLaunchEnabled(savedStartupLaunchEnabled);

			if (isDesktopRuntime() && isMainPopupWindow) {
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
					const registeredSnippetAliasHotkey =
						await registerDesktopSnippetAliasHotkey(savedSnippetAliasHotkey);
					if (disposed) {
						return;
					}

					const persistedSnippetAliasHotkey = normalizeOptionalHotkeyValue(
						writeSnippetAliasHotkey(
							window.localStorage,
							registeredSnippetAliasHotkey,
						),
					);
					setSnippetAliasHotkey(persistedSnippetAliasHotkey);
					setSnippetAliasHotkeyDraft(persistedSnippetAliasHotkey);
				} catch (error) {
					if (disposed) {
						return;
					}

					setActionMessage(
						`Snippet alias hotkey setup failed: ${toErrorMessage(error)}`,
					);
				}
			}

			if (!isDesktopRuntime()) {
				return;
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
			subscribeChanges: clipboard.subscribeChanges,
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
				setListenerMessage(
					isMainPopupWindow
						? "Starting clipboard listener..."
						: "Loading window state...",
				);
				await initializeSettings();
				await Promise.all([historyRepository.load(), snippetRepository.load()]);
				refreshAll();
				if (isMainPopupWindow) {
					monitor.start();
					await monitor.whenReady();
				}

				if (disposed) {
					return;
				}

				setListenerStatus("ready");
				setListenerMessage(
					isMainPopupWindow
						? "Clipboard listener is ready."
						: "Window state is ready.",
				);
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
	}, [isMainPopupWindow]);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const syncWindowStateFromStorage = async () => {
			const runtime = runtimeRef.current;
			if (!runtime) {
				return;
			}

			await Promise.all([
				runtime.historyRepository.load(),
				runtime.snippetRepository.load(),
			]);
			setHistoryItems(runtime.historyRepository.getItems());
			setMaxItems(runtime.historyRepository.getMaxItems());
			setSnippetItems(runtime.snippetRepository.getSnippets());
			setSnippetFolders(runtime.snippetRepository.getFolders());

			const persistedPanelHotkey = normalizePanelHotkeyValue(
				readPanelHotkey(window.localStorage),
			);
			const persistedSnippetAliasHotkey = normalizeOptionalHotkeyValue(
				readSnippetAliasHotkey(window.localStorage),
			);
			setPanelHotkey(persistedPanelHotkey);
			setPanelHotkeyDraft(persistedPanelHotkey);
			setSnippetAliasHotkey(persistedSnippetAliasHotkey);
			setSnippetAliasHotkeyDraft(persistedSnippetAliasHotkey);
			setPasteMode(readPasteMode(window.localStorage));
			setStartupLaunchEnabled(readStartupLaunchEnabled(window.localStorage));
		};

		const handleFocus = () => {
			void syncWindowStateFromStorage().catch((error) => {
				setActionMessage(`Window sync failed: ${toErrorMessage(error)}`);
			});
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState !== "visible") {
				return;
			}
			handleFocus();
		};

		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
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
		if (!isMainPopupWindow) {
			return;
		}

		void syncDesktopWindowSize(panelView, {
			popupPanelElement: popupPanelRef.current,
		});
	}, [isMainPopupWindow, panelView]);

	useEffect(() => {
		if (panelView !== "menu") {
			setPopupStableColumnHeight(null);
		}
	}, [panelView]);

	useEffect(() => {
		if (panelView !== "menu") {
			return;
		}
		if (popupRootEntryCount === 0) {
			return;
		}

		const panelElement = popupPanelRef.current;
		if (!panelElement) {
			return;
		}

		const measureStableRootColumnHeight = () => {
			const rootColumn = panelElement.querySelector<HTMLElement>(".popup-list");
			if (!rootColumn) {
				return;
			}

			const measuredHeight = Math.ceil(rootColumn.scrollHeight);
			if (measuredHeight <= 0) {
				return;
			}

			const boundedHeight = clampNumber(measuredHeight, 260, 760);
			setPopupStableColumnHeight((current) => {
				if (current === null) {
					return boundedHeight;
				}
				return Math.max(current, boundedHeight);
			});
		};

		measureStableRootColumnHeight();
		const timer = setTimeout(measureStableRootColumnHeight, 0);

		return () => {
			clearTimeout(timer);
		};
	}, [panelView, popupRootEntryCount]);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!isMainPopupWindow ||
			panelView !== "menu"
		) {
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
	}, [isMainPopupWindow, panelView]);

	const handleSnippetSearchKeyDown = (
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
			const selectedSnippet = filteredSnippetItems[selectedSnippetIndex];
			if (!selectedSnippet) {
				return;
			}
			handleEditSnippet(selectedSnippet);
		}
	};

	const handlePopupSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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

	const fetchHistoryStats = useCallback(async () => {
		if (!isDesktopRuntime()) {
			// Browser fallback: calculate from local items
			const uniqueTexts = new Set(historyItems.map((item) => item.text));
			const withSourceApp = historyItems.filter(
				(item) => item.sourceApp !== null,
			);
			setHistoryStats({
				totalCount: historyItems.length,
				uniqueCount: uniqueTexts.size,
				withSourceAppCount: withSourceApp.length,
				oldestTimestampMs:
					historyItems.length > 0
						? new Date(
								historyItems[historyItems.length - 1].createdAt,
							).getTime()
						: null,
				newestTimestampMs:
					historyItems.length > 0
						? new Date(historyItems[0].createdAt).getTime()
						: null,
			});
			return;
		}

		try {
			const stats = await invoke<{
				totalCount: number;
				uniqueCount: number;
				withSourceAppCount: number;
				oldestTimestampMs: number | null;
				newestTimestampMs: number | null;
			}>("get_history_stats", { limit: maxItems });
			setHistoryStats(stats);
		} catch (error) {
			console.error("Failed to fetch history stats:", error);
			setActionMessage(
				`Failed to fetch history stats: ${toErrorMessage(error)}`,
			);
		}
	}, [historyItems, maxItems]);

	// Update history stats when history items change
	useEffect(() => {
		void fetchHistoryStats();
	}, [fetchHistoryStats]);

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

	const handleApplySnippetAliasHotkey = async () => {
		if (typeof window === "undefined") {
			return;
		}

		const normalizedCandidateHotkey = canonicalizePanelHotkey(
			snippetAliasHotkeyDraft,
		);
		if (!isDesktopRuntime()) {
			const persisted = normalizeOptionalHotkeyValue(
				writeSnippetAliasHotkey(window.localStorage, normalizedCandidateHotkey),
			);
			setSnippetAliasHotkey(persisted);
			setSnippetAliasHotkeyDraft(persisted);
			setActionMessage(
				persisted.length === 0
					? "Snippet alias hotkey disabled in browser preview."
					: "Snippet alias hotkey saved in browser preview. Desktop runtime is required to activate global hotkey.",
			);
			return;
		}

		try {
			const registered = await registerDesktopSnippetAliasHotkey(
				normalizedCandidateHotkey,
			);
			const persisted = normalizeOptionalHotkeyValue(
				writeSnippetAliasHotkey(window.localStorage, registered),
			);
			setSnippetAliasHotkey(persisted);
			setSnippetAliasHotkeyDraft(persisted);
			setActionMessage(
				persisted.length === 0
					? "Snippet alias hotkey disabled."
					: `Snippet alias hotkey updated to ${formatPanelHotkeyForDisplay(
							persisted,
						)}.`,
			);
		} catch (error) {
			setActionMessage(
				`Snippet alias hotkey update failed: ${toErrorMessage(error)}`,
			);
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
			await hidePanelAfterSuccess(
				hideAfterSuccess && shouldHidePanelAfterDirectPaste(result.mode),
			);
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

	const handleSaveSnippet = async () => {
		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		const hasAliasInput = snippetAliasDraft.trim().length > 0;
		const normalizedAlias = normalizeSnippetAlias(snippetAliasDraft);
		if (hasAliasInput && normalizedAlias === null) {
			setActionMessage(
				"Invalid snippet alias. Use letters, numbers, '_' or '-'.",
			);
			return;
		}
		if (normalizedAlias !== null) {
			const aliasConflict = snippetItems.find((snippet) => {
				return (
					(snippet.alias ?? null) === normalizedAlias &&
					snippet.id !== editingSnippetId
				);
			});
			if (aliasConflict) {
				setActionMessage(
					`Alias ;${normalizedAlias} is already used by "${aliasConflict.title}".`,
				);
				return;
			}
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
				alias: snippetAliasDraft,
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
				alias: snippetAliasDraft,
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
		setSnippetAliasDraft("");
		setSnippetTextDraft("");
		setEditingSnippetId(null);
	};

	const handleEditSnippet = (snippet: SnippetItem) => {
		setPanelView("snippet-editor");
		setEditingSnippetId(snippet.id);
		setSnippetTitleDraft(snippet.title);
		setSnippetAliasDraft(snippet.alias ?? "");
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
			setSnippetAliasDraft("");
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
				if (supportsInlineManagementViews) {
					setPanelView("snippet-editor");
					return;
				}

				try {
					await openDesktopSnippetEditorWindow();
				} catch (error) {
					setActionMessage(
						`Failed to open snippet editor: ${toErrorMessage(error)}`,
					);
				}
				return;
			}

			if (entry.action === "open-preferences") {
				if (supportsInlineManagementViews) {
					setPanelView("settings");
					return;
				}

				try {
					await openDesktopPreferencesWindow();
				} catch (error) {
					setActionMessage(
						`Failed to open preferences: ${toErrorMessage(error)}`,
					);
				}
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
		const popupColumnStyle =
			popupStableColumnHeight === null
				? undefined
				: {
						height: `${popupStableColumnHeight}px`,
					};

		return (
			<section
				className="popup-panel"
				ref={(element) => {
					popupPanelRef.current = element;
				}}
			>
				<div className="popup-search-row">
					<input
						aria-label="搜索历史和片断"
						autoComplete="off"
						className="popup-search-input"
						placeholder="搜索历史和片断（;别名）..."
						ref={popupSearchInputRef}
						type="text"
						value={popupQuery}
						onChange={(event) => {
							setPopupQuery(event.currentTarget.value);
							setMenuPath([]);
							setSelectedMenuIndexes([0]);
						}}
						onKeyDown={(event) => {
							void handlePopupSearchKeyDown(event);
						}}
					/>
				</div>
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
								style={popupColumnStyle}
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
						<aside className="popup-preview-panel" style={popupColumnStyle}>
							{selectedSnippetPreview}
						</aside>
					) : null}
				</div>
			</section>
		);
	};

	const handleBackToPopupMenu = () => {
		setPanelView("menu");
		setMenuPath([]);
		setSelectedMenuIndexes([0]);
	};

	const renderBackToMenuButton = () => {
		if (!canReturnToPopupMenu) {
			return null;
		}

		return (
			<button
				className="clipy-subtle-link"
				type="button"
				onClick={handleBackToPopupMenu}
			>
				返回菜单
			</button>
		);
	};

	const renderSnippetEditorPanel = () => {
		return (
			<section className="clipy-editor-window">
				<div
					className="clipy-editor-toolbar"
					role="toolbar"
					aria-label="Snippet tools"
				>
					<button
						type="button"
						className="clipy-toolbar-button"
						onClick={() => {
							setEditingSnippetId(null);
							setSnippetTitleDraft("");
							setSnippetAliasDraft("");
							setSnippetTextDraft("");
						}}
					>
						<span aria-hidden="true" className="clipy-toolbar-icon">
							＋
						</span>
						<span>添加片断</span>
					</button>
					<button
						type="button"
						className="clipy-toolbar-button"
						onClick={() => {
							void handleAddFolder();
						}}
					>
						<span aria-hidden="true" className="clipy-toolbar-icon">
							▣
						</span>
						<span>添加文件夹</span>
					</button>
					<button
						type="button"
						className="clipy-toolbar-button"
						onClick={() => {
							if (selectedSnippetItem) {
								void handleDeleteSnippet(selectedSnippetItem);
								return;
							}
							if (selectedSnippetFolderId !== ALL_SNIPPET_FOLDERS_VALUE) {
								void handleDeleteFolder();
								return;
							}
							setActionMessage("请先选中一个片断或文件夹。");
						}}
					>
						<span aria-hidden="true" className="clipy-toolbar-icon">
							−
						</span>
						<span>删除</span>
					</button>
					<button
						type="button"
						className="clipy-toolbar-button"
						onClick={() => {
							setActionMessage("启用/禁用将在后续迭代接入。");
						}}
					>
						<span aria-hidden="true" className="clipy-toolbar-icon">
							◉
						</span>
						<span>启用/禁用</span>
					</button>
					<button
						type="button"
						className="clipy-toolbar-button"
						onClick={() => {
							setActionMessage("导入将在后续迭代接入。");
						}}
					>
						<span aria-hidden="true" className="clipy-toolbar-icon">
							↓
						</span>
						<span>导入</span>
					</button>
					<button
						type="button"
						className="clipy-toolbar-button"
						onClick={() => {
							setActionMessage("导出将在后续迭代接入。");
						}}
					>
						<span aria-hidden="true" className="clipy-toolbar-icon">
							↑
						</span>
						<span>导出</span>
					</button>
					{renderBackToMenuButton()}
				</div>

				<div className="clipy-editor-layout">
					<aside className="clipy-editor-sidebar">
						<label className="clipy-field-label" htmlFor="snippet-search">
							搜索片断
						</label>
						<input
							id="snippet-search"
							autoComplete="off"
							className="clipy-input"
							placeholder="按标题、内容或 ;别名 搜索..."
							type="text"
							value={snippetQuery}
							onChange={(event) => {
								setSnippetQuery(event.currentTarget.value);
								setSelectedSnippetIndex(0);
							}}
							onKeyDown={(event) => {
								void handleSnippetSearchKeyDown(event);
							}}
						/>

						<label
							className="clipy-field-label"
							htmlFor="snippet-folder-select"
						>
							文件夹
						</label>
						<select
							id="snippet-folder-select"
							className="clipy-input clipy-select"
							value={selectedSnippetFolderId}
							onChange={(event) => {
								setSelectedSnippetFolderId(event.currentTarget.value);
								setSelectedSnippetIndex(0);
							}}
						>
							<option value={ALL_SNIPPET_FOLDERS_VALUE}>全部文件夹</option>
							{snippetFolders.map((folder) => (
								<option key={folder.id} value={folder.id}>
									{folder.name}
								</option>
							))}
						</select>

						<div className="clipy-folder-draft-row">
							<input
								className="clipy-input"
								placeholder="文件夹名称"
								type="text"
								value={folderNameDraft}
								onChange={(event) => {
									setFolderNameDraft(event.currentTarget.value);
								}}
							/>
							<div className="clipy-inline-actions">
								<button
									className="clipy-inline-button"
									type="button"
									onClick={() => {
										void handleRenameFolder();
									}}
								>
									重命名
								</button>
								<button
									className="clipy-inline-button danger"
									type="button"
									onClick={() => {
										void handleDeleteFolder();
									}}
								>
									删除文件夹
								</button>
							</div>
						</div>

						<ul className="clipy-snippet-list" aria-label="Snippet list">
							{filteredSnippetItems.length === 0 ? (
								<li className="clipy-empty-row">暂无片断。</li>
							) : (
								filteredSnippetItems.map((item, index) => (
									<li key={item.id}>
										<button
											type="button"
											className={`clipy-snippet-list-item ${
												index === selectedSnippetIndex ? "selected" : ""
											}`}
											onClick={() => {
												setSelectedSnippetIndex(index);
												handleEditSnippet(item);
											}}
										>
											<div className="clipy-snippet-title">{item.title}</div>
											<div className="clipy-snippet-meta">
												{item.alias ? `;${item.alias} · ` : ""}
												{folderNameById.get(item.folderId) ?? "General"} ·{" "}
												{new Date(item.updatedAt).toLocaleString()}
											</div>
											<div className="clipy-snippet-preview">
												{toClipboardPreview(item.text, 80)}
											</div>
										</button>
									</li>
								))
							)}
						</ul>
					</aside>

					<section className="clipy-editor-detail">
						<h3>{editingSnippetId === null ? "新建片断" : "片断详情"}</h3>
						<label
							className="clipy-field-label"
							htmlFor="snippet-editor-folder"
						>
							归属文件夹
						</label>
						<select
							id="snippet-editor-folder"
							className="clipy-input clipy-select"
							value={selectedSnippetFolderId}
							onChange={(event) => {
								setSelectedSnippetFolderId(event.currentTarget.value);
							}}
						>
							<option value={ALL_SNIPPET_FOLDERS_VALUE}>General</option>
							{snippetFolders.map((folder) => (
								<option key={folder.id} value={folder.id}>
									{folder.name}
								</option>
							))}
						</select>

						<label className="clipy-field-label" htmlFor="snippet-title-input">
							标题
						</label>
						<input
							id="snippet-title-input"
							className="clipy-input"
							placeholder="片断标题（可选）"
							type="text"
							value={snippetTitleDraft}
							onChange={(event) => {
								setSnippetTitleDraft(event.currentTarget.value);
							}}
						/>

						<label className="clipy-field-label" htmlFor="snippet-alias-input">
							别名（可选）
						</label>
						<input
							id="snippet-alias-input"
							className="clipy-input"
							placeholder="例如：sig（可用 ;sig 快速搜索）"
							type="text"
							value={snippetAliasDraft}
							onChange={(event) => {
								setSnippetAliasDraft(event.currentTarget.value);
							}}
						/>

						<label className="clipy-field-label" htmlFor="snippet-text-input">
							内容
						</label>
						<textarea
							id="snippet-text-input"
							className="clipy-textarea"
							placeholder="输入片断内容"
							value={snippetTextDraft}
							onChange={(event) => {
								setSnippetTextDraft(event.currentTarget.value);
							}}
						/>

						<div className="clipy-detail-actions">
							<button
								className="clipy-primary-button"
								type="button"
								onClick={() => {
									void handleSaveSnippet();
								}}
							>
								{editingSnippetId === null ? "创建片断" : "保存修改"}
							</button>
							<button
								className="clipy-secondary-button"
								type="button"
								onClick={() => {
									setEditingSnippetId(null);
									setSnippetTitleDraft("");
									setSnippetAliasDraft("");
									setSnippetTextDraft("");
								}}
							>
								清空
							</button>
							{selectedSnippetItem ? (
								<button
									className="clipy-secondary-button"
									type="button"
									onClick={() => {
										void pasteTextWithFallback({
											text: selectedSnippetItem.text,
											directSuccessMessage: "片断已粘贴到前台应用。",
											fallbackSuccessMessage:
												"直接粘贴不可用，已复制到剪贴板。",
										});
									}}
								>
									粘贴选中
								</button>
							) : null}
						</div>
					</section>
				</div>
			</section>
		);
	};

	const renderSettingsPanel = () => {
		return (
			<section className="clipy-preferences-window">
				<div
					className="clipy-preferences-tabs"
					role="tablist"
					aria-label="Preferences tabs"
				>
					{PREFERENCES_TABS.map((tab) => {
						const active = preferencesTab === tab.id;
						return (
							<button
								key={tab.id}
								role="tab"
								aria-selected={active}
								type="button"
								className={`clipy-preferences-tab ${active ? "active" : ""}`}
								onClick={() => {
									setPreferencesTab(tab.id);
								}}
							>
								<span className="clipy-preferences-tab-icon" aria-hidden="true">
									{tab.icon}
								</span>
								<span>{tab.label}</span>
							</button>
						);
					})}
				</div>
				{renderBackToMenuButton()}

				<div className="clipy-preferences-content">
					{preferencesTab === "general" ? (
						<section className="clipy-preferences-section">
							<h3>行为</h3>
							<label className="clipy-checkbox-row">
								<input
									aria-label="Launch on login"
									checked={startupLaunchEnabled}
									type="checkbox"
									onChange={(event) => {
										void handleChangeStartupLaunch(event);
									}}
								/>
								<span>登录时打开</span>
							</label>
							<label className="clipy-form-row">
								<span>选中菜单项后输入：</span>
								<select
									aria-label="Paste mode"
									className="clipy-input clipy-select clipy-compact-input"
									value={pasteMode}
									onChange={handleChangePasteMode}
								>
									<option value={PASTE_MODE_DIRECT_WITH_FALLBACK}>
										直接粘贴（失败回退剪贴板）
									</option>
									<option value={PASTE_MODE_CLIPBOARD_ONLY}>
										仅复制到剪贴板
									</option>
								</select>
							</label>
							<p className="clipy-inline-note">
								{isDesktopRuntime()
									? "桌面运行时下将即时应用系统登录项设置。"
									: "浏览器预览模式仅保存本地偏好，不会修改系统登录项。"}
							</p>
						</section>
					) : null}

					{preferencesTab === "general" ? (
						<section className="clipy-preferences-section">
							<h3>历史记录统计</h3>
							{historyStats ? (
								<div className="clipy-stats-grid">
									<div className="clipy-stat-item">
										<span className="clipy-stat-label">总条目数</span>
										<span className="clipy-stat-value">
											{historyStats.totalCount}
										</span>
									</div>
									<div className="clipy-stat-item">
										<span className="clipy-stat-label">唯一条目数</span>
										<span className="clipy-stat-value">
											{historyStats.uniqueCount}
										</span>
									</div>
									<div className="clipy-stat-item">
										<span className="clipy-stat-label">带来源应用</span>
										<span className="clipy-stat-value">
											{historyStats.withSourceAppCount}
										</span>
									</div>
									<div className="clipy-stat-item">
										<span className="clipy-stat-label">最早记录</span>
										<span className="clipy-stat-value clipy-stat-timestamp">
											{historyStats.oldestTimestampMs
												? new Date(
														historyStats.oldestTimestampMs,
													).toLocaleString()
												: "无"}
										</span>
									</div>
									<div className="clipy-stat-item">
										<span className="clipy-stat-label">最新记录</span>
										<span className="clipy-stat-value clipy-stat-timestamp">
											{historyStats.newestTimestampMs
												? new Date(
														historyStats.newestTimestampMs,
													).toLocaleString()
												: "无"}
										</span>
									</div>
								</div>
							) : (
								<p className="clipy-inline-note">正在加载统计数据...</p>
							)}
							<button
								type="button"
								className="clipy-secondary-button"
								onClick={() => {
									void fetchHistoryStats();
								}}
							>
								刷新统计
							</button>
						</section>
					) : null}

					{preferencesTab === "menu" ? (
						<section className="clipy-preferences-section">
							<h3>菜单</h3>
							<label className="clipy-form-row">
								<span>最大剪贴板历史：</span>
								<input
									aria-label="Max history items"
									min={10}
									max={5000}
									className="clipy-input clipy-number-input"
									type="number"
									value={maxItems}
									onChange={(event) => {
										void handleChangeMaxItems(event);
									}}
								/>
								<span>项</span>
							</label>
							<p className="clipy-inline-note">
								历史项按最近使用顺序展示，达到上限后将按 FIFO 淘汰。
							</p>
						</section>
					) : null}

					{preferencesTab === "types" ? (
						<section className="clipy-preferences-section">
							<h3>类型</h3>
							<div className="clipy-types-panel">
								{CLIPBOARD_TYPE_TAB_OPTIONS.map((option) => (
									<label key={option.id} className="clipy-checkbox-row">
										<input
											type="checkbox"
											checked={supportedClipboardTypes[option.id] ?? false}
											onChange={(event) => {
												setSupportedClipboardTypes((current) => ({
													...current,
													[option.id]: event.currentTarget.checked,
												}));
											}}
										/>
										<span>{option.label}</span>
									</label>
								))}
							</div>
						</section>
					) : null}

					{preferencesTab === "exclude" ? (
						<section className="clipy-preferences-section">
							<h3>排除这些程序：</h3>
							<div className="clipy-empty-table">
								{EXCLUDE_PLACEHOLDER_ROWS.map((rowKey) => (
									<div key={rowKey} className="clipy-empty-table-row" />
								))}
							</div>
							<div className="clipy-table-actions">
								<button type="button" className="clipy-secondary-button">
									+
								</button>
								<button type="button" className="clipy-secondary-button">
									−
								</button>
							</div>
						</section>
					) : null}

					{preferencesTab === "hotkey" ? (
						<section className="clipy-preferences-section">
							<h3>快捷键</h3>
							<label className="clipy-form-row">
								<span>主体：</span>
								<input
									aria-label="Panel hotkey"
									className="clipy-input clipy-hotkey-input"
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
									className="clipy-primary-button"
									type="button"
									onClick={() => {
										void handleApplyPanelHotkey();
									}}
								>
									应用
								</button>
							</label>
							<p className="clipy-inline-note">
								当前快捷键：{formatPanelHotkeyForDisplay(panelHotkey)}
							</p>
							<label className="clipy-form-row">
								<span>片断别名：</span>
								<input
									aria-label="Snippet alias hotkey"
									className="clipy-input clipy-hotkey-input"
									placeholder="留空表示禁用（例如 CommandOrControl+Shift+;）"
									type="text"
									value={snippetAliasHotkeyDraftDisplay}
									onChange={(event) => {
										setSnippetAliasHotkeyDraft(
											canonicalizePanelHotkey(event.currentTarget.value),
										);
									}}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											void handleApplySnippetAliasHotkey();
										}
									}}
								/>
								<button
									className="clipy-primary-button"
									type="button"
									onClick={() => {
										void handleApplySnippetAliasHotkey();
									}}
								>
									应用
								</button>
							</label>
							<p className="clipy-inline-note">
								片断别名快捷键：
								{snippetAliasHotkey.length > 0
									? formatPanelHotkeyForDisplay(snippetAliasHotkey)
									: "已禁用"}
							</p>
							<p className="clipy-inline-note">
								触发后会打开弹窗并预填 `;`，可直接输入别名检索片断。
							</p>
							<p className="clipy-inline-note">
								{isDesktopRuntime()
									? "桌面运行时中全局快捷键注册已启用。"
									: "浏览器预览模式仅持久化快捷键字符串，不会注册系统热键。"}
							</p>
						</section>
					) : null}

					{preferencesTab === "update" ? (
						<section className="clipy-preferences-section">
							<h3>更新</h3>
							<label className="clipy-checkbox-row">
								<input
									type="checkbox"
									checked={autoCheckUpdates}
									onChange={(event) => {
										setAutoCheckUpdates(event.currentTarget.checked);
									}}
								/>
								<span>自动检查更新</span>
							</label>
							<label className="clipy-form-row">
								<span>检查频率：</span>
								<select
									className="clipy-input clipy-select clipy-compact-input"
									value={updateSchedule}
									onChange={(event) => {
										setUpdateSchedule(event.currentTarget.value);
									}}
								>
									<option value="daily">每天</option>
									<option value="weekly">每周</option>
									<option value="monthly">每月</option>
								</select>
							</label>
							<button
								type="button"
								className="clipy-primary-button clipy-check-update-button"
								onClick={() => {
									setLastUpdateCheckAt(new Date().toLocaleString());
									setActionMessage("已执行更新检查（当前为本地示意流程）。");
								}}
							>
								现在检查
							</button>
							<p className="clipy-inline-note">
								最近检查时间：{lastUpdateCheckAt}
							</p>
							<p className="clipy-inline-note">当前版本：v0.1.0</p>
						</section>
					) : null}

					{preferencesTab === "beta" ? (
						<section className="clipy-preferences-section">
							<h3>Beta测试</h3>
							<p className="clipy-inline-note">
								该分区将用于后续实验功能开关与灰度发布策略。
							</p>
						</section>
					) : null}
				</div>
				<p className="clipy-preferences-build-info">{BUILD_COMMIT_LABEL}</p>
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

	const showInlineTopbar = canReturnToPopupMenu;
	const shellClassName = showInlineTopbar
		? "app-shell app-shell-expanded"
		: "app-shell clipy-management-shell";

	return (
		<main className={shellClassName}>
			{showInlineTopbar ? (
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
			) : null}

			{panelView === "snippet-editor"
				? renderSnippetEditorPanel()
				: renderSettingsPanel()}
			{actionMessage ? <p className="action-message">{actionMessage}</p> : null}
		</main>
	);
}

function resolveWindowRole(): WindowRole {
	if (typeof window === "undefined") {
		return "main";
	}

	const searchParams = new URLSearchParams(window.location.search);
	const requestedRole = searchParams.get(WINDOW_ROLE_QUERY_KEY);
	if (requestedRole === "snippet-editor") {
		return "snippet-editor";
	}
	if (requestedRole === "preferences") {
		return "preferences";
	}

	return "main";
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

function normalizeOptionalHotkeyValue(value: string): string {
	return canonicalizePanelHotkey(value);
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
				const panelRect = panelElement.getBoundingClientRect();
				const measuredWidth = Math.ceil(panelRect.width);
				const measuredHeight = Math.ceil(panelRect.height);
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
