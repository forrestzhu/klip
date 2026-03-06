import { expect, test } from "@playwright/test";
import { PASTE_MODE_CLIPBOARD_ONLY } from "../../src/features/settings/pasteModeStorage";
import { readBrowserPreviewClipboard, seedBrowserPreview } from "./fixtures";

test("renders popup menu and opens inline management views in browser preview", async ({
	page,
}) => {
	await seedBrowserPreview(page);

	await page.goto("/");

	await expect(
		page.getByRole("textbox", { name: "搜索历史和片断" }),
	).toBeVisible();
	await expect(page.getByRole("button", { name: "编辑片断..." })).toBeVisible();
	await expect(page.getByRole("button", { name: "偏好设置..." })).toBeVisible();

	await page.getByRole("button", { name: "编辑片断..." }).click();
	await expect(page.getByRole("heading", { name: "新建片断" })).toBeVisible();
	await expect(page.getByRole("button", { name: "返回菜单" })).toBeVisible();

	await page.getByRole("button", { name: "返回菜单" }).click();
	await expect(
		page.getByRole("textbox", { name: "搜索历史和片断" }),
	).toBeVisible();

	await page.getByRole("button", { name: "偏好设置..." }).click();
	await expect(page.getByRole("tab", { name: "通用" })).toBeVisible();
	await expect(page.getByRole("heading", { name: "行为" })).toBeVisible();
});

test("supports history query search and enter-to-copy in browser preview", async ({
	page,
}) => {
	await seedBrowserPreview(page, {
		historyItems: [
			{
				id: "history-beta",
				text: "Beta history entry",
				createdAt: "2026-03-06T12:01:00.000Z",
				sourceApp: null,
			},
			{
				id: "history-alpha",
				text: "Alpha history entry",
				createdAt: "2026-03-06T12:00:00.000Z",
				sourceApp: null,
			},
		],
	});

	await page.goto("/");

	const popupSearch = page.getByRole("textbox", { name: "搜索历史和片断" });
	await popupSearch.fill("beta");

	await expect(
		page.getByRole("button", { name: /Beta history entry/ }),
	).toBeVisible();

	await popupSearch.press("Enter");

	await expect(
		page.getByText(
			"Direct paste unavailable. Selected history text copied to clipboard.",
		),
	).toBeVisible();
	await expect
		.poll(async () => readBrowserPreviewClipboard(page))
		.toBe("Beta history entry");

	await popupSearch.fill("missing");
	await expect(page.getByText("未找到匹配的历史记录")).toBeVisible();
});

test("creates a snippet, resolves ;alias query, and copies snippet text", async ({
	page,
}) => {
	await seedBrowserPreview(page);

	await page.goto("/");
	await page.getByRole("button", { name: "编辑片断..." }).click();

	await page.getByLabel("标题").fill("Email signature");
	await page.getByLabel("别名（可选）").fill("sig");
	await page.getByLabel("内容").fill("Best regards,\nKlip");
	await page.getByRole("button", { name: "创建片断" }).click();

	await expect(page.getByText("Snippet created.")).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Email signature/ }),
	).toBeVisible();

	await page.getByRole("button", { name: "返回菜单" }).click();

	const popupSearch = page.getByRole("textbox", { name: "搜索历史和片断" });
	await popupSearch.fill(";sig");

	await expect(
		page.getByRole("button", { name: /Email signature/ }),
	).toBeVisible();

	await popupSearch.press("Enter");

	await expect(
		page.getByText("Direct paste unavailable. Snippet copied to clipboard."),
	).toBeVisible();
	await expect
		.poll(async () => readBrowserPreviewClipboard(page))
		.toBe("Best regards,\nKlip");

	await popupSearch.fill(";missing");
	await expect(page.getByText("未找到匹配的片断")).toBeVisible();
});

test("persists browser settings changes across reloads", async ({ page }) => {
	await seedBrowserPreview(page);

	await page.goto("/");
	await page.getByRole("button", { name: "偏好设置..." }).click();

	await page.getByRole("tab", { name: "菜单" }).click();
	const maxHistoryItemsInput = page.getByLabel("Max history items");
	await maxHistoryItemsInput.fill("42");
	await expect(maxHistoryItemsInput).toHaveValue("42");

	await page.getByRole("tab", { name: "通用" }).click();
	await page.getByLabel("Paste mode").selectOption(PASTE_MODE_CLIPBOARD_ONLY);
	await expect(page.getByLabel("Paste mode")).toHaveValue(
		PASTE_MODE_CLIPBOARD_ONLY,
	);

	await page.reload();
	await page.getByRole("button", { name: "偏好设置..." }).click();

	await page.getByRole("tab", { name: "菜单" }).click();
	await expect(page.getByLabel("Max history items")).toHaveValue("42");

	await page.getByRole("tab", { name: "通用" }).click();
	await expect(page.getByLabel("Paste mode")).toHaveValue(
		PASTE_MODE_CLIPBOARD_ONLY,
	);
});
