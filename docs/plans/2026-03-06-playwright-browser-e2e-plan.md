# Klip 浏览器端 Playwright E2E 计划（v1）

- 日期: 2026-03-06
- 状态: `planning-ready`
- 目标: 在人工桌面验证前，先为浏览器运行时建立一层稳定的 Playwright E2E 回归基线。
- 优先级: 高
- 关联 PRD:
  - `docs/plans/2026-03-03-klip-prd.md`
  - `US-005` History 搜索与键盘导航
  - `US-007` Snippets 与文件夹 CRUD
  - `US-008` Snippets quick paste（浏览器可验证部分）
  - `US-010` Settings center（浏览器可验证部分）
  - `US-012` Regression baseline and automation

## 1. 目标与边界

### 1.1 目标
在浏览器运行时先验证前端可控交互，尽早发现 UI 回归、状态同步问题和键盘交互问题，降低后续人工桌面验证成本。

### 1.2 本阶段覆盖范围
1. 应用基础启动与主要视图渲染。
2. History / Snippets / Settings 的浏览器内交互流程。
3. Popup query mode、扁平化结果与 `;alias` 搜索。
4. Snippet / Folder 的基础 CRUD 与持久化。
5. Settings 读写与跨刷新恢复。

### 1.3 明确不覆盖的内容
1. 托盘、全局热键、独立窗口复用/聚焦。
2. Tauri 原生命令与 `invoke` 路径。
3. 原生 direct paste、开机启动、系统级权限行为。
4. Tauri 事件驱动剪贴板监听与 alias hotkey 事件。
5. macOS / Windows 前台应用焦点、隐藏/恢复、安装卸载等人工验证项。

## 2. 当前实现前提

1. 仓库已预留 `npm run test:e2e` 入口；当 `playwright.config.*` 和 `tests/e2e` 存在时会执行 Playwright，否则跳过。
2. 非桌面运行时时，应用会启用浏览器剪贴板实现与 inline 管理视图，适合先做浏览器 E2E。
3. 浏览器下剪贴板监听容易受权限和环境影响，因此首批用例优先通过种子数据、页面操作和 localStorage 恢复来验证，不把“真实系统剪贴板捕获”作为主断言。
4. 本机当前 Node 与仓库目标版本不一致，开始实施前应切换到 `.nvmrc` 指定的 Node 22。

## 3. 分阶段执行计划

## 3.1 阶段 A：搭建 Playwright 基线

### 输出
1. 增加 Playwright 依赖与配置文件。
2. 增加浏览器 E2E 目录结构与基础测试命令。
3. 配置本地 web server 启动方式，使 `npm run test:e2e` 可在本地和 CI 一致执行。

### 验收
1. `npm run test:e2e` 不再跳过。
2. 至少存在一个最小 smoke 用例并稳定通过。

## 3.2 阶段 B：补测试夹具与可测性支撑

### 输出
1. 为高频区域补充稳定选择器（优先 `data-testid` 或现有可访问名称）。
2. 提供浏览器端种子数据装载方式，避免测试依赖真实剪贴板权限。
3. 视需要增加测试辅助函数，如：
   - 初始化 localStorage
   - 快速创建 history/snippet 数据
   - 打开指定 panel view

### 验收
1. 用例不依赖脆弱 CSS 选择器。
2. 主要流程可通过测试夹具稳定进入目标状态。

## 3.3 阶段 C：首批高价值 E2E 场景

### 第一批建议场景
1. 应用启动后展示 menu，且可以切换到 inline `snippet-editor` / `settings` 视图。
2. History 查询与键盘导航可工作，空结果文案正确。
3. Snippet / Folder CRUD 在浏览器模式下可完成并持久化。
4. `;alias` 查询可命中 alias，未知 alias 显示空态。
5. Settings 修改后刷新仍保留。

### 第二批建议场景
1. Popup query mode 扁平化结果顺序。
2. 清空历史确认流。
3. Snippet alias 冲突提示与保存失败路径。
4. 模式切换快捷键或主要键盘操作链路。

### 验收
1. 首批覆盖至少 3 到 5 个高价值用户路径。
2. 失败截图、trace、视频等调试信息可用。

## 3.4 阶段 D：接入 QA 与状态沉淀

### 输出
1. 让 `npm run qa` 中的 `npm run test:e2e` 真正承担回归职责。
2. 视稳定性决定是否先限制浏览器数量为 Chromium。
3. 若 CI 运行时间或稳定性不足，先采用串行或单项目配置，再逐步扩展。

### 验收
1. 本地 `npm run test:e2e` 可稳定重复执行。
2. E2E 基线不会显著拖垮日常验证效率。

## 4. 推荐实现顺序

1. 只先支持 Chromium。
2. 先做 smoke + alias 查询 + settings 持久化。
3. 再补 snippets CRUD 和 history 键盘导航。
4. 最后再考虑更复杂的剪贴板相关浏览器断言。

## 5. 风险与应对

### 5.1 剪贴板权限不稳定
- 应对: 首批避免把真实 clipboard capture 作为主断言，优先做种子数据和 UI 驱动。

### 5.2 当前 UI 选择器不稳定
- 应对: 必要时补最少量 `data-testid`，只加在高价值交互节点。

### 5.3 Node 版本漂移
- 应对: 开始实施前切到 Node 22，并把验证结果记录进状态文档。

### 5.4 浏览器与桌面行为不一致
- 应对: 将浏览器 E2E 明确定位为“前端回归基线”，不替代 native/manual 验证。

## 6. 状态记录约定（必须执行）

每次完成一个实施迭代后，必须同步更新以下文件：

1. `docs/status/current.md`
   - 更新最新 commit
   - 更新当前 active scope
   - 更新 completed / in-progress / next focus
2. `docs/status/progress-log.md`
   - 追加一条按日期排序的迭代记录
   - 记录本次范围、关键改动、验证命令与结果
3. `docs/status/prd-tracker.md`
   - 更新 `US-005` / `US-007` / `US-008` / `US-010` / `US-012` 的证据
   - 明确哪些是“浏览器 E2E 已覆盖”，哪些仍需人工桌面验证

## 7. 本计划对应的下一步

1. 安装并配置 Playwright 基线。
2. 先落一个 smoke 用例，确保 `npm run test:e2e` 开始真正执行。
3. 再补 `;alias` 查询与 settings 持久化两条最小高价值回归。
