# Klip 代码规范设计文档 (v2)

> 创建日期: 2026-03-03  
> 最近更新: 2026-03-03

本文档定义 Klip 项目的统一工程规范。目标是让“人类开发 + AI 开发”在同一套规则下稳定协作，减少歧义、避免回归，并保证每次改动都可验证、可回滚。

---

## 1. 文档目标

- 作为项目内唯一的代码规范来源（Single Source of Truth）。
- 规则必须可执行、可检查，避免“原则正确但无法落地”。
- 默认假设本项目将长期采用 AI 辅助/AI 主导开发。

---

## 2. 技术栈与版本策略

- **前端**: React + TypeScript
- **桌面端**: Tauri (Rust)
- **格式化/Lint**: Biome
- **提交规范**: Conventional Commits + Commitlint
- **Git Hooks**: Husky + lint-staged

### 2.1 版本锁定要求

- Node.js 使用 **LTS** 版本，并在 `package.json` 的 `engines` 中声明。
- Rust 使用稳定版，并通过 `rust-toolchain.toml` 锁定工具链。
- 依赖必须提交 lock 文件（`package-lock.json` / `Cargo.lock`）。
- CI 与本地开发使用同一主版本运行时，避免“本地能跑、CI 失败”。

---

## 3. 项目结构

```text
klip/
├── src/                    # 前端源码
│   ├── components/         # 通用 React 组件
│   ├── hooks/              # 自定义 hooks
│   ├── features/           # 按业务域组织（推荐）
│   ├── services/           # API/业务服务层
│   ├── stores/             # 状态管理
│   ├── utils/              # 纯工具函数
│   ├── types/              # 全局类型定义
│   ├── styles/             # 全局样式
│   └── main.tsx            # 入口文件
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── main.rs
│   │   └── lib.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/                  # 自动化测试（unit/integration/e2e）
├── docs/
│   └── plans/
├── biome.json
├── .commitlintrc.json
├── package.json
└── README.md
```

约束：

- 目录命名统一 `kebab-case`。
- 新增功能优先放在 `src/features/<feature-name>/`，避免按技术类型无限平铺。

---

## 4. 命名约定

### 4.1 文件命名

| 文件类型 | 命名规则 | 示例 |
|---------|---------|------|
| 组件文件 | `PascalCase.tsx` | `ClipboardList.tsx` |
| Hook 文件 | `useXxx.ts` / `useXxx.tsx` | `useClipboard.ts` |
| 工具函数 | `camelCase.ts` | `formatDate.ts` |
| 类型文件 | `*.types.ts`（优先） | `clipboard.types.ts` |
| 常量文件 | `camelCase.ts` | `constants.ts` |
| 测试文件 | `*.test.ts` / `*.test.tsx` | `storage.test.ts` |

### 4.2 代码命名

| 类型 | 命名规则 | 示例 |
|-----|---------|------|
| 变量/函数 | `camelCase` | `saveClipboardItem` |
| 组件/类/类型 | `PascalCase` | `ClipboardItem` |
| 常量 | `UPPER_SNAKE_CASE` | `MAX_HISTORY_SIZE` |
| 私有成员 | `_camelCase`（可选） | `_cacheMap` |

补充约束：

- 避免单字符变量名（循环索引 `i/j` 除外）。
- 命名必须表达业务语义，禁止 `data1`, `tempValue` 这类无意义命名。

---

## 5. AI 开发流程（核心）

### 5.1 AI 任务输入最小模板

每个任务至少包含：

- **目标**: 要交付什么。
- **非目标**: 明确本次不做什么。
- **验收标准（AC）**: 可验证的结果。
- **约束**: 技术/性能/兼容性/安全约束。

### 5.2 变更粒度要求

- 单次变更只解决一个明确问题（一个用户故事或一个缺陷）。
- 非必要不跨模块重构。
- 若必须大改，拆分为多次可回滚提交。

### 5.3 Definition of Done（强制）

满足以下条件才算完成：

1. 代码通过 `lint + typecheck + test`。
2. 关键路径功能有自动化测试覆盖（新增功能必须有测试）。
3. 文档同步更新（README 或 `docs/plans`）。
4. 无新增高风险安全问题（见第 8 节）。

### 5.4 AI 禁止行为

- 修改与任务无关文件。
- 未经说明直接升级核心依赖主版本。
- 跳过失败测试并提交“暂时可用”代码。
- 提交明文密钥、令牌、用户隐私数据。
- 使用不可回滚的破坏性 git 操作。

### 5.5 AI 输出要求

每次交付需附：

- 修改文件清单。
- 执行过的验证命令与结果。
- 已知风险和后续建议。

---

## 6. Git 提交规范

采用 **Conventional Commits**。

### 6.1 提交格式

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### 6.2 Type 列表

- `feat`: 新功能
- `fix`: 缺陷修复
- `docs`: 文档
- `style`: 纯格式调整（不改逻辑）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/依赖/工具
- `ci`: CI 配置

### 6.3 Scope 建议

`clipboard`, `tray`, `ui`, `storage`, `search`, `hotkey`, `tauri`, `build`, `deps`

### 6.4 强制规则

- `subject` 必填，首字母小写，末尾无句号。
- `header` 最大长度 **72**（与配置保持一致）。
- 提交信息建议使用英文，减少工具链大小写/词法误判。
- `BREAKING CHANGE` 必须在 footer 标注。

### 6.5 高质量提交示例

推荐：`header` 说明“做了什么”，`body` 说明“为什么做/怎么做/风险”，`footer` 放关联信息。

#### 6.5.1 单行提交（小改动）

```text
feat(clipboard): add deduplication for consecutive copies
fix(hotkey): prevent duplicate registration on app resume
refactor(storage): split history repository from settings store
perf(search): cache normalized keywords for history filtering
test(ui): add keyboard navigation cases for history list
docs(prd): clarify phase-2 parity acceptance criteria
ci(actions): run quality gates on macos and windows
chore(deps): pin vitest coverage provider to v8
```

#### 6.5.2 带 Body 的完整提交（推荐）

```text
feat(history): add configurable max history size

add max_items to settings and enforce fifo eviction in the
history repository when the limit is exceeded.

this keeps memory usage predictable and aligns with prd us-002.

Refs: US-002
```

```text
fix(paste): fallback to clipboard copy when direct paste fails

handle platform paste injection errors and keep user flow unblocked
by copying the selected value back to the system clipboard.

risk: fallback depends on foreground app permissions on macos.
```

```text
ci(quality): enforce coverage threshold in pull request pipeline

run test:coverage in ci and fail early when changed code falls below
the project threshold.

Refs: docs/plans/2026-03-03-code-standards-design.md
```

#### 6.5.3 Breaking Change 示例

```text
refactor(storage): replace history item schema with versioned format

migrate persisted records to include source metadata and timestamp
precision in milliseconds.

BREAKING CHANGE: old history snapshots must be migrated before read.
```

#### 6.5.4 反例（避免）

```text
fix: update stuff
feat(ui): make it better
chore: misc changes
```

以上反例的问题是：语义模糊、无法追踪影响范围、回滚成本高。

---

## 7. 测试策略与质量门禁

### 7.1 测试分层

- **Unit**: 纯函数、数据处理、hook 逻辑。
- **Integration**: 前端与状态/服务层协作、Tauri command 调用。
- **E2E（关键路径）**: 剪贴板采集、搜索、粘贴主流程。

### 7.2 覆盖率要求

- 新增/修改代码行覆盖率建议不低于 **80%**。
- 无法覆盖的场景需在 PR/提交说明中写明原因与手工验证步骤。

### 7.3 本地与 CI 必过项

本地提交前至少执行：

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run test:coverage
cargo check --manifest-path src-tauri/Cargo.toml --locked
# or one-shot:
npm run qa
```

CI 必须包含同等校验；任何一项失败不得合并。

---

## 8. 安全与隐私规范（剪贴板应用）

- 剪贴板内容默认视为敏感数据。
- 禁止在日志中输出完整剪贴板明文；如需调试，必须脱敏/截断。
- 本地存储必须支持用户清除历史与敏感项。
- 云同步功能上线前必须补充：传输加密、服务端加密、访问控制、审计日志。
- 所有密钥通过环境变量或系统密钥链管理，不得写入仓库。

---

## 9. 工具配置基线

### 9.1 Biome（示例）

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.5/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
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

### 9.2 Commitlint（示例）

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
    "header-max-length": [2, "always", 72]
  }
}
```

### 9.3 Husky Hooks（建议）

- `pre-commit`: `lint-staged`
- `commit-msg`: `commitlint --edit $1`

`lint-staged` 建议：

- `*.{ts,tsx,js,jsx,json,md}`: `biome check --write`

---

## 10. 评审清单（Code Review Checklist）

1. 变更是否只覆盖本次任务目标？
2. 是否满足第 5.3 节 DoD？
3. 是否新增或放大了安全/隐私风险？
4. 是否可回滚、可复现、可验证？
5. 文档与配置是否同步更新？

---

## 11. 参考资料

- [Cap 项目](https://github.com/CapSoftware/Cap) - Tauri + Biome 实践
- [Jan 项目](https://github.com/janhq/jan) - Tauri 项目结构参考
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Biome](https://biomejs.dev/)
