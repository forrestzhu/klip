import { DEFAULT_PANEL_HOTKEY } from "./hotkey.constants";

type HotkeyPlatform = "mac" | "windows" | "other";

interface DisplayToken {
	label: string;
	order: number;
	isModifier: boolean;
}

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
