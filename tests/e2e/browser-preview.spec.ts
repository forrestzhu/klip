import { expect, test } from "@playwright/test";
import { PASTE_MODE_CLIPBOARD_ONLY } from "../../src/features/settings/pasteModeStorage";
import { DEFAULT_SNIPPETS_FOLDER_ID } from "../../src/features/snippets/snippet.constants";
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

test("clears history only after confirm acceptance", async ({ page }) => {
	await seedBrowserPreview(page, {
		historyItems: [
			{
				id: "history-clear-2",
				text: "Second clearable history item",
				createdAt: "2026-03-06T12:02:00.000Z",
				sourceApp: null,
			},
			{
				id: "history-clear-1",
				text: "First clearable history item",
				createdAt: "2026-03-06T12:01:00.000Z",
				sourceApp: null,
			},
		],
	});

	await page.goto("/");

	page.once("dialog", async (dialog) => {
		expect(dialog.type()).toBe("confirm");
		expect(dialog.message()).toBe("确认清除所有历史记录吗？");
		await dialog.dismiss();
	});

	await page.getByRole("button", { name: "清除历史" }).click();
	await expect(page.getByRole("button", { name: "1 - 2" })).toBeVisible();

	page.once("dialog", async (dialog) => {
		expect(dialog.type()).toBe("confirm");
		expect(dialog.message()).toBe("确认清除所有历史记录吗？");
		await dialog.accept();
	});

	await page.getByRole("button", { name: "清除历史" }).click();

	await expect(page.getByText("历史记录已清除。")).toBeVisible();
	await expect(page.getByText("暂无历史记录")).toBeVisible();
	await expect(page.getByRole("button", { name: "1 - 2" })).toHaveCount(0);
});

test("blocks snippet creation when alias conflicts with existing snippet", async ({
	page,
}) => {
	await seedBrowserPreview(page, {
		snippetItems: [
			{
				id: "snippet-existing-signature",
				title: "Team signature",
				alias: "sig",
				text: "Existing signature text",
				folderId: "folder-general",
				createdAt: "2026-03-06T12:00:00.000Z",
				updatedAt: "2026-03-06T12:00:00.000Z",
			},
		],
	});

	await page.goto("/");
	await page.getByRole("button", { name: "编辑片断..." }).click();

	await page.getByLabel("标题").fill("Another signature");
	await page.getByLabel("别名（可选）").fill("sig");
	await page.getByLabel("内容").fill("New conflicting signature");
	await page.getByRole("button", { name: "创建片断" }).click();

	await expect(
		page.getByText('Alias ;sig is already used by "Team signature".'),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Team signature/ }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Another signature/ }),
	).toHaveCount(0);
});

test("supports popup keyboard navigation across submenu open and close", async ({
	page,
}) => {
	await seedBrowserPreview(page, {
		historyItems: [
			{
				id: "history-keyboard-3",
				text: "Third keyboard history entry",
				createdAt: "2026-03-06T12:03:00.000Z",
				sourceApp: null,
			},
			{
				id: "history-keyboard-2",
				text: "Second keyboard history entry",
				createdAt: "2026-03-06T12:02:00.000Z",
				sourceApp: null,
			},
			{
				id: "history-keyboard-1",
				text: "First keyboard history entry",
				createdAt: "2026-03-06T12:01:00.000Z",
				sourceApp: null,
			},
		],
	});

	await page.goto("/");

	const popupSearch = page.getByRole("textbox", { name: "搜索历史和片断" });
	await page.getByRole("button", { name: "1 - 3" }).click();

	const firstHistoryButton = page.getByRole("button", {
		name: /1\. Third keyboard history entry/,
	});
	await expect(firstHistoryButton).toBeVisible();

	await popupSearch.focus();
	await popupSearch.press("ArrowLeft");
	await expect(firstHistoryButton).toHaveCount(0);

	await popupSearch.press("ArrowRight");
	await expect(
		page.getByRole("button", { name: /1\. Third keyboard history entry/ }),
	).toBeVisible();

	await popupSearch.press("ArrowDown");
	await popupSearch.press("Enter");

	await expect(
		page.getByText(
			"Direct paste unavailable. Selected history text copied to clipboard.",
		),
	).toBeVisible();
	await expect
		.poll(async () => readBrowserPreviewClipboard(page))
		.toBe("Second keyboard history entry");
});

test("supports folder create rename and delete flows in snippet editor", async ({
	page,
}) => {
	await seedBrowserPreview(page);

	await page.goto("/");
	await page.getByRole("button", { name: "编辑片断..." }).click();

	const folderNameInput = page.getByPlaceholder("文件夹名称");

	await folderNameInput.fill("Personal");
	await page.getByRole("button", { name: "添加文件夹" }).click();
	await expect(page.getByText("Folder ready: Personal.")).toBeVisible();

	await folderNameInput.fill("Work");
	await page.getByRole("button", { name: "重命名" }).click();
	await expect(page.getByText("Folder renamed to Work.")).toBeVisible();

	await page.getByLabel("归属文件夹").selectOption({ label: "Work" });
	await page.getByLabel("标题").fill("Folder move sample");
	await page
		.getByLabel("内容")
		.fill("Snippet that should move back to General");
	await page.getByRole("button", { name: "创建片断" }).click();

	await expect(page.getByText("Snippet created.")).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Folder move sample/ }),
	).toBeVisible();

	page.once("dialog", async (dialog) => {
		expect(dialog.type()).toBe("confirm");
		expect(dialog.message()).toBe(
			'Delete folder "Work" and move snippets to General?',
		);
		await dialog.accept();
	});

	await page.getByRole("button", { name: "删除文件夹" }).click();

	await expect(
		page.getByText("Folder deleted and snippets moved to General."),
	).toBeVisible();

	const snippetItem = page.getByRole("button", { name: /Folder move sample/ });
	await snippetItem.click();

	await expect(page.locator("#snippet-editor-folder")).toHaveValue(
		DEFAULT_SNIPPETS_FOLDER_ID,
	);
	await expect(page.getByText(/General ·/)).toBeVisible();
});

test("rejects invalid snippet alias input before save", async ({ page }) => {
	await seedBrowserPreview(page);

	await page.goto("/");
	await page.getByRole("button", { name: "编辑片断..." }).click();

	await page.getByLabel("标题").fill("Bad alias snippet");
	await page.getByLabel("别名（可选）").fill("!!!");
	await page.getByLabel("内容").fill("Should not be saved");
	await page.getByRole("button", { name: "创建片断" }).click();

	await expect(
		page.getByText("Invalid snippet alias. Use letters, numbers, '_' or '-'."),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Bad alias snippet/ }),
	).toHaveCount(0);
});

test("deletes selected snippet only after confirm acceptance", async ({
	page,
}) => {
	await seedBrowserPreview(page, {
		snippetItems: [
			{
				id: "snippet-delete-me",
				title: "Delete me",
				alias: "gone",
				text: "Temporary snippet text",
				folderId: DEFAULT_SNIPPETS_FOLDER_ID,
				createdAt: "2026-03-06T12:00:00.000Z",
				updatedAt: "2026-03-06T12:00:00.000Z",
			},
		],
	});

	await page.goto("/");
	await page.getByRole("button", { name: "编辑片断..." }).click();

	const snippetItem = page.getByRole("button", { name: /Delete me/ });
	await snippetItem.click();

	await expect(page.getByRole("heading", { name: "片断详情" })).toBeVisible();

	page.once("dialog", async (dialog) => {
		expect(dialog.type()).toBe("confirm");
		expect(dialog.message()).toBe('Delete snippet "Delete me"?');
		await dialog.dismiss();
	});

	await page.getByRole("button", { name: /^删除$/ }).click();
	await expect(snippetItem).toBeVisible();

	page.once("dialog", async (dialog) => {
		expect(dialog.type()).toBe("confirm");
		expect(dialog.message()).toBe('Delete snippet "Delete me"?');
		await dialog.accept();
	});

	await page.getByRole("button", { name: /^删除$/ }).click();

	await expect(page.getByText("Snippet deleted.")).toBeVisible();
	await expect(page.getByRole("button", { name: /Delete me/ })).toHaveCount(0);
	await expect(page.getByText("暂无片断。")).toBeVisible();
	await expect(page.getByRole("heading", { name: "新建片断" })).toBeVisible();
});

test("rejects folder rename when target name already exists", async ({
	page,
}) => {
	await seedBrowserPreview(page, {
		snippetFolders: [
			{
				id: "folder-work",
				name: "Work",
				createdAt: "2026-03-06T12:00:00.000Z",
				updatedAt: "2026-03-06T12:00:00.000Z",
			},
			{
				id: "folder-personal",
				name: "Personal",
				createdAt: "2026-03-06T12:01:00.000Z",
				updatedAt: "2026-03-06T12:01:00.000Z",
			},
		],
	});

	await page.goto("/");
	await page.getByRole("button", { name: "编辑片断..." }).click();

	await page.locator("#snippet-folder-select").selectOption("folder-work");
	await expect(page.locator("#snippet-editor-folder")).toHaveValue(
		"folder-work",
	);

	await page.getByPlaceholder("文件夹名称").fill("Personal");
	await page.getByRole("button", { name: "重命名" }).click();

	await expect(
		page.getByText("Folder rename failed. Name might conflict."),
	).toBeVisible();
	await expect(page.locator("#snippet-editor-folder")).toHaveValue(
		"folder-work",
	);
	await expect(
		page.locator('#snippet-editor-folder option[value="folder-work"]'),
	).toHaveText("Work");
	await expect(
		page.locator('#snippet-editor-folder option[value="folder-personal"]'),
	).toHaveText("Personal");
});

test("shows popup message when clear history is triggered on empty history", async ({
	page,
}) => {
	await seedBrowserPreview(page);

	await page.goto("/");
	await page.getByRole("button", { name: "清除历史" }).click();

	await expect(page.getByText("当前没有可清除的历史记录。")).toBeVisible();
	await expect(page.getByText("暂无历史记录")).toBeVisible();
	await expect(
		page.getByRole("textbox", { name: "搜索历史和片断" }),
	).toBeVisible();
});

test("keeps browser preview alive when quit action is triggered", async ({
	page,
}) => {
	await seedBrowserPreview(page);

	await page.goto("/");
	await page.getByRole("button", { name: "退出 Klip" }).click();

	await expect(
		page.getByText("Browser preview cannot quit desktop app."),
	).toBeVisible();
	await expect(
		page.getByRole("textbox", { name: "搜索历史和片断" }),
	).toBeVisible();
});
