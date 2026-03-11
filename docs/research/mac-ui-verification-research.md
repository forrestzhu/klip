# macOS UI 自动化测试方案研究

- 日期：2026-03-11
- 项目：Klip（Tauri 2 + React + Rust）
- 研究范围：`XCUITest`、`Appium for Mac`（实际为 `Appium Mac2 Driver`）、`Playwright for Desktop Apps`

## 背景结论

Klip 当前已经有一套浏览器预览态的 `Playwright` 回归测试，但待补齐的高风险场景主要在 macOS 原生壳层：

- 菜单栏/托盘入口
- 全局热键唤起
- 面板显示/隐藏与焦点恢复
- 直接粘贴到前台应用
- 权限缺失时的错误反馈

截至 2026-03-11，官方资料显示：

- Apple 的 `XCUITest/XCUIAutomation` 原生支持 macOS UI 自动化。
- `Appium Mac2 Driver` 底层依赖 `XCTest`，本质上是在 Apple UI 测试能力外包了一层 WebDriver/Appium 协议。
- Playwright 官方“桌面应用”支持目前仍聚焦 `Electron`，且文档标注为 experimental；同时 Tauri 官方文档明确写着 macOS 目前没有 desktop WebDriver client。

基于这些边界，可以推断：**对 Tauri macOS 桌面应用，Playwright 不能承担原生 UI 验证主方案；最合适的主方案是 XCUITest，Playwright 保留在 Web/UI 逻辑回归层。**

## 1) 各方案优缺点

### 对比表

| 方案 | 能覆盖什么 | 优点 | 缺点 | 对 Klip 的适配度 |
| --- | --- | --- | --- | --- |
| `XCUITest` | macOS 原生窗口、控件、可访问性树、跨应用交互 | Apple 第一方；和 macOS 行为最贴近；无额外协议层；适合验证焦点、窗口生命周期、权限反馈等原生行为 | 需要 Xcode/Swift 测试栈；仅限 Apple 平台；对菜单栏项、全局热键这类系统行为通常仍需测试辅助钩子 | 高 |
| `Appium Mac2` | macOS 原生应用 UI，支持通过 bundle id 启动/激活应用 | 可以继续用 JS/TS + WebDriver 生态；适合 Node 团队；支持启动/切换其他应用 | 额外引入 Appium Server/Driver/Xcode Helper；底层仍是 XCTest；README 明确一次只能跑一个 UI test；部分手势/动作受 macOS API 限制 | 中 |
| `Playwright for Desktop Apps` | Web UI、浏览器态回归、Electron（experimental） | 团队已在用；开发效率高；trace/screenshot/video 体验好；适合 DOM/键盘导航/视觉回归 | 官方桌面支持不覆盖 Tauri/macOS 原生壳；无法直接验证托盘、全局热键、权限、焦点恢复、原生粘贴链路 | 低（原生壳）/高（Web 层） |

### `XCUITest`

优点：

- Apple 官方 UI 测试框架，和 Xcode、结果报告、录制能力、附件采集集成最好。
- 官方 API 文档明确覆盖 macOS UI 查询能力，适合按 `window`、`toolbar`、`button` 等原生可访问元素建模。
- 对 Klip 这类 Tauri 应用最关键，因为要测的不是单纯 DOM，而是“原生窗口 + 前台应用 + 系统权限 + 焦点恢复”这一整条链路。
- 没有额外 Appium/WebDriver 转换层，排查 flake 时路径最短。

缺点：

- 需要单独维护一套 Xcode UI Test 工程，测试语言通常是 Swift。
- 团队现有测试主栈是 Node/TypeScript，技能栈切换成本高于 Playwright。
- 菜单栏图标点击、全局热键注册成功、Accessibility/TCC 权限提示等系统级行为，自动化通常仍要配合 test hook 或保留少量人工 smoke。

适合 Klip 的原因：

- Klip 的风险集中在 macOS 原生行为，不在 Web DOM 本身。
- 原生托盘、窗口层级、焦点恢复、直接粘贴，是 Apple 框架路径最短、最少抽象失真的场景。

### `Appium for Mac`（`Appium Mac2 Driver`）

优点：

- 继续用 JS/TS 编写原生桌面测试，和现有 Node 工具链更接近。
- 官方 README 明确支持通过 bundle id 启动应用、激活应用，也能自动化其他 macOS 应用，适合做跨应用粘贴场景。
- 如果团队已经有 Appium/WebDriver 经验，上手速度可能快于完整引入 Swift + Xcode UI test。

缺点：

- 不是独立能力，底层仍然依赖 `XCTest`；因此并没有绕开 Apple 栈，只是在上面再包了一层。
- 官方 README 明确说明由于 XCTest 限制，一次只能运行一个 UI test。
- 运行前需要额外安装/配置 `Xcode Helper`，并给它 Accessibility 权限；维护面比 XCUITest 更大。
- migration 文档说明部分 W3C 手势/动作仍有限制，这意味着复杂桌面交互时可预期会遇到能力边界。
- 对 Klip 这种单一 macOS 目标的项目，引入 Appium 的收益主要是“继续用 JS”，但代价是更多中间层和更长的排障链路。

适合 Klip 的位置：

- 作为“团队强烈要求用 JS/TS 写原生桌面测试”时的备选。
- 不适合作为首选主线方案。

### `Playwright for Desktop Apps`

优点：

- Klip 现有浏览器预览回归已经基于 Playwright，团队、CI、调试方式都已成熟。
- 很适合覆盖 React 界面的搜索、键盘导航、空状态、设置持久化、表单校验等 Web 层逻辑。
- Trace、video、screenshot、重试机制对日常回归非常友好。

缺点：

- Playwright 官方文档里的桌面应用支持目前是 `Electron application`，而且仍是 experimental。
- Playwright 官方主页的产品边界仍是浏览器自动化，不是通用 macOS 原生桌面自动化框架。
- Tauri 官方文档明确指出：macOS 目前没有 desktop WebDriver client。结合 Playwright 的官方边界，可以推断它不适合直接承担 Tauri/macOS 原生壳验证。
- 因此它无法可靠覆盖 Klip 最关键的原生风险：托盘、全局热键、焦点恢复、直接粘贴、系统权限提示。

适合 Klip 的位置：

- 继续作为 Web 层回归主力。
- 不建议继续投入为它“补齐” macOS 原生壳自动化能力。

## 2) 推荐方案

### 推荐结论

**推荐采用分层方案：`XCUITest` 作为 macOS 原生 UI 验证主方案，保留现有 `Playwright` 作为 Web/UI 逻辑回归层；不推荐把 `Appium Mac2` 作为主线。**

### 推荐理由

1. Klip 当前的核心风险点都在 macOS 原生壳层，不在纯 DOM 层。
2. `XCUITest` 是 Apple 第一方方案，能力边界最贴近要验证的系统行为。
3. `Appium Mac2` 底层仍然是 XCTest，但增加了 Appium Server、Driver、Helper 和 WebDriver 协议层，收益主要只是保留 JS/TS 编写体验，不足以抵消复杂度。
4. `Playwright` 对 Klip 仍然很有价值，但价值在“快回归 Web 层”，不是“替代 macOS 原生桌面验证”。

### 推荐测试分层

- 第 1 层：`Playwright`
  - 继续跑现有 browser-preview / Web 层回归。
  - 用于 PR gate，保证菜单逻辑、搜索、设置、片段 CRUD、基础键盘路径不回退。
- 第 2 层：`XCUITest`
  - 新增 macOS 原生 UI 自动化。
  - 用于 nightly / pre-release / 手动触发验证。
  - 覆盖窗口生命周期、前后台切换、直接粘贴、焦点恢复、权限反馈。
- 第 3 层：人工 smoke
  - 只保留最难自动化、最依赖系统状态的少量检查，例如真实菜单栏图标可见性、首次权限授予路径。

## 3) 实施步骤

### 阶段 0：先定义“自动化边界”

把 Klip 的 macOS 桌面验证拆成两类：

- Web 层：继续由 `Playwright` 负责。
- 原生壳层：新增 `XCUITest`。

建议先明确以下场景进入 `XCUITest` 首批清单：

1. App 启动后常驻菜单栏/托盘。
2. 打开 popup，能看到历史与 snippets。
3. 打开 `偏好设置` 与 `编辑片断`，窗口能复用而不是重复创建。
4. 选择历史项后，能恢复到前台目标应用并完成粘贴或给出明确 fallback。
5. Accessibility 权限缺失时，界面能给出可见错误反馈。

### 阶段 1：给应用补“可测试性”

这一步决定后续 flake 率，应该先做。

1. 给关键控件补稳定的可访问性语义。
   - React/WebView 内的关键按钮、输入框、列表项补齐稳定的 `role`、`aria-label`、可读名称。
   - 不要依赖只在浏览器里可见、但不会映射到 macOS 可访问性树的选择器。
2. 增加 `ui test` 启动模式。
   - 例如通过 launch argument / env 切到测试模式。
   - 测试模式下允许注入固定历史数据、片段数据、设置值。
3. 增加 test-only 命令。
   - 例如“打开 popup”“写入 fixture 数据”“读取当前窗口状态”“重置本地存储”。
   - 这样第一版 `XCUITest` 不必一开始就硬碰硬模拟全局热键。
4. 把最难自动化的系统事件和“业务结果”拆开验证。
   - 例如热键注册成功可以保留小规模人工 smoke。
   - 热键触发后的 popup 行为、选择后的粘贴反馈则交给自动化。

### 阶段 2：建立独立的 XCUITest 工程

由于 Klip 本身不是 Xcode 原生 macOS App 工程，建议单独建一个轻量 Xcode UI Test 项目，而不是改造主构建链。

实施方式：

1. 新建 `mac-ui-tests/`（或类似目录）的 Xcode 工程。
2. 只放 UI Test target，不承载业务源码。
3. 在测试里通过 `XCUIApplication(bundleIdentifier:)` 启动已构建好的 `Klip.app`。
4. 让测试读取外部传入的 app 路径、bundle id、fixture 路径。
5. 通过 `xcodebuild test` 驱动执行，并输出 result bundle。

这样可以把：

- Tauri/Rust 构建
- 打包产物生成
- macOS UI 自动化执行

拆成三段，便于 CI 和本地排障。

### 阶段 3：先做 3 条高价值用例

第一批不要贪多，建议只做最值钱的 3 条：

1. `launch -> open popup -> 搜索/键盘选择 -> 关闭`
2. `open preferences/snippet editor -> 再次打开 -> 复用现有窗口`
3. `TextEdit 作为前台目标 -> 触发选择 -> 验证焦点恢复和粘贴结果`

原因：

- 这 3 条基本覆盖 Klip 目前最核心的原生风险面。
- 一旦这 3 条跑稳，再扩更多回归场景才有意义。

### 阶段 4：引入跨应用验证

对 Klip，真正的难点不是“点按钮”，而是“和别的 app 协作”。

建议第二批 `XCUITest` 用例直接把 `TextEdit` 作为标准靶应用：

1. 启动 `TextEdit`。
2. 让输入光标停在编辑区。
3. 打开 Klip popup。
4. 选择一条 history/snippet。
5. 断言：
   - Klip panel 被隐藏；
   - 焦点回到 `TextEdit`；
   - 文本成功粘贴，或出现预期 fallback 提示。

这组用例比单纯验证 popup DOM 更能发现真实桌面回归。

### 阶段 5：保留 Playwright，但缩清职责

现有 `Playwright` 不应该废弃，应该继续保留并聚焦：

- popup/menu 逻辑
- search/filter
- snippets CRUD
- settings 持久化
- 浏览器预览视觉回归

建议原则：

- PR 上继续跑 `Playwright`。
- macOS 原生 UI 验证放到 nightly / release gate。
- 不要再尝试让 Playwright 直接承担 Tauri/macOS 原生壳自动化。

### 阶段 6：只在必要时再评估 Appium Mac2

如果团队后续出现以下约束，再做一次 `Appium Mac2` POC：

- 团队无法接受 Swift/Xcode 测试栈；
- 希望所有端到端用例都统一在 JS/TS；
- 已经有成熟的 Appium/WebDriver 维护经验。

POC 判断标准建议只看 4 个指标：

1. 首次接入成本
2. 单次执行稳定性
3. 跨应用场景 flake 率
4. 排障成本

若这 4 项没有明显优于 `XCUITest`，就不应切主线。

## 建议落地顺序

1. 保持现有 `Playwright` 不动，继续承担 Web 回归。
2. 先做 Klip 的 testability 改造：可访问性标识、fixture 注入、test-only 命令。
3. 新建独立 `XCUITest` 工程，先打通本地执行。
4. 落首批 3 条高价值用例。
5. 再补跨应用粘贴与权限反馈。
6. 最后决定哪些系统级路径保留人工 smoke。

## 最终建议

如果目标是“给 Klip 建一套能真实发现 macOS 桌面回归的自动化验证方案”，结论很明确：

- **主方案：`XCUITest`**
- **保留方案：`Playwright` 继续做 Web/UI 逻辑回归**
- **备选方案：`Appium Mac2`，仅在必须 JS/TS-only 时再做 POC**

换句话说，**不要把问题定义成“XCUITest vs Playwright 二选一”**。对 Klip 更合理的结构是：

- `Playwright` 负责快、频繁、低成本的 Web 回归；
- `XCUITest` 负责慢一些但更接近真实 macOS 行为的原生验证。

## 参考资料

- Apple, Testing apps in Xcode: https://developer.apple.com/xcode/testing/
- Apple, `XCUIElementQuery`: https://developer.apple.com/documentation/xcuiautomation/xcuielementquery
- Apple WWDC25, Explore UI testing improvements: https://developer.apple.com/videos/play/wwdc2025/265/
- Appium, `appium-mac2-driver` README: https://github.com/appium/appium-mac2-driver
- Appium, Mac2 migration guide: https://github.com/appium/appium-mac2-driver/blob/master/docs/migration-guide.md
- Playwright, Electron support: https://playwright.dev/docs/api/class-electron
- Playwright official site: https://playwright.dev/
- Tauri v2, Automated tests: https://v2.tauri.app/develop/tests/
