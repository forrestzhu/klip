import { describe, expect, it } from "vitest";
import {
	DEFAULT_PANEL_HOTKEY,
	formatPanelHotkeyForDisplay,
} from "../src/features/settings";

describe("panel hotkey display", () => {
	it("renders commandorcontrol hotkey in mac format", () => {
		expect(formatPanelHotkeyForDisplay("CommandOrControl+Shift+V", "mac")).toBe(
			"Cmd+Shift+V",
		);
	});

	it("renders commandorcontrol hotkey in windows format", () => {
		expect(
			formatPanelHotkeyForDisplay("CommandOrControl+Shift+V", "windows"),
		).toBe("Ctrl+Shift+V");
	});

	it("renders tauri normalized hotkey in readable order", () => {
		expect(formatPanelHotkeyForDisplay("shift+super+KeyK", "mac")).toBe(
			"Cmd+Shift+K",
		);
	});

	it("falls back to default hotkey for empty input", () => {
		expect(formatPanelHotkeyForDisplay("   ", "mac")).toBe("Cmd+Shift+V");
		expect(DEFAULT_PANEL_HOTKEY).toBe("CommandOrControl+Shift+V");
	});
});
