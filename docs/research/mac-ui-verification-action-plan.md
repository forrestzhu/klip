# macOS UI Verification - Action Plan

- Created: 2026-04-02 05:03 AM
- Based on: `mac-ui-verification-research.md` (2026-03-11)
- Status: Planning phase

## Goal

Establish a reliable macOS native UI testing solution for Klip using XCUITest, complementing existing Playwright web-layer tests.

## Current State (2026-04-02)

- ✅ Playwright E2E: 13 scenarios covering popup/menu/search/snippets/settings
- ✅ Unit tests: 192 passing (Vitest)
- ❌ macOS native UI tests: Not yet implemented
- ❌ XCUITest project: Not created
- ⚠️ Appium tests: Exist (`tests/appium-popup.test.ts`) but require external server

## Recommended Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Klip Test Pyramid                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│         Native UI (XCUITest - Swift)                │
│         - Tray/menu bar                             │
│         - Global hotkey                             │
│         - Window focus/restore                      │
│         - Direct paste                              │
│         - Permission feedback                       │
│                                                     │
│    ──────────────────────────────────────────       │
│                                                     │
│         Web Layer (Playwright - TypeScript)         │
│         - Popup navigation                          │
│         - Search/filter                             │
│         - Snippet CRUD                              │
│         - Settings persistence                      │
│         - Visual regression                         │
│                                                     │
│    ──────────────────────────────────────────       │
│                                                     │
│         Unit Tests (Vitest - TypeScript)            │
│         - Business logic                            │
│         - Utilities                                 │
│         - Repository layer                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Phase 1: Setup & Infrastructure (Week 1)

### 1.1 Create XCUITest Project Structure

```
klip/
├── src-tauri/
│   ├── src/
│   ├── tests/          ← NEW: XCUITest project
│   │   ├── KlipUITests/
│   │   │   ├── KlipUITests.swift
│   │   │   ├── KlipUITestsLaunchTests.swift
│   │   │   └── Info.plist
│   │   └── KlipUITests.xcodeproj
│   └── Cargo.toml
└── package.json
```

**Tasks**:
- [ ] Create Xcode project for UI tests
- [ ] Configure test target to launch Klip app
- [ ] Set up test scheme for CI integration
- [ ] Document Xcode version requirement

### 1.2 Testability Enhancements

Add accessibility identifiers to Klip's native components:

**Rust backend** (`src-tauri/src/`):
- [ ] Add `accessibility_title` to main window
- [ ] Add `accessibility_role` to panel presenter
- [ ] Ensure tray icon has proper accessibility label
- [ ] Add test-only commands for state inspection

**Tauri config** (`src-tauri/tauri.conf.json`):
- [ ] Set consistent `bundle_identifier` for test targeting
- [ ] Configure window properties for testability

### 1.3 Local Development Setup

**Requirements**:
- macOS 14+ (current CI runner)
- Xcode 15+ (command line tools)
- Klip app built and signed (even ad-hoc)

**Setup script** (`scripts/setup-xcuitest.sh`):
```bash
#!/bin/bash
# 1. Check Xcode installation
# 2. Verify Klip bundle exists
# 3. Create test scheme
# 4. Run smoke test
```

## Phase 2: Core Test Cases (Week 2)

### 2.1 High-Priority Scenarios

Based on risk assessment, implement these 5 tests first:

**Test 1: App Launch & Tray Presence**
```swift
func testAppLaunchesAndShowsTrayIcon() {
    let app = XCUIApplication()
    app.launch()
    
    // Verify app is running
    XCTAssertTrue(app.isRunning)
    
    // Verify system menu bar shows Klip icon
    // (requires system-wide element query)
}
```

**Test 2: Hotkey Opens Popup**
```swift
func testGlobalHotkeyOpensPopup() {
    let app = XCUIApplication()
    app.launch()
    
    // Simulate Cmd+Shift+V
    app.typeKey(.v, modifierFlags: [.command, .shift])
    
    // Verify popup window appears
    let popup = app.windows["Klip Popup"]
    XCTAssertTrue(popup.waitForExistence(timeout: 3))
}
```

**Test 3: Popup Focus & Hide**
```swift
func testPopupHidesOnEscape() {
    let app = XCUIApplication()
    app.launch()
    
    // Open popup
    app.typeKey(.v, modifierFlags: [.command, .shift])
    
    // Press Escape
    app.typeKey(.escape)
    
    // Verify popup is hidden
    let popup = app.windows["Klip Popup"]
    XCTAssertFalse(popup.exists)
}
```

**Test 4: Direct Paste Flow**
```swift
func testDirectPasteToTextEdit() {
    let app = XCUIApplication()
    app.launch()
    
    // Launch TextEdit with sample text
    let textEdit = XCUIApplication(bundleIdentifier: "com.apple.TextEdit")
    textEdit.launch()
    
    // Copy text to clipboard
    NSPasteboard.general.clearContents()
    NSPasteboard.general.setString("Test clipboard", forType: .string)
    
    // Open Klip and trigger paste
    app.typeKey(.v, modifierFlags: [.command, .shift])
    // ... select first item ...
    
    // Verify text appeared in TextEdit
    let textView = textEdit.textViews.firstMatch
    XCTAssertTrue(textView.stringValue.contains("Test clipboard"))
}
```

**Test 5: Permission Denied Feedback**
```swift
func testDirectPasteShowsPermissionWarning() {
    // This requires mocking Accessibility permission state
    // May need test helper or manual verification
}
```

## Phase 3: CI Integration (Week 3)

### 3.1 GitHub Actions Workflow

Create `.github/workflows/macos-ui-tests.yml`:

```yaml
name: macOS UI Tests

on:
  push:
    branches: [main]
  pull_request:
    paths:
      - 'src-tauri/**'
      - 'src-tauri/tests/**'

jobs:
  xcuitest:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      
      - name: Build Klip
        run: npm run build:desktop
      
      - name: Run XCUITest
        run: |
          cd src-tauri/tests
          xcodebuild test \
            -project KlipUITests.xcodeproj \
            -scheme KlipUITests \
            -destination 'platform=macOS'
```

### 3.2 Test Reporting

- [ ] Configure JUnit XML output
- [ ] Upload test artifacts to GitHub
- [ ] Add test status badge to README

## Phase 4: Advanced Scenarios (Week 4+)

### 4.1 Cross-Application Workflows

- Multi-monitor setup
- Full-screen app interactions
- Space switching behavior
- Background/foreground lifecycle

### 4.2 Performance Testing

- Popup show latency (<100ms target)
- Clipboard monitor responsiveness
- Memory usage over time

### 4.3 Accessibility Compliance

- VoiceOver compatibility
- Keyboard-only navigation
- High contrast mode

## Known Challenges

### Challenge 1: System-Level Permissions

**Problem**: XCUITest cannot easily mock TCC (Transparency, Consent, Control) permissions.

**Workarounds**:
1. Pre-grant permissions in CI runner setup
2. Use separate test build with entitlements
3. Document manual verification steps for permission flows

### Challenge 2: Menu Bar Icon Detection

**Problem**: System menu bar items are not directly accessible via `XCUIApplication`.

**Approaches**:
1. Use `AXUIElement` API for system-wide queries
2. Verify through app behavior (click tray → popup appears)
3. Accept as manual smoke test

### Challenge 3: Test Flakiness

**Problem**: UI tests involving timing, focus, and external apps are inherently flaky.

**Mitigation**:
- Use explicit waits (`waitForExistence`)
- Add retry logic in CI
- Keep tests deterministic (no random data)
- Isolate test state (clean clipboard, reset settings)

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Native UI test coverage | 80% of risk scenarios | 0% |
| Test execution time | <5 minutes | N/A |
| Flakiness rate | <5% | N/A |
| CI pass rate | >95% | N/A |

## Next Immediate Actions

1. **Create XCUITest project skeleton** (30 min)
2. **Add accessibility identifiers to Klip windows** (1 hour)
3. **Implement first smoke test** (launch + verify running) (1 hour)
4. **Document setup process** (30 min)
5. **Run locally and iterate** (2 hours)

## References

- Research: `docs/research/mac-ui-verification-research.md`
- Apple Docs: https://developer.apple.com/documentation/xctest
- Tauri Tests: https://v2.tauri.app/develop/tests/
- Existing Playwright: `tests/e2e/browser-preview.spec.ts`

---

**Last Updated**: 2026-04-02 05:03 AM  
**Owner**: @forrestzhu (with AI assistance)
