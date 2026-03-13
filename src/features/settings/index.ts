/**
 * Settings Feature Module
 *
 * Public API for the settings feature. Provides hotkey management,
 * paste mode configuration, and startup launch settings.
 *
 * @module settings
 */

export {
	DEFAULT_PANEL_HOTKEY,
	DEFAULT_SNIPPET_ALIAS_HOTKEY,
	PANEL_HOTKEY_STORAGE_KEY,
	SNIPPET_ALIAS_HOTKEY_STORAGE_KEY,
	SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT,
} from "./hotkey.constants";
export { formatPanelHotkeyForDisplay } from "./hotkeyDisplay";
export {
	hideDesktopPanelWindow,
	isDesktopRuntime,
	openDesktopPreferencesWindow,
	openDesktopSnippetEditorWindow,
	registerDesktopPanelHotkey,
	registerDesktopSnippetAliasHotkey,
} from "./hotkeyRuntime";
export {
	canonicalizePanelHotkey,
	readPanelHotkey,
	readSnippetAliasHotkey,
	writePanelHotkey,
	writeSnippetAliasHotkey,
} from "./hotkeyStorage";
export {
	DEFAULT_PASTE_MODE,
	PASTE_MODE_CLIPBOARD_ONLY,
	PASTE_MODE_DIRECT_WITH_FALLBACK,
	PASTE_MODE_STORAGE_KEY,
	type PasteMode,
	readPasteMode,
	writePasteMode,
} from "./pasteModeStorage";
export {
	readDesktopStartupLaunchEnabled,
	writeDesktopStartupLaunchEnabled,
} from "./startupLaunchRuntime";
export {
	DEFAULT_STARTUP_LAUNCH_ENABLED,
	readStartupLaunchEnabled,
	STARTUP_LAUNCH_STORAGE_KEY,
	writeStartupLaunchEnabled,
} from "./startupLaunchStorage";
