# Klip 代码规范设计文档

> 创建日期: 2026-03-03

本文档定义了 Klip 项目的代码规范，包括项目结构、命名约定、Git 提交规范和工具配置。所有后续开发（包括 AI 辅助开发）都应遵守此规范。

---

## 1. 技术栈

- **前端框架**: React + TypeScript
- **桌面框架**: Tauri (Rust 后端)
- **格式化/Lint**: Biome
- **提交规范**: Conventional Commits + Commitlint
- **Git Hooks**: Husky + lint-staged

---

## 2. 项目结构

```
klip/
├── src/                    # 前端源码
│   ├── components/         # React 组件 (PascalCase.tsx)
│   ├── hooks/              # 自定义 hooks (useXxx.ts)
│   ├── utils/              # 工具函数 (camelCase.ts)
│   ├── services/           # 业务服务层 (camelCase.ts)
│   ├── types/              # TypeScript 类型定义
│   ├── stores/             # 状态管理
│   ├── styles/             # 全局样式
│   └── main.tsx            # 入口文件
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs         # 主入口
│   │   └── lib.rs          # 库文件
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/                   # 文档
│   └── plans/              # 设计文档
├── biome.json              # Biome 配置
├── .commitlintrc.json      # Commitlint 配置
├── package.json
└── README.md
```

---

## 3. 命名约定

### 3.1 文件命名

| 文件类型 | 命名规则 | 示例 |
|---------|---------|------|
| 组件文件 | `PascalCase.tsx` | `ClipboardList.tsx`, `SearchInput.tsx` |
| Hook 文件 | `useXxx.ts` (camelCase) | `useClipboard.ts`, `useHotkey.ts` |
| 工具函数 | `camelCase.ts` | `formatDate.ts`, `storage.ts` |
| 类型文件 | `camelCase.ts` 或 `xxx.types.ts` | `clipboard.types.ts`, `index.ts` |
| 常量文件 | `camelCase.ts` | `constants.ts`, `hotkeys.ts` |

### 3.2 代码命名

| 类型 | 命名规则 | 示例 |
|-----|---------|------|
| 变量 | `camelCase` | `clipboardHistory`, `selectedItem` |
| 函数 | `camelCase` | `getClipboardContent`, `saveToStorage` |
| 组件 | `PascalCase` | `ClipboardList`, `SearchInput` |
| 类 | `PascalCase` | `ClipboardManager`, `StorageService` |
| 接口/类型 | `PascalCase` | `ClipboardItem`, `AppConfig` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_HISTORY_SIZE`, `DEFAULT_TIMEOUT` |
| 私有成员 | `_camelCase` (可选) | `_privateMethod`, `_internalState` |

### 3.3 目录命名

- 一律使用 `kebab-case`
- 示例: `clipboard-manager/`, `system-tray/`, `search-utils/`

---

## 4. Git 提交规范

采用 **Conventional Commits** 规范。

### 4.1 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 4.2 类型 (Type)

| 类型 | 说明 | 示例 |
|-----|------|------|
| `feat` | 新功能 | `feat(clipboard): add auto-clear feature` |
| `fix` | Bug 修复 | `fix(tray): resolve icon not showing on macOS` |
| `docs` | 文档更新 | `docs: update README installation steps` |
| `style` | 代码格式（不影响逻辑） | `style: fix indentation in utils` |
| `refactor` | 重构（非新功能/修复） | `refactor(storage): simplify save logic` |
| `perf` | 性能优化 | `perf(search): improve filter speed by 50%` |
| `test` | 测试相关 | `test(hooks): add useClipboard unit tests` |
| `chore` | 构建/工具/依赖 | `chore: update dependencies to latest` |
| `ci` | CI 配置 | `ci: add GitHub Actions workflow` |

### 4.3 范围 (Scope)

常用范围（可按需扩展）：

| Scope | 说明 |
|-------|------|
| `clipboard` | 剪贴板核心功能 |
| `tray` | 系统托盘 |
| `ui` | 界面相关 |
| `storage` | 数据存储 |
| `search` | 搜索功能 |
| `hotkey` | 快捷键 |
| `tauri` | Tauri/Rust 后端 |

### 4.4 规则

- **subject**: 必填，首字母小写，结尾不加句号，不超过 72 字符
- **body**: 可选，说明改动原因和细节，每行不超过 100 字符
- **footer**: 可选，用于 Breaking Change 或关联 Issue

### 4.5 示例

```bash
# 简单提交
feat(clipboard): add support for image clipboard

# 带 body 的提交
fix(tray): resolve memory leak on Windows

The tray icon was not being properly disposed when the app closes,
causing a memory leak on Windows systems.

Closes #123

# Breaking Change
refactor(storage)!: change database schema

BREAKING CHANGE: The storage format has changed. Users need to
export their data before updating.
```

---

## 5. 工具配置

### 5.1 Biome 配置

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double"
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

### 5.2 Commitlint 配置

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci"]
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100]
  }
}
```

### 5.3 Git Hooks

**pre-commit**: 运行 Biome 格式化和 lint 检查
**commit-msg**: 运行 Commitlint 校验提交信息格式

---

## 6. 参考资料

- [Cap 项目](https://github.com/CapSoftware/Cap) - Tauri + Biome 实践参考
- [Jan 项目](https://github.com/janhq/jan) - Tauri 项目结构参考
- [Conventional Commits](https://www.conventionalcommits.org/) - 提交规范官方文档
- [Biome](https://biomejs.dev/) - 代码格式化和 Lint 工具
