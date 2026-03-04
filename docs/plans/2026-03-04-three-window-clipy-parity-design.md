# Klip 三窗口 1:1 复刻 Clipy 设计文档（v1）

- 日期: 2026-03-04
- 目标平台: macOS（第一优先）
- 状态: `design-ready`（已收到参考截图）
- 参考实现:
  - `~/Documents/workspace/python_work/Clipy/Clipy/Sources/Managers/MenuManager.swift`
  - `~/Documents/workspace/python_work/Clipy/Clipy/Sources/Snippets/Base.lproj/CPYSnippetsEditorWindowController.xib`
  - `~/Documents/workspace/python_work/Clipy/Clipy/Sources/Preferences/Base.lproj/CPYPreferencesWindowController.xib`
- 参考截图目录:
  - `docs/clipy_ui/popup0_init.png`
  - `docs/clipy_ui/popup1_hover_history.png`
  - `docs/clipy_ui/popup2_hover_snippet.png`
  - `docs/clipy_ui/snippet_edit.png`
  - `docs/clipy_ui/settings0_general.png`
  - `docs/clipy_ui/settings1_menu.png`
  - `docs/clipy_ui/settings2_support_types.png`
  - `docs/clipy_ui/settings3_exclude_apps.png`
  - `docs/clipy_ui/settings4_key_mapping.png`
  - `docs/clipy_ui/settings5_upgrade.png`

## 1. 目标与边界

### 1.1 目标
严格对齐 Clipy 的三窗口模型：
1. 小型粘贴窗口（由 `Cmd+Shift+V` 呼出）
2. Snippet 编辑窗口（独立窗口）
3. 偏好设置窗口（独立窗口）

### 1.2 边界
- 本阶段优先做 macOS 视觉与交互 1:1。
- 不在本阶段引入新功能，仅做结构与样式对齐。
- Windows 保持现有能力，后续做样式补齐。

## 2. 三窗口信息架构

## 2.1 窗口 A: 小型粘贴窗口（Popup）

### 触发
- 全局快捷键: `Cmd+Shift+V`
- 托盘菜单打开（同一 popup 逻辑）

### 根菜单结构（按顺序）
1. 历史记录分组（直接显示，不包 `History`）
- `1 - 10`
- `11 - 20`
- `21 - 30`（有数据时显示）
2. Snippets 文件夹（直接显示，不包 `Snippets`）
- 每个 folder 是二级入口
- 若没有用户 snippet：整个 snippets 区块不显示
3. 分割线
4. `清除历史`
5. `编辑片断...`
6. `偏好设置...`
7. 分割线
8. `退出 Klipy`（Klip 中显示 `退出 Klip`）

### 键盘交互
- `↑/↓`: 同级选择
- `→` 或 `Enter`: 进入子级或执行叶子项
- `←`: 返回上级
- `Esc`: 关闭 popup，焦点回到原应用

### 选择行为
- 选择历史项或 snippet 项:
  - 执行 direct paste（失败回退 clipboard）
  - 成功后自动关闭 popup

### 视觉基线（来自截图）
- 视觉形态必须是原生菜单风格，不使用 Web 卡片面板。
- section header 为浅灰禁用态（例如“历史”“片断”）。
- 普通行左侧 folder 图标 + 文本，右侧 chevron。
- 选中行为为 macOS 蓝底白字（与 `popup1_hover_history.png`、`popup2_hover_snippet.png` 一致）。
- submenu 从右侧浮出，保持与根菜单同风格。

## 2.2 窗口 B: Snippet 编辑窗口（独立窗口）

### 打开方式
- 从 popup 选择 `编辑片断...`
- 打开/聚焦独立窗口，不在 popup 内嵌编辑

### 尺寸与标题（按 Clipy 基线）
- 默认尺寸: `800 x 600`
- 最小尺寸: `800 x 600`
- 标题: `Klip - 片断编辑器`

### 布局（参考 `snippet_edit.png`）
- 顶部工具条图标按钮（新增片断、新增文件夹、删除、启用/禁用、导入、导出）
- 主体左右分栏
  - 左栏: folder/snippet 树
  - 右栏: 详情与内容编辑区
- 交互上保持现有 CRUD 能力，视觉与布局按 Clipy 复刻

## 2.3 窗口 C: 偏好设置窗口（独立窗口）

### 打开方式
- 从 popup 选择 `偏好设置...`
- 打开/聚焦独立窗口，不在 popup 内嵌设置

### 尺寸与标题（按 Clipy 基线）
- 默认尺寸: `480 x 374`
- 固定不可拉伸（与 Clipy 设置窗口一致）
- 标题: `Klip - 设置`

### 布局（参考 `settings*.png`）
- 顶部 icon-tab 导航（通用、菜单、类型、排除、快捷键、更新、Beta）
- 激活 tab 为蓝色图标块 + 蓝色标签
- 内容区按 tab 切换
- Klip 第一阶段只落地已有设置项，但容器样式和 tab 结构先按 Clipy 复刻

## 3. 三窗口生命周期与焦点规则

1. popup 仅用于“快速选中并粘贴”。
2. 进入 `编辑片断...` / `偏好设置...` 时：
- 打开对应独立窗口
- popup 立即关闭
3. 关闭 B/C 不影响后台常驻与热键监听。
4. 再次进入 B/C 时复用已有窗口并聚焦，不重复创建。

## 4. 1:1 对齐验收清单（视觉 + 交互）

1. `Cmd+Shift+V` 打开的是小型 popup，不是大面板。
2. popup 根层没有 `History`/`Snippets` 包裹节点。
3. 历史按 `1-10/11-20/21-30` 二级展示。
4. 无自定义 snippet 时，不显示 snippets 区块。
5. `编辑片断...` 与 `偏好设置...` 打开独立窗口。
6. popup 内选择内容后自动关闭并回到原前台应用。
7. `Esc` 关闭 popup，焦点正确返回。
8. Snippet 编辑窗口与偏好窗口可重复打开并稳定复用。
9. popup、snippet editor、preferences 三者样式分别对齐对应截图。

## 5. 技术实现约束

1. popup 使用原生菜单优先（`NSMenu` 路径），避免 HTML 模拟造成视觉偏差。
2. 三窗口采用独立 label：`main`、`snippet-editor`、`preferences`。
3. 数据层共享（history/snippets/settings），避免多窗口状态漂移。
4. 主窗口负责快捷粘贴，B/C 仅负责管理编辑。

## 6. 执行顺序

1. 先改窗口模型（严格三窗口）。
2. 再改 popup 根菜单结构（去 wrapper + 补齐清除历史/退出）。
3. 再改 snippet editor 与 preferences 的布局样式。
4. 最后做逐截图对照验收。

## 7. 备注

- 已有截图足够推进，不再依赖 Figma。
- 若后续需要像素级收敛，可补充标注图（字号/间距/边距）。
