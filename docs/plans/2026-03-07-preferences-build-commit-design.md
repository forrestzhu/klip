# Klip Preferences 构建 Commit 展示设计文档（v1）

- 日期: 2026-03-07
- 目标平台: macOS / Windows / 浏览器预览
- 状态: `design-approved`

## 1. 目标

在 `preferences` 窗口中展示当前构建对应的短 commit 标识，便于手工测试时快速确认自己安装/运行的是哪一版代码。

## 2. 交互范围

- 不在主 `panel` 中显示。
- 仅在 `preferences` 窗口中显示。
- 展示位置保持低干扰，放在 `preferences` 窗口底部，作为只读构建信息。

## 3. 展示规则

- 正常情况显示短 commit：
  - `Commit: 2799b1d`
- 如果构建时工作区非干净：
  - `Commit: 2799b1d-dirty`
- 如果构建环境拿不到 git 信息：
  - `Commit: unknown`

## 4. 技术方案

- 采用构建时注入，而不是运行时读取 git。
- 在 `vite.config.ts` 中读取：
  - `git rev-parse --short=7 HEAD`
  - `git status --porcelain`
- 将结果通过 Vite `define` 注入前端常量。
- 前端通过独立的 build-info helper 统一规范化/格式化展示文本。

## 5. 测试策略

- 为 build-info helper 增加 Vitest 单测：
  - 正常短 commit
  - dirty commit
  - 空值回退为 `unknown`
- 通过现有构建流程验证注入后的前端仍可正常 `typecheck` / `build`。
