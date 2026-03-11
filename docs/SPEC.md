# Klip Spec（规范定义）

> 代码规范和设计标准

## 🎨 UI 组件规范

### 组件结构
```
src/components/
├── ComponentName/
│   ├── index.tsx          # 组件主文件
│   ├── ComponentName.test.tsx  # 测试文件
│   ├── styles.css         # 样式文件
│   └── types.ts           # 类型定义
```

### 命名规范
- **组件**: PascalCase (例如: `HistoryItem`)
- **函数**: camelCase (例如: `handleSelect`)
- **常量**: UPPER_SNAKE_CASE (例如: `MAX_HISTORY_ITEMS`)
- **文件**: kebab-case (例如: `history-item.tsx`)

## 📦 API 设计规范

### Tauri Commands
```rust
// ✅ 标准格式
#[tauri::command]
async fn get_history_items(
    limit: usize,
    app_handle: tauri::AppHandle,
) -> Result<Vec<HistoryItem>, String> {
    // 实现
}

// ❌ 禁止格式
#[tauri::command]
fn get_items() -> Vec<Item> {
  // 缺少错误处理和文档
}
```

### TypeScript API 封装
```typescript
// ✅ 标准格式
export async function getHistoryItems(limit: number): Promise<HistoryItem[]> {
  try {
    return await invoke<HistoryItem[]>('get_history_items', { limit });
  } catch (error) {
    console.error('Failed to get history items:', error);
    throw new Error('Failed to get history items');
  }
}

// ❌ 禁止格式
export const getItems = () => invoke('get_items');
```

## 🧪 测试规范

### 测试文件位置
- **单元测试**: `tests/` 目录
- **E2E 测试**: `tests/e2e/` 目录
- **桌面测试**: `tests/desktop/` 目录

### 测试覆盖要求
```typescript
// ✅ 完整的测试用例
describe('HistoryItem', () => {
  // 正常情况
  it('should render item content', () => {
    render(<HistoryItem item={mockItem} onSelect={jest.fn()} />);
    expect(screen.getByText(mockItem.content)).toBeInTheDocument();
  });
  
  // 边界情况
  it('should handle empty content', () => {
    render(<HistoryItem item={emptyItem} onSelect={jest.fn()} />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
  
  // 错误情况
  it('should handle invalid item gracefully', () => {
    expect(() => render(<HistoryItem item={null} onSelect={jest.fn()} />)).not.toThrow();
  });
});
```

## 🔧 代码风格

### TypeScript
- 使用 strict mode
- 所有变量必须有明确类型
- 禁止使用 `any` 类型（除非必要且有注释）

### Rust
- 使用 `clippy` 检查
- 所有 public 函数必须有文档注释
- 错误处理使用 `Result<T, E>`

### CSS
- 使用 CSS Modules 或 styled-components
- 遵循 BEM 命名规范
- 颜色使用 CSS 变量

## 📊 性能规范

### 响应时间要求
- **UI 渲染**: < 16ms (60 FPS)
- **API 调用**: < 100ms
- **剪贴板操作**: < 50ms

### 内存限制
- **前端**: < 100MB
- **后端**: < 50MB
- **总应用**: < 150MB

## 🔐 安全规范

### 数据存储
- 敏感数据加密存储
- 使用系统钥匙串存储密钥
- 定期清理过期数据

### 权限管理
- 最小权限原则
- 用户明确授权
- 权限请求有明确说明

---

**版本**: 1.0
**更新日期**: 2026-03-11
