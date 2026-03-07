# Klip 原生 Panel 行为设计文档（v1）

- 日期: 2026-03-07
- 目标平台: macOS（当前修复重点）+ Windows（架构同步纳入）
- 状态: `design-approved`
- 背景问题:
  - 全屏应用中使用 `Cmd+Shift+V` 呼出 panel 时，会跳到 Klip 自己所在的桌面 / Space，导致无法在当前全屏上下文完成粘贴。
  - 非全屏应用中，在 panel 中点击 history 文本后，当前实现可能未能把焦点可靠地还给原输入目标，表现为“点击没反应”或没有粘贴到原输入位置。
  - panel 当前没有按鼠标所在屏幕与鼠标位置弹出，缺少类似系统右键菜单的定位行为。

## 1. 目标与边界

### 1.1 目标
将 Klip 的主 panel 从“普通应用窗口”提升为“更接近系统原生快捷面板”的行为模型：
1. 在当前工作上下文展示，而不是把用户切到另一个桌面。
2. 在鼠标附近弹出，并自动避免超出屏幕工作区。
3. 在选择 history / snippet 后，可靠地把焦点恢复到原目标，再执行 direct paste。
4. 抽象出跨平台 panel presenter，为 Windows 的同类问题预留同一套入口。

### 1.2 边界
- 本次不重写前端 UI，不把主界面整体替换成原生 `NSMenu`。
- 本次不引入全新的独立原生 `NSPanel` 容器承载 WebView，而是在现有 Tauri 主窗口上补齐原生 panel 语义。
- 本次优先修复主 panel；`snippet-editor` 与 `preferences` 仍保持普通独立窗口行为。

## 2. 根因分析

### 2.1 全屏场景跳 Space
当前 macOS 实现仅设置了 `visible_on_all_workspaces`，其底层只等价于 `NSWindowCollectionBehaviorCanJoinAllSpaces`。这能覆盖普通 Space，但不足以让窗口作为全屏应用上方的辅助窗口存在，因此在全屏应用中仍可能触发 Space 切换。

### 2.2 点击 history 后未粘贴到原目标
当前 direct paste 路径依赖以下脆弱链路：
1. 打开 panel 时记录原前台 app。
2. 点击 history 后隐藏 panel。
3. 重新激活原 app。
4. 固定等待 `80ms`。
5. 发送 `Cmd+V`。

问题在于：
- 恢复原 app 的失败结果会被吞掉。
- 固定延时不等于“目标已真正恢复前台”。
- Windows 当前路径也没有“恢复原前台窗口”的统一抽象，未来会遇到相同类别的问题。

### 2.3 panel 未跟随鼠标
当前只同步窗口大小，不同步窗口位置，因此 panel 只能在上次位置或默认位置出现，不符合系统右键菜单式心智模型。

## 3. 目标交互

### 3.1 唤起
- 用户按 `Cmd+Shift+V` / 对应平台热键。
- 后端先抓取：
  - 当前前台目标
  - 当前鼠标坐标
  - 鼠标所在屏幕工作区
  - 当前 panel 尺寸
- 再把 panel 弹到鼠标附近，并聚焦到搜索输入。

### 3.2 定位
- 默认锚点位于鼠标右下方，保留少量间距。
- 若右侧空间不足，则翻到鼠标左侧。
- 若下方空间不足，则翻到鼠标上方。
- 位置最终限制在当前屏幕的 `work_area` 内，不压到 Dock / 任务栏。
- 每次唤起重新定位，不做“显示后持续跟随鼠标”。

### 3.3 选择与粘贴
- 点击 history / snippet 后：
  1. 将文本写入系统剪贴板。
  2. 隐藏 panel。
  3. 恢复 panel 打开前的目标应用 / 窗口。
  4. 确认目标已恢复前台。
  5. 发送系统粘贴快捷键。
- 若任一步骤失败，则返回 `fallback`，保底为“文本已复制到剪贴板”。

## 4. 架构设计

### 4.1 新增统一入口
新增模块：
- `src-tauri/src/panel_presenter.rs`

职责：
- 捕获 panel 唤起上下文。
- 计算 panel 定位。
- 对主窗口应用更原生的 panel 语义。
- 恢复原目标并执行 direct paste 前置步骤。
- 对平台差异进行统一封装。

### 4.2 平台拆分
- `src-tauri/src/panel_presenter/macos.rs`
  - 配置 `NSWindow` 的 panel 式 collection behavior / level。
  - 保证 panel 可作为全屏辅助窗口出现在当前上下文。
  - 捕获与恢复前台 app。
- `src-tauri/src/panel_presenter/windows.rs`
  - 捕获与恢复前台 `HWND`。
  - 为 panel 使用鼠标所在显示器工作区定位。
  - 统一到同一 presenter 抽象下，避免未来再在 paste 路径中零散打补丁。

### 4.3 状态模型
- `PanelPresenterState`
  - 记录最近一次唤起时的“前一个目标”。
- `PreviousTarget`
  - macOS: bundle identifier
  - Windows: foreground `HWND`
- 纯计算模型：
  - `PanelCursorAnchor`
  - `PanelSize`
  - `MonitorWorkArea`
  - `PanelOrigin`

## 5. 平台策略

### 5.1 macOS
- 继续复用 Tauri 主窗口承载 WebView。
- 在原生层对 `NSWindow` 应用更接近 panel 的行为：
  - `CanJoinAllSpaces`
  - `FullScreenAuxiliary`
  - `MoveToActiveSpace`
  - 合适的浮动窗口层级
  - 避免进入常规窗口循环
- 展示路径优先由 presenter 统一执行，而不是让 `tray.rs` 直接 `show + focus`。

### 5.2 Windows
- 不把本次修复限制为 macOS-only 逻辑散补丁。
- 虽然当前主要验证在 macOS，但 presenter 抽象会直接纳入：
  - foreground window 记录
  - foreground restore 钩子
  - 基于鼠标和 monitor work area 的定位逻辑

## 6. 错误处理

1. 若无法记录前台目标：
- 允许 panel 打开。
- 但 direct paste 只能返回 clipboard fallback。

2. 若无法恢复前台目标：
- 不报告 direct paste 成功。
- 明确返回 fallback 文案。

3. 若系统快捷键注入失败：
- 保底保留剪贴板内容。
- 前端继续展示 fallback 消息。

## 7. 测试设计

### 7.1 自动化
- Rust 单测：
  - panel 位置计算：正常、右边缘、下边缘、右下角、超大窗口钳制。
  - direct paste 前置判断：没有 previous target 时必须 fallback。
  - 恢复失败时不能返回 `direct`。

### 7.2 手工验证
- macOS 非全屏 app：
  - 热键呼出 panel 不跳桌面。
  - 点击 history 后文本进入原输入位置。
- macOS 全屏 app：
  - panel 在当前全屏 Space 上出现。
  - 点击后能回到原 app 并完成粘贴。
- 多显示器：
  - panel 出现在鼠标所在屏幕且靠近鼠标。
- Windows（架构回归目标）：
  - 面板出现在鼠标所在显示器。
  - 选择后恢复原窗口而不是把焦点留在 Klip。

## 8. 验收标准

1. 在全屏应用中呼出 panel，不再跳到 Klip 自己的 Space。
2. 在非全屏应用中点击 history / snippet，可稳定粘贴到原目标。
3. panel 每次在鼠标附近弹出，并保持在当前屏幕工作区内。
4. macOS 与 Windows 都通过同一 presenter 抽象处理 panel 上下文、定位与前台恢复。
