/**
 * Hotkey Display Module
 *
 * Provides utilities for formatting and displaying keyboard shortcuts
 * in a platform-specific manner.
 *
 * @module hotkeyDisplay
 */

import { DEFAULT_PANEL_HOTKEY } from "./hotkey.constants";

/**
 * The platform type for hotkey display.
 * - `mac`: macOS-specific formatting
 * - `windows`: Windows-specific formatting
 * - `other`: Generic formatting for other platforms
 */
type HotkeyPlatform = "mac" | "windows" | "other";

/**
 * A token representing a hotkey component.
 * Contains the display label, rendering order, and whether it's a modifier key.
 */
interface DisplayToken {
	/** The user-friendly label for the token */
	label: string;
	/** Rendering order (modifiers are rendered first) */
	order: number;
	/** Whether this token represents a modifier key (Ctrl, Cmd, Shift, Alt) */
	isModifier: boolean;
}

/**
 * Format a hotkey string for display in a platform-appropriate format.
 *
 * This function normalizes the hotkey string, extracts individual keys and modifiers,
 * and formats them according to the target platform. Modifiers are sorted and
 * rendered in a consistent order.
 *
 * @param value - The hotkey string to format (e.g., "CommandOrControl+Shift+V")
 * @param platform - The target platform for formatting (default: auto-detected)
 * @returns A formatted hotkey string suitable for display
 *
 * @example
 * ```ts
 * // macOS
 * formatPanelHotkeyForDisplay("CommandOrControl+Shift+V", "mac");
 * // "Cmd+Shift+V"
 *
 * // Windows
 * formatPanelHotkeyForDisplay("CommandOrControl+Shift+V", "windows");
 * // "Ctrl+Shift+V"
 *
 * // Auto-detect platform
 * formatPanelHotkeyForDisplay("Ctrl+Shift+V");
 * // "Ctrl+Shift+V" (or "Cmd+Shift+V" on macOS)
 * ```
 */
export function formatPanelHotkeyForDisplay(
	value: string,
	platform: HotkeyPlatform = detectPlatform(),
): string {
	const normalized =
		value.trim().length > 0 ? value.trim() : DEFAULT_PANEL_HOTKEY;
	const parts = normalized
		.split("+")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
	if (parts.length === 0) {
		return DEFAULT_PANEL_HOTKEY;
	}

	const modifiers: DisplayToken[] = [];
	const keys: DisplayToken[] = [];
	parts.forEach((part, index) => {
		const token = toDisplayToken(part, platform);
		if (token.isModifier) {
			modifiers.push({ ...token, order: token.order + index / 1000 });
			return;
		}
		keys.push(token);
	});

	modifiers.sort((a, b) => a.order - b.order);
	return [...modifiers, ...keys].map((token) => token.label).join("+");
}

/**
 * Detect the current platform.
 *
 * Determines the operating system based on the browser's navigator.platform value.
 *
 * @returns The detected platform type
 *
 * @private
 */
function detectPlatform(): HotkeyPlatform {
	if (typeof navigator === "undefined") {
		return "other";
	}

	const platform = navigator.platform.toLowerCase();
	if (platform.includes("mac")) {
		return "mac";
	}
	if (platform.includes("win")) {
		return "windows";
	}
	return "other";
}

/**
 * Convert a raw hotkey token to a display token.
 *
 * Maps internal hotkey tokens to platform-specific display labels.
 * Handles common key names and modifier keys.
 *
 * @param value - The raw hotkey token
 * @param platform - The target platform for label selection
 * @returns A display token with label and metadata
 *
 * @private
 */
function toDisplayToken(value: string, platform: HotkeyPlatform): DisplayToken {
	const normalized = value.toLowerCase();

	if (normalized === "commandorcontrol") {
		return {
			label: platform === "mac" ? "Cmd" : "Ctrl",
			order: 1,
			isModifier: true,
		};
	}

	if (
		normalized === "super" ||
		normalized === "meta" ||
		normalized === "command"
	) {
		return {
			label: platform === "mac" ? "Cmd" : "Win",
			order: 1,
			isModifier: true,
		};
	}

	if (normalized === "control" || normalized === "ctrl") {
		return { label: "Ctrl", order: 1, isModifier: true };
	}

	if (normalized === "shift") {
		return { label: "Shift", order: 2, isModifier: true };
	}

	if (normalized === "alt" || normalized === "option") {
		return {
			label: platform === "mac" ? "Option" : "Alt",
			order: 3,
			isModifier: true,
		};
	}

	return { label: normalizeKeyLabel(value), order: 99, isModifier: false };
}

/**
 * Normalize a raw key label to a standard display format.
 *
 * Converts special key names (like "arrowup", "space", etc.) to their
 * display equivalents. Also handles "keyX" and "digitX" patterns.
 *
 * @param value - The raw key label to normalize
 * @returns A normalized key label
 *
 * @private
 */
function normalizeKeyLabel(value: string): string {
	const normalized = value.trim();
	const lowered = normalized.toLowerCase();

	if (/^key[a-z]$/.test(lowered)) {
		return lowered.slice(3).toUpperCase();
	}

	if (/^digit[0-9]$/.test(lowered)) {
		return lowered.slice(5);
	}

	if (lowered === "arrowup") {
		return "Up";
	}
	if (lowered === "arrowdown") {
		return "Down";
	}
	if (lowered === "arrowleft") {
		return "Left";
	}
	if (lowered === "arrowright") {
		return "Right";
	}
	if (lowered === "space") {
		return "Space";
	}
	if (/^[a-z]$/.test(lowered)) {
		return lowered.toUpperCase();
	}

	return normalized;
}
