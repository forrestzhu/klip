# Klip AI Constitution

> AI 行为准则 - 确保 AI 生成的代码符合质量和安全标准

## 🎯 核心原则

### 1. 可验证性原则
**所有 AI 生成的代码必须可测试**

- ✅ 每个 UI 组件必须有对应的测试用例
- ✅ 每个功能模块必须有集成测试
- ✅ 所有 API 调用必须有错误处理和测试
- ❌ 禁止生成无法测试的代码

### 2. 安全性原则
**AI 生成的代码不能引入安全风险**

- ✅ 所有用户输入必须验证和清理
- ✅ 敏感信息必须加密存储
- ✅ 文件系统操作必须检查权限
- ❌ 禁止硬编码密钥或敏感信息

### 3. 可维护性原则
**AI 生成的代码必须易于理解和修改**

- ✅ 代码必须有清晰的注释
- ✅ 复杂逻辑必须有文档说明
- ✅ 变量和函数命名必须语义化
- ❌ 禁止过度复杂的实现

## 📋 代码规范

### TypeScript/React 规范
```typescript
// ✅ 好的示例
/**
 * 剪贴板历史项组件
 * @param item - 剪贴板历史项数据
 * @param onSelect - 选择回调函数
 */
export function HistoryItem({ item, onSelect }: HistoryItemProps) {
  // 组件实现
}

// ❌ 禁止的示例
export const H = ({ i, s }: any) => {
  // 缺少类型定义和注释
}
```

### Rust 规范
```rust
// ✅ 好的示例
/// 读取剪贴板内容
/// 
/// # Arguments
/// * `clipboard` - 剪贴板实例
/// 
/// # Returns
/// 剪贴板文本内容，如果失败则返回 None
pub fn read_clipboard(clipboard: &Clipboard) -> Option<String> {
    // 实现代码
}

// ❌ 禁止的示例
pub fn rc(c: &Clipboard) -> Option<String> {
  // 缺少文档注释
}
```

## 🧪 测试规范

### 测试覆盖要求
- **UI 组件**: 100% 覆盖（Playwright）
- **业务逻辑**: 100% 覆盖（Vitest）
- **Rust 代码**: 100% 覆盖（Cargo test）

### 测试命名规范
```typescript
// ✅ 好的示例
describe('HistoryItem', () => {
  it('should display item content correctly', () => {
    // 测试代码
  })
  
  it('should call onSelect when clicked', () => {
    // 测试代码
  })
})

// ❌ 禁止的示例
describe('test', () => {
  it('works', () => {
    // 测试代码
  })
})
```

## 🔍 验证机制

### 静态分析
- TypeScript: ESLint + TypeScript Compiler
- Rust: Clippy + rustfmt
- 自动化检查：Git pre-commit hooks

### 动态测试
- 单元测试：Vitest (前端) + Cargo test (后端)
- 集成测试：Playwright (E2E)
- 手动测试：关键用户流程

### AI 自检
- 生成代码后必须自我审查
- 检查是否遵循 Constitution
- 确保所有测试通过

## 🚫 禁止行为

1. ❌ 生成无测试覆盖的代码
2. ❌ 引入未经验证的依赖
3. ❌ 硬编码配置或密钥
4. ❌ 跳过错误处理
5. ❌ 使用过时的 API

## 📚 参考资料

- [Superpowers Methodology](https://github.com/obra/superpowers)
- [Debian AI Policy Discussion](https://lwn.net/SubscriberLink/1061544/125f911834966dd0/)
- [Amazon AI Code Review Policy](https://arstechnica.com/ai/2026/03/after-outages-amazon-to-make-senior-engineers-sign-off-on-ai-assisted-changes/)

---

**版本**: 1.0
**更新日期**: 2026-03-11
**适用范围**: Klip 项目的所有 AI 辅助开发
