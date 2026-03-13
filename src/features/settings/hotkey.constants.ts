/**
 * Hotkey Constants
 *
 * Configuration constants for keyboard shortcuts in the Klip application.
 */

/** Default hotkey for opening the panel (Command+Shift+V on Mac, Ctrl+Shift+V on Windows) */
export const DEFAULT_PANEL_HOTKEY = "CommandOrControl+Shift+V";

/** Storage key for the panel hotkey setting */
export const PANEL_HOTKEY_STORAGE_KEY = "klip.settings.panelHotkey";

/** Default hotkey for snippet alias trigger (empty = disabled) */
export const DEFAULT_SNIPPET_ALIAS_HOTKEY = "";

/** Storage key for the snippet alias hotkey setting */
export const SNIPPET_ALIAS_HOTKEY_STORAGE_KEY =
	"klip.settings.snippetAliasHotkey";

/** Custom event name for snippet alias hotkey trigger */
export const SNIPPET_ALIAS_HOTKEY_TRIGGER_EVENT =
	"klip://snippet-alias-hotkey-triggered";
