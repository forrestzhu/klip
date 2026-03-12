/**
 * Desktop Smoke Tests
 *
 * Basic tests to verify Klip desktop application works
 */

import { expect, test } from "@playwright/test";
import {
	getWindowTitle,
	hideWindow,
	isWindowVisible,
	showWindowViaHotkey,
	waitForApp,
} from "./utils";

test.describe("Klip Desktop Smoke Tests", () => {
	test.beforeAll(async () => {
		// Wait for app to be ready
		await waitForApp(10000);
	});

	test("app should start and have correct title", async () => {
		const title = await getWindowTitle();
		expect(title).toContain("Klip");
	});

	test("window should be visible by default", async () => {
		const visible = await isWindowVisible();
		expect(visible).toBe(true);
	});

	test("should be able to hide and show window", async () => {
		// Hide window
		await hideWindow();
		let visible = await isWindowVisible();
		expect(visible).toBe(false);

		// Show window
		await showWindowViaHotkey();
		visible = await isWindowVisible();
		expect(visible).toBe(true);
	});

	test("tray icon should be visible", async () => {
		const trayVisible = await isTrayVisible();
		expect(trayVisible).toBe(true);
	});
});
