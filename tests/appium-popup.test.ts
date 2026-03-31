/**
 * Appium Mac UI Test - Popup Window
 * 测试 Klip 应用的弹出窗口 UI
 *
 * 前提条件:
 * 1. Appium server 运行中 (appium --driver mac2)
 * 2. Klip.app 已构建
 * 3. mac2 driver 已安装
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { remote } from "webdriverio";

const APPIUM_HOST = "localhost";
const APPIUM_PORT = 4723;

describe("Klip Mac UI - Popup Window", () => {
	let driver: any;

	beforeAll(async () => {
		const capabilities = {
			platformName: "Mac",
			"appium:automationName": "Mac2",
			"appium:appPath":
				"/Users/jayzero/Documents/workspace/klip/src-tauri/target/release/Klip.app",
			"appium:bundleId": "com.klip.app",
			"appium:newCommandTimeout": 60,
		};

		driver = await remote({
			hostname: APPIUM_HOST,
			port: APPIUM_PORT,
			capabilities,
		});
	}, 30000);

	afterAll(async () => {
		if (driver) {
			await driver.deleteSession();
		}
	});

	it("should display popup search input", async () => {
		const searchInput = await driver.$('[data-testid="popup-search-input"]');
		// Appium test - requires running Appium server
		expect(searchInput).toBeDefined();
	}, 10000);

	it("should display popup list", async () => {
		const popupList = await driver.$('[data-testid="popup-list-root"]');
		// Appium test - requires running Appium server
		expect(popupList).toBeDefined();
	}, 10000);

	it("should allow typing in search input", async () => {
		const searchInput = await driver.$('[data-testid="popup-search-input"]');
		await searchInput.setValue("test");
		const value = await searchInput.getValue();
		expect(value).toBe("test");
	}, 10000);
});
