# Klip Testing Strategy

## Overview

Klip uses a comprehensive testing strategy combining unit tests, E2E tests, and desktop-specific tests.

## Test Types

### 1. Unit Tests (Vitest)

**Purpose**: Test individual utility functions and logic

**Location**: `tests/*.test.ts`

**Configuration**: `vitest.config.ts`

**Status**: ✅ 132/132 passing

**Key Test Areas**:
- History management (validation, import/export, search, stats)
- Clipboard monitoring
- Snippet management (repository, storage, utils)
- Popup menu model
- Storage utilities (panel hotkey, paste mode, startup launch)
- Logger utility

**Run Command**:
```bash
npm run test
```

### 2. E2E Tests (Playwright)

**Purpose**: Test browser-based UI interactions

**Location**: `tests/e2e/*.spec.ts`

**Configuration**: `playwright.config.ts`

**Status**: ✅ 13/13 passing

**Key Test Areas**:
- Popup menu rendering and management views
- History search and copy functionality
- Snippet creation and management
- Settings persistence
- Keyboard navigation
- Folder operations (create, rename, delete)
- Input validation

**Run Command**:
```bash
npm run test:e2e
```

**Setup Requirements**:
- Playwright browsers must be installed: `npx playwright install`
- Development server will auto-start

### 3. Desktop Tests (Playwright + Tauri API)

**Purpose**: Test Tauri-specific desktop functionality

**Location**: `tests/desktop/*.spec.ts`

**Configuration**: `playwright.desktop.config.ts`

**Status**: ⏳ Ready (requires running application)

**Key Test Areas**:
- App lifecycle (start, hide, show)
- Window management
- System tray integration
- Global hotkeys
- Clipboard listener
- Direct paste functionality
- History persistence
- Search functionality
- Shortcuts
- Snippets

**Run Command**:
```bash
npm run test:desktop
```

**Setup Requirements**:
- Application must be built and running
- Tests use Tauri API directly (`@tauri-apps/api/core`, `@tauri-apps/api/window`)

## Testing Strategy

### Why Playwright + Tauri API (Hybrid Approach)?

**Official Tauri Recommendation**:
- E2E: WebDriver + tauri-driver
- ❌ macOS not supported (no WKWebView driver tool)
- ✅ Windows and Linux supported

**Our Hybrid Approach**:
- ✅ Cross-platform (including macOS)
- ✅ Leverages Playwright's powerful testing framework
- ✅ Direct access to Tauri API
- ✅ No WebDriver dependency
- ✅ Faster test execution

### Test Coverage

**Current Coverage**:
- Unit Tests: 132 tests covering core utilities
- E2E Tests: 13 tests covering browser-based UI
- Desktop Tests: 9 test files covering desktop-specific features

**Coverage Measurement**:
```bash
npm run test:coverage
```

## CI/CD Integration

**GitHub Actions**: `.github/workflows/` (if configured)

**Quality Assurance Command**:
```bash
npm run qa
```

This runs:
1. Lint (Biome)
2. TypeCheck
3. Unit Tests
4. E2E Tests
5. Build
6. Coverage Report
7. Cargo Check (Rust)

## Best Practices

### Writing Tests

1. **Unit Tests**:
   - Test one function/feature per test
   - Use descriptive test names
   - Mock external dependencies

2. **E2E Tests**:
   - Test user workflows, not implementation
   - Use page object models for complex interactions
   - Keep tests independent

3. **Desktop Tests**:
   - Test desktop-specific features only
   - Use Tauri API helpers (`tests/desktop/utils.ts`)
   - Handle app lifecycle properly

### Test Organization

```
tests/
├── *.test.ts           # Unit tests (Vitest)
├── e2e/                # E2E tests (Playwright)
│   ├── *.spec.ts
│   └── fixtures.ts
└── desktop/            # Desktop tests (Playwright + Tauri)
    ├── *.spec.ts
    └── utils.ts
```

## Troubleshooting

### Common Issues

1. **Playwright browsers not installed**:
   ```bash
   npx playwright install
   ```

2. **Desktop tests fail**:
   - Ensure app is built: `npm run build:desktop`
   - Run app before tests: `npm run dev:desktop`

3. **Coverage report not generated**:
   ```bash
   npm run test:coverage
   ```

## Future Improvements

1. **Visual Regression Testing**: Add screenshot comparison tests
2. **Performance Testing**: Add benchmarking for critical operations
3. **Accessibility Testing**: Add a11y compliance tests
4. **Integration Tests**: Add more comprehensive integration tests
5. **Mock Runtime**: Investigate Tauri's mock runtime for faster desktop tests

## References

- [Tauri Testing Documentation](https://v2.tauri.app/develop/tests/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
