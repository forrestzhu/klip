# Project Progress Log

This file is append-only. Add one entry after each completed iteration.

## 2026-03-18 - Health Check Script & Tests

- Commit: `fd12ddd`
- Summary:
  - Added `scripts/health-check.sh` for quick project state verification
  - Added `tests/health-check.test.ts` with 7 test cases
  - Updated AGENTS.md with health check usage documentation
  - Updated README.md with latest progress
  - Added timestamp output to health check script
  - Added colored output (green=pass, red=fail)
  - Added helpful tip when working tree is dirty
  - Added health check section to README Quick Start
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass (187 tests, 3 skipped)
  - build: pass
  - cargo:check: pass
- Risks / Follow-ups:
  - Health check script tests may timeout in slow environments (non-critical)
  - Continue Phase 3 enhancements after documentation complete

---

## 2026-03-18 - Status Documentation Update

- Commit: `a50a91a`
- Summary:
  - Updated `docs/status/current.md` with latest commit hash and clean working tree status
  - Verified all quality gates remain passing (lint, typecheck, test, build, cargo:check)
  - Project in maintenance mode: waiting on macOS permissions for UI automation testing
  - Core features complete: History + Snippets + Tray + Global Hotkey + Direct Paste + Browser Preview
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass (85+ tests)
  - build: pass
  - cargo:check: pass
  - test:e2e: pass (13 Playwright scenarios)
- Risks / Follow-ups:
  - macOS Accessibility/Automation permissions required for UI testing
  - Manual desktop verification pending for direct paste and fullscreen behavior
  - Windows packaging verification incomplete

---

## Entry Template

```text
## YYYY-MM-DD - <short scope>
- Commit: <hash or pending>
- Summary:
  - <change 1>
  - <change 2>
- Validation:
  - lint: pass|fail|skip
  - typecheck: pass|fail|skip
  - test: pass|fail|skip
  - build: pass|fail|skip
  - cargo:check: pass|fail|skip
  - test:e2e: pass|fail|skip
- Risks / Follow-ups:
  - <risk or next step>
```

## 2026-03-04 - tauri tray menu bar baseline (US-003)

- Commit: `pending`
- Summary:
  - Switched Tauri backend from scaffold print entry to real runtime boot (`src-tauri/src/main.rs` + `src-tauri/src/lib.rs`).
  - Added tray/menu bar module (`src-tauri/src/tray.rs`) with icon left-click open panel, menu open panel, and quit action.
  - Added close-to-hide behavior so app keeps resident and exits explicitly from tray menu.
  - Added Tauri build script, pinned compatible transitive crates for Rust 1.84, and minimum RGBA tray icon asset (`src-tauri/icons/icon.png`).
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - cargo:check: pass
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Desktop manual verification on macOS/Windows tray UX is still pending.
  - Global hotkey (US-004) and native direct paste path (US-006/US-008) remain next priorities.

## 2026-03-04 - snippets baseline and dual-mode panel

- Commit: `9e39d32`
- Summary:
  - Added snippets domain (`src/features/snippets`) with folder/snippet repository, storage, and utility modules.
  - Added snippets tests and coverage for repository/storage/utils.
  - Integrated History/Snippets dual-mode panel, mode persistence, and keyboard mode switching in `src/App.tsx`.
  - Added snippets CRUD/folder management UI and clipboard copy fallback action.
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - cargo:check: pass
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Direct paste injection is still missing (clipboard fallback only).
  - Global hotkey and tray/menu bar workflows are not implemented yet.

## 2026-03-04 - history backend persistence baseline

- Commit: `e592855`
- Summary:
  - Added Tauri-side history model, storage, and repository baseline modules.
  - Kept backend as scaffolded runtime without tray/hotkey/direct-paste integration.
- Validation:
  - cargo:check: pass
- Risks / Follow-ups:
  - Platform runtime integration is still pending.

## 2026-03-04 - global hotkey registration baseline (US-004)

- Commit: `pending`
- Summary:
  - Added Tauri global hotkey module with default panel shortcut registration, dynamic rebind, rollback-on-failure, and conflict-aware error mapping (`src-tauri/src/hotkey.rs`).
  - Wired global shortcut plugin and panel open handler into runtime startup and exposed frontend commands for hotkey apply + `Esc` hide (`src-tauri/src/lib.rs`, `src-tauri/src/tray.rs`).
  - Added frontend settings baseline for panel shortcut persistence/runtime bridge and integrated hotkey controls into app header (`src/features/settings`, `src/App.tsx`, `src/styles.css`).
  - Added test coverage for hotkey storage and Rust hotkey utility logic (`tests/panelHotkeyStorage.test.ts`, `src-tauri/src/hotkey.rs` tests).
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - cargo:check: pass
  - cargo:test: pass
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Need desktop manual verification evidence for hotkey conflict messaging and foreground focus behavior on macOS/Windows.
  - Direct paste implementation is still pending (US-006/US-008).

## 2026-03-04 - direct paste abstraction baseline (US-006/US-008)

- Commit: `pending`
- Summary:
  - Added Tauri direct-paste backend module (`src-tauri/src/direct_paste.rs`) with input validation, system clipboard write, platform paste trigger attempts (macOS `osascript`, Windows `SendKeys`), and structured fallback response.
  - Exposed new Tauri command `direct_paste_text` and wired it into runtime invoke handler (`src-tauri/src/lib.rs`).
  - Added frontend direct-paste runtime adapter (`src/features/paste`) and switched history/snippet selection actions to use direct paste first, then clipboard fallback with visible UI messaging (`src/App.tsx`).
  - Added Rust unit tests for direct-paste module normalization and mode behavior.
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - cargo:check: pass
  - cargo:test: pass
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Needs desktop manual verification on macOS/Windows for permission prompts, foreground focus behavior, and app compatibility.
  - Snippet quick trigger mode (global shortcut/alias) is still pending (US-008 remaining scope).

## 2026-03-04 - runtime baseline commit and status sync

- Commit: `30a6501`
- Summary:
  - Committed runtime baseline covering global hotkey registration/conflict feedback and direct paste abstraction with clipboard fallback.
  - Kept frontend panel actions aligned with backend direct paste path and visible fallback messaging.
  - Refreshed `docs/status/current.md` snapshot to point to latest commit for resumable sessions.
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - cargo:check: pass
  - cargo:test: pass
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Manual desktop verification is still required for hotkey/direct-paste behavior on macOS and Windows.
  - Dedicated settings center (US-010) and snippet quick trigger (US-008) remain next implementation scope.

## 2026-03-04 - settings center baseline + desktop startup smoke unblock (US-010/US-001)

- Commit: `pending`
- Summary:
  - Added dedicated settings center mode in panel (`Ctrl/Cmd+3`) and moved settings controls out of top header (`src/App.tsx`, `src/styles.css`).
  - Added paste mode persistence (`direct-with-fallback` and `clipboard-only`) and wired runtime behavior to honor clipboard-only path for basic desktop reliability testing (`src/features/settings/pasteModeStorage.ts`, `src/App.tsx`).
  - Added local desktop runtime scripts and Tauri CLI dependency (`package.json`, `package-lock.json`, `README.md`) so `npm run dev:desktop` can launch Tauri directly.
  - Fixed Tauri runtime error `Can only call Window.setTimeout on instances of Window` by binding default timer APIs to `globalThis` in clipboard monitor; added regression coverage (`src/features/history/clipboardMonitor.ts`, `tests/clipboardMonitor.test.ts`).
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - cargo:check: pass
  - test:e2e: skip (Playwright not configured)
  - tauri:info: pass (warning: Xcode not installed)
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri`)
- Risks / Follow-ups:
  - Local environment is currently Node `v25.2.1`; project target is Node 22 (`.nvmrc`), so `nvm use` is recommended before further validation.
  - Full macOS/Windows manual verification evidence for tray/hotkey/direct-paste behavior is still pending.
  - US-010 startup-launch toggle/runtime bridge is still pending.

## 2026-03-04 - desktop clipboard capture bridge for history monitor (US-001)

- Commit: `pending`
- Summary:
  - Added Tauri clipboard command module (`src-tauri/src/clipboard.rs`) with `read_clipboard_text` and `write_clipboard_text` for desktop runtime use.
  - Registered clipboard commands in Tauri invoke handler (`src-tauri/src/lib.rs`) so frontend can access system clipboard through Rust runtime.
  - Added runtime-aware clipboard port selection (`createClipboardPort`) to route desktop runtime reads/writes through Tauri commands while preserving browser fallback (`src/features/history/browserClipboard.ts`, `src/features/history/index.ts`).
  - Switched app initialization from browser-only clipboard port to runtime-aware port so copied content can flow into history in desktop mode (`src/App.tsx`).
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - cargo:check: pass
  - cargo:test: pass
  - test:e2e: skip (Playwright not configured)
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri`)
- Risks / Follow-ups:
  - Clipboard monitor is still polling-based; event-driven OS listener integration is not implemented yet.
  - Need manual verification matrix across macOS/Windows apps for clipboard-read reliability and duplicate suppression behavior.

## 2026-03-04 - commit message template enforcement baseline

- Commit: `pending`
- Summary:
  - Added required commit body template sections (`What changes`, `Why needed`, `How tested`) into repository guidelines (`AGENTS.md`, `README.md`).
  - Tightened commitlint policy to reject empty commit bodies and require body-leading blank line (`.commitlintrc.json`).
  - Added commit message validator script and wired it into Husky `commit-msg` hook so commits with header-only or missing required sections are rejected (`scripts/validate-commit-message.mjs`, `.husky/commit-msg`).
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass
  - test:coverage: pass
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - cargo:check: pass
  - cargo:test: pass
  - tauri:info: pass (warning: Xcode not installed)
- Risks / Follow-ups:
  - Merge/revert commits are intentionally exempt from template validation.

## 2026-03-04 - local desktop startup and baseline qa verification

- Commit: `pending`
- Summary:
  - Read `docs/status/current.md`, `docs/status/prd-tracker.md`, and recent commit history to resume from latest baseline (`9fa6085`).
  - Ran `npm run dev:desktop` and confirmed desktop runtime startup (`Running target/debug/klip-tauri`); Vite auto-switched to port `5174` because `5173` was already in use.
  - Ran `npm run qa`; lint/typecheck/unit tests/build/coverage/cargo check all passed, and e2e remained intentionally skipped without Playwright setup.
  - Synced status snapshot and PRD tracker evidence for this local startup + basic test iteration.
- Validation:
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri`)
  - lint: pass
  - typecheck: pass
  - test: pass (51 tests)
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - test:coverage: pass (statements 89.97%, branches 87.26%, funcs 89.41%, lines 89.97%)
  - cargo:check: pass
- Risks / Follow-ups:
  - Local environment is still Node `v25.2.1`; project target remains Node 22 for consistent team/CI behavior.
  - Manual verification matrix for US-001/US-006 and startup-launch toggle implementation for US-010 remain next scope.

## 2026-03-04 - manual verification matrix baseline for US-001/US-003/US-004/US-006

- Commit: `pending`
- Summary:
  - Added a dedicated manual verification matrix for clipboard capture/tray/hotkey/direct-paste scenarios across macOS and Windows (`docs/status/manual-verification-us001-us006.md`).
  - Recorded local machine baseline (macOS 15.7.4, Node `v25.2.1`) and attached reproducible startup log evidence at `/tmp/klip-dev-desktop-20260304.log`.
  - Re-ran desktop startup preflight (`npm run dev:desktop`) and confirmed runtime reaches `Running target/debug/klip-tauri`.
  - Re-ran baseline gates (`npm run qa`) and Rust unit suite (`cargo test --manifest-path src-tauri/Cargo.toml`) for verification evidence refresh.
  - Synced `docs/status/current.md` and `docs/status/prd-tracker.md` to reference this matrix and next manual execution scope.
- Validation:
  - dev:desktop smoke: pass (log evidence includes `Running target/debug/klip-tauri`)
  - lint: pass
  - typecheck: pass
  - test: pass (51 tests)
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - test:coverage: pass (statements 89.97%, branches 87.26%, funcs 89.41%, lines 89.97%)
  - cargo:check: pass
  - cargo:test: pass (23 tests)
- Risks / Follow-ups:
  - Manual matrix rows are still `pending`; interactive GUI verification on macOS and Windows is not yet executed in this terminal-only session.
  - Local runtime still uses Node `v25.2.1`; project target remains Node 22 for team/CI parity.

## 2026-03-04 - panel hotkey default and display normalization update (US-004)

- Commit: `pending`
- Summary:
  - Changed panel hotkey default from `CommandOrControl+Shift+K` to `CommandOrControl+Shift+V` in frontend and Tauri runtime (`src/features/settings/hotkey.constants.ts`, `src-tauri/src/hotkey.rs`).
  - Added legacy-default migration so stored old defaults (`CommandOrControl+Shift+K` and `shift+super+KeyK`) are auto-upgraded to the new default in settings storage (`src/features/settings/hotkeyStorage.ts`).
  - Added hotkey display formatter to render normalized runtime strings (for example `shift+super+KeyV`) as readable labels (for example `Cmd+Shift+V`) in Settings, and updated user-facing messaging/placeholder text (`src/features/settings/hotkeyDisplay.ts`, `src/features/settings/index.ts`, `src/App.tsx`).
  - Added new tests for hotkey display formatting and legacy storage migration (`tests/panelHotkeyDisplay.test.ts`, `tests/panelHotkeyStorage.test.ts`).
  - Updated manual verification matrix default shortcut reference to `CommandOrControl+Shift+V` (`docs/status/manual-verification-us001-us006.md`).
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass (57 tests)
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - test:coverage: pass (statements 87.55%, branches 85.57%, funcs 88.88%, lines 87.55%)
  - cargo:check: pass
  - cargo:test: pass (23 tests)
  - dev:desktop smoke: pass (log evidence `/tmp/klip-dev-desktop-hotkey-20260304.log`, reached `Running target/debug/klip-tauri`)
- Risks / Follow-ups:
  - Interactive hotkey conflict/focus behavior validation on macOS and Windows is still pending in `docs/status/manual-verification-us001-us006.md`.
  - Local runtime is still Node `v25.2.1`; project target remains Node 22.

## 2026-03-04 - panel hotkey canonical input normalization follow-up

- Commit: `pending`
- Summary:
  - Fixed remaining UX inconsistency where panel hotkey input could still display runtime-normalized strings like `shift+super+KeyV` after registration.
  - Updated hotkey storage normalization to canonicalize runtime tokens before persistence/input value rendering (for example `shift+super+KeyV` -> `CommandOrControl+Shift+V`) in `src/features/settings/hotkeyStorage.ts`.
  - Added regression coverage for runtime-format canonicalization in `tests/panelHotkeyStorage.test.ts`.
- Validation:
  - lint: pass
  - test: pass (58 tests)
- Risks / Follow-ups:
  - Cross-platform interactive manual verification for hotkey conflict/focus/escape behavior remains pending in `docs/status/manual-verification-us001-us006.md`.

## 2026-03-04 - panel hotkey draft canonicalization follow-up

- Commit: `pending`
- Summary:
  - Addressed remaining inconsistency where settings input could still show runtime-formatted `shift+super+KeyV` after app restart.
  - Exported canonicalizer in settings hotkey storage and reused it in App hotkey draft `onChange` + apply flow, so input state is kept canonical (`CommandOrControl+Shift+V`).
  - Added read-path normalization regression test for existing runtime-format storage value (`tests/panelHotkeyStorage.test.ts`).
- Validation:
  - lint: pass
  - test: pass (59 tests)
- Risks / Follow-ups:
  - Cross-platform interactive manual verification for hotkey conflict/focus/escape behavior remains pending in `docs/status/manual-verification-us001-us006.md`.

## 2026-03-04 - panel hotkey runtime return canonicalization follow-up

- Commit: `pending`
- Summary:
  - Added canonicalization in desktop hotkey runtime bridge so Tauri-returned shortcut strings are normalized before UI state update (`src/features/settings/hotkeyRuntime.ts`).
  - Hardened App hotkey initialization/apply paths to normalize values before state assignment, preventing restart-time reappearance of runtime format strings (`src/App.tsx`).
- Validation:
  - lint: pass
  - test: pass (59 tests)
- Risks / Follow-ups:
  - Interactive macOS/Windows manual verification of hotkey conflict/focus/escape behavior remains pending in `docs/status/manual-verification-us001-us006.md`.

## 2026-03-04 - panel hotkey token-based canonicalization hardening

- Commit: `pending`
- Summary:
  - Hardened hotkey canonicalization to extract alphanumeric tokens instead of splitting only on `+`, so runtime variants like `shift super KeyV` and `shift+super+KeyV` normalize identically (`src/features/settings/hotkeyStorage.ts`).
  - Added regression test for non-plus separator runtime format normalization (`tests/panelHotkeyStorage.test.ts`).
  - Revalidated local quality gates after hardening update.
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass (60 tests)
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - test:coverage: pass (statements 87.37%, branches 85.88%, funcs 89.01%, lines 87.37%)
  - cargo:check: pass
  - cargo:test: pass (23 tests)
- Risks / Follow-ups:
  - User still reports seeing `shift+super+KeyV` in panel hotkey input after restart; interactive runtime repro evidence is pending to confirm whether the latest hardening fully resolves this path.
  - Cross-platform interactive manual verification for hotkey conflict/focus/escape behavior remains pending in `docs/status/manual-verification-us001-us006.md`.

## 2026-03-04 - settings startup-launch toggle and runtime bridge baseline (US-010)

- Commit: `pending`
- Summary:
  - Implemented settings startup-launch persistence module and desktop runtime bridge in frontend (`src/features/settings/startupLaunchStorage.ts`, `src/features/settings/startupLaunchRuntime.ts`, `src/features/settings/index.ts`, `src/App.tsx`).
  - Added settings panel launch-on-login toggle UI and status messaging with browser-preview fallback behavior (`src/App.tsx`, `src/styles.css`).
  - Added Tauri startup-launch command module and registered commands/plugin integration (`src-tauri/src/startup_launch.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/commands.rs`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`).
  - Added startup-launch storage unit coverage (`tests/startupLaunchStorage.test.ts`) and revalidated baseline quality gates.
  - Synced status snapshot and PRD tracker to reflect US-010 scope completion baseline and remaining manual verification scope.
- Validation:
  - format: pass (`npm run format`)
  - lint: pass
  - typecheck: pass
  - test: pass (65 tests)
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - test:coverage: pass (statements 86.55%, branches 86.47%, funcs 87.5%, lines 86.55%)
  - cargo:check: pass
  - cargo:test: pass (24 tests)
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri` before 35s command timeout)
- Risks / Follow-ups:
  - Manual matrix execution is still pending for macOS/Windows interactive GUI workflows; startup-launch behavior still needs cross-platform hands-on evidence.
  - US-011 packaging/install verification workflow remains todo.
  - Local runtime is still Node `v25.2.1`; project target remains Node 22.

## 2026-03-04 - desktop packaging verification baseline (US-011)

- Commit: `pending`
- Summary:
  - Enabled desktop bundle mode and added explicit packaging scripts for local/CI use (`package.json`, `src-tauri/tauri.conf.json`).
  - Added cross-platform packaging workflow baseline for macOS + Windows artifact generation and upload (`.github/workflows/desktop-packaging.yml`).
  - Added US-011 status document with artifact checklist, install/run/uninstall matrix, and release-note permission/limitation draft (`docs/status/packaging-verification-us011.md`).
  - Added README packaging baseline command guidance and status-doc pointer (`README.md`).
  - Executed local macOS bundle preflight and produced unsigned artifacts: `src-tauri/target/release/bundle/macos/Klip.app` and `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`.
- Validation:
  - tauri:info: pass (log: `/tmp/klip-tauri-info-us011-20260304.log`; warning: Xcode app not installed)
  - build:desktop:bundle:macos: pass (log: `/tmp/klip-build-bundle-macos-us011-20260304.log`)
  - lint: pass
  - typecheck: pass
  - test: pass (65 tests)
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - test:coverage: pass (statements 86.55%, branches 86.47%, funcs 87.5%, lines 86.55%)
  - cargo:check: pass
  - qa: pass (`npm run qa`)
- Risks / Follow-ups:
  - Windows installer artifact generation evidence is still pending until workflow execution on `windows-latest`.
  - Interactive install/first-run/uninstall verification is still pending for macOS and Windows.
  - Local runtime is still Node `v25.2.1`; project target remains Node 22.

## 2026-03-04 - clipy-style compact popup menu and editor split baseline

- Commit: `ff8a4d2`
- Summary:
  - Reworked panel UX from tri-mode tabs into Clipy-style compact popup hierarchy with root entries: `History`, `Snippets`, `Edit Snippets...`, and `Preferences...` (`src/App.tsx`).
  - Added popup menu model module for history range grouping (`1-10`, `11-20`, `21-30`), snippet folder submenus, and breadcrumb path resolution (`src/features/menu/popupMenuModel.ts`).
  - Added popup keyboard navigation parity baseline: `↑/↓` selection, `←/→` submenu traversal, and `Enter` select/paste action (`src/App.tsx`).
  - Split compact popup and expanded editor/preferences layouts; added runtime window-size switching and updated base desktop window size to compact defaults (`src/App.tsx`, `src/styles.css`, `src-tauri/tauri.conf.json`).
  - Changed default history capacity to 30 to match popup baseline expectations (`src/features/history/history.constants.ts`).
  - Added unit tests for popup hierarchy and history grouping logic (`tests/popupMenuModel.test.ts`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass
  - typecheck: pass
  - test: pass (68 tests)
  - test:e2e: skip (Playwright not configured)
  - build: pass
  - test:coverage: pass (statements 87.62%, branches 86.77%, funcs 87.25%, lines 87.62%)
  - cargo:check: pass
  - qa: pass (`npm run qa`)
  - dev:desktop smoke: pass (log: `/tmp/klip-dev-desktop-menu-rework-20260304.log`, reached `Running target/debug/klip-tauri`)
- Risks / Follow-ups:
  - Clipy-style popup/menu behavior still needs interactive hands-on verification (submenu traversal, paste hide, focus return) on macOS and Windows.
  - Expanded `Edit Snippets...` and `Preferences...` transition flows need manual UX verification in desktop runtime.
  - Local runtime is still Node `v25.2.1`; project target remains Node 22.

## 2026-03-04 - three-window clipy parity design spec (planning)

- Commit: `pending`
- Summary:
  - Added a dedicated design spec for strict three-window parity with Clipy:
    - popup-only quick paste window
    - standalone snippet editor window
    - standalone preferences window
  - Documented target information architecture, window sizing baselines, keyboard/focus behaviors, and 1:1 acceptance checklist in `docs/plans/2026-03-04-three-window-clipy-parity-design.md`.
  - Added required screenshot list to unblock pixel-level style parity decisions.
  - Synced status snapshot and PRD tracker to point implementation to this design-first step.
- Validation:
  - docs update only; no runtime command executed in this planning iteration.
- Risks / Follow-ups:
  - Pixel-level parity still depends on user-provided reference screenshots (popup root/submenu, snippet editor, preferences tabs).
  - Implementation is still pending for strict three-window runtime behavior.

## 2026-03-04 - popup window parity implementation (three-window phase 1)

- Commit: `pending`
- Summary:
  - Reworked popup menu model to match Clipy screenshot structure: flattened root history/snippet sections, grouped history ranges, action rows (`清除历史`/`编辑片断...`/`偏好设置...`/`退出 Klip`), and conditional snippets section visibility (`src/features/menu/popupMenuModel.ts`).
  - Rebuilt popup rendering/interaction to cascading multi-column menu behavior with section/separator rows, submenu hover-open, keyboard navigation that skips non-selectable rows, and snippet content preview pane (`src/App.tsx`, `src/styles.css`).
  - Added popup action runtime support: history clear repository API and desktop quit command bridge (`src/features/history/historyRepository.ts`, `src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`).
  - Updated desktop compact popup baseline size (`src/App.tsx`, `src-tauri/tauri.conf.json`) and refreshed popup/history unit coverage (`tests/popupMenuModel.test.ts`, `tests/historyRepository.test.ts`).
- Validation:
  - format: pass
  - lint: pass
  - typecheck: pass
  - test: pass (71 tests)
  - build: pass
  - cargo:check: pass
  - cargo:test: pass (24 tests)
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri` before 45s command timeout)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Popup is now close to screenshot parity, but `编辑片断...` and `偏好设置...` still reuse current webview instead of opening independent windows.
  - Snippet editor/preferences pixel-level parity to `docs/clipy_ui/snippet_edit.png` and `docs/clipy_ui/settings*.png` is still pending.

## 2026-03-04 - popup shell and titlebar controls fix

- Commit: `pending`
- Summary:
  - Removed popup wrapper spacing so popup content fills the window directly, avoiding the large outer container look (`src/styles.css`).
  - Added desktop runtime window chrome switching: menu mode disables decorations/resizable (hides macOS close/min/max controls), non-menu mode restores them (`src/App.tsx`).
  - Updated Tauri main window defaults to undecorated/non-resizable for popup-first startup (`src-tauri/tauri.conf.json`).
- Validation:
  - format: pass
  - lint: pass
  - typecheck: pass
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri` before 30s command timeout)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Current implementation still multiplexes popup/snippet/settings in one webview; strict three-window split remains pending.

## 2026-03-04 - popup resize error hotfix

- Commit: `pending`
- Summary:
  - Removed runtime `setDecorations`/`setResizable` toggles from popup resize path because they could fail and block `setSize`, causing popup to stay in large window dimensions (`src/App.tsx`).
  - Improved frontend runtime error parsing to surface `message` from non-`Error` rejection payloads (`src/App.tsx`).
- Validation:
  - format: pass
  - lint: pass
  - typecheck: pass
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri` before 30s command timeout)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - If popup still appears oversized on existing process, a full desktop app restart is required to clear old window state.

## 2026-03-04 - popup content-size sync follow-up

- Commit: `pending`
- Summary:
  - Removed dependency-based popup resize triggering and switched to `ResizeObserver` on rendered popup container so submenu open/close can drive deterministic window resizing (`src/App.tsx`).
  - Updated popup container styling to remove outer shell panel look and keep only menu column panels, avoiding the large-window wrapping-small-window visual issue (`src/styles.css`).
  - Set Tauri main window `resizable` back to `true` so runtime `setSize` can apply reliably while keeping undecorated popup startup (`src-tauri/tauri.conf.json`).
- Validation:
  - format: pass
  - lint: pass
  - typecheck: pass
  - test: pass (71 tests)
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri`)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Strict three-window split is still pending; current iteration focuses on popup shell/layout/resize behavior only.

## 2026-03-04 - popup parity commit sync and capability follow-up

- Commit: `0e2abb9`
- Summary:
  - Synced popup flow changes for commit readiness: flattened Clipy-style popup structure, cascading submenu interaction, clear-history action, quit command bridge, and content-driven resize behavior (`src/App.tsx`, `src/features/menu/popupMenuModel.ts`, `src/features/history/historyRepository.ts`, `src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`, `src/styles.css`).
  - Added Tauri main-window capability config for popup runtime window operations (`src-tauri/capabilities/default.json`) and kept popup-oriented window defaults (`src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`).
  - Added popup badcase screenshot artifacts for local visual verification and issue traceability (`docs/klip-test-ui/chrome_localhost_popup.png`, `docs/klip-test-ui/popup-badcase.png`, `docs/klip-test-ui/popup-badcase2.png`, `docs/klip-test-ui/popup-panel-badcase3.png`).
  - Refreshed status docs for latest validation evidence and current US-009 progress (`docs/status/current.md`, `docs/status/prd-tracker.md`, `docs/status/progress-log.md`).
- Validation:
  - lint: pass
  - typecheck: pass
  - test: pass (71 tests)
  - build: pass
  - cargo:check: pass
  - cargo:test: pass (24 tests)
  - dev:desktop smoke: pass (reached `Running target/debug/klip-tauri`; Vite switched to `5174` because `5173` was occupied)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Popup badcase still needs interactive GUI verification against new screenshot artifacts.
  - Strict three-window split (`snippet-editor` / `preferences` standalone windows) remains pending.

## 2026-03-04 - ci npm install stability hardening

- Commit: `pending`
- Summary:
  - Reviewed failing CI run `22661252459` across `ubuntu-latest`, `windows-latest`, and `macos-latest`; all jobs failed at `npm ci` with `Exit handler never called` while using Node `22.22.0` and npm `10.9.4`.
  - Hardened quality workflow install path by pinning setup-node to explicit `22.22.0`, explicitly setting npm `10.9.4`, disabling Husky in CI install, adding retry + cache clean around `npm ci`, and printing npm debug logs on final failure (`.github/workflows/ci.yml`).
  - Updated status artifacts to capture this CI stabilization iteration (`docs/status/current.md`, `docs/status/prd-tracker.md`, `docs/status/progress-log.md`).
- Validation:
  - lint: pass (`npm run lint`)
  - typecheck: skip (workflow/docs-only change)
  - test: skip (workflow/docs-only change)
  - build: skip (workflow/docs-only change)
  - cargo:check: skip (workflow/docs-only change)
- Risks / Follow-ups:
  - CI re-run is required to confirm this hardening resolves recurring `npm ci` internal failures on all three OS jobs.

## 2026-03-04 - ci registry root-cause fix for npm ci timeouts

- Commit: `pending`
- Summary:
  - Inspected failed CI run `22670335659` and extracted Windows job debug logs; repeated `npm ci` failures showed `ETIMEDOUT` against `https://registry.anpm.alibaba-inc.com/...` tarball URLs, then npm terminated with `Exit handler never called`.
  - Added repo-level npm registry pin (`.npmrc`) to `https://registry.npmjs.org/` to prevent host-specific mirror leakage into installs.
  - Normalized `package-lock.json` resolved tarball hosts from `registry.anpm.alibaba-inc.com` to `registry.npmjs.org` so GitHub runners can fetch dependencies reliably.
  - Updated CI workflow to enforce npmjs registry via `setup-node` (`registry-url`) and install-step env (`NPM_CONFIG_REGISTRY`), while keeping existing retry and debug-log capture (`.github/workflows/ci.yml`).
- Validation:
  - lint: pass (`npm run lint`)
  - install smoke: pass (`npm ci --ignore-scripts`)
  - evidence: extracted failed job logs show `ETIMEDOUT` to `registry.anpm.alibaba-inc.com` before npm internal crash (`run 22670335659`, Windows job `65712463493`)
  - typecheck: skip (dependency/CI config iteration)
  - test: skip (dependency/CI config iteration)
  - build: skip (dependency/CI config iteration)
  - cargo:check: skip (dependency/CI config iteration)
- Risks / Follow-ups:
  - Current CI run `22670335659` started before this lockfile/registry fix; re-run is required on the new commit to verify all three OS jobs install from npmjs successfully.

## 2026-03-04 - ci post-npm follow-up fixes (windows lint + ubuntu cargo)

- Commit: `pending`
- Summary:
  - Verified npm root-cause fix effectiveness: in run `22672192432`, `Install Node dependencies` passed on Ubuntu/macOS/Windows with npm registry now resolved as `https://registry.npmjs.org/`.
  - Fixed new Windows lint blocker caused by CRLF checkout transformations by adding `.gitattributes` with LF normalization (`* text=auto eol=lf`).
  - Fixed Ubuntu `cargo:check` blocker (`edition2024` parse requirement from transitive `dlopen2`) by upgrading Rust toolchain from `1.84.0` to `1.85.0` in both `rust-toolchain.toml` and CI workflow.
- Validation:
  - lint: pass (`npm run lint`)
  - cargo:check: pass (`npm run cargo:check`)
  - CI evidence: run `22672192432` shows dependency install success on all three OS jobs before non-npm failures.
  - typecheck: skip (already validated in CI run evidence)
  - test: skip (already validated in CI run evidence)
  - build: skip (already validated in CI run evidence)
- Risks / Follow-ups:
  - CI run `22672192432` still in progress for macOS at log-capture time; a fresh run on this follow-up commit is required to confirm end-to-end green state.

## 2026-03-04 - ci cargo environment follow-up (ubuntu deps + windows icon)

- Commit: `pending`
- Summary:
  - Reviewed run `22672407972`: npm install and lint/typecheck/test/build stages are now stable cross-platform, but `cargo:check` failed on Ubuntu and Windows.
  - Fixed Ubuntu cargo dependency issue by installing Linux system packages required by Tauri/GTK/WebKit (`libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`, `patchelf`) before Rust checks in CI.
  - Fixed Windows cargo build-script failure by replacing placeholder icon asset with real multi-size icon files (`src-tauri/icons/icon.png` and generated `src-tauri/icons/icon.ico`).
- Validation:
  - lint: pass (`npm run lint`)
  - cargo:check: pass (`npm run cargo:check`)
  - CI evidence:
    - run `22672407972` showed `Install Node dependencies` success on all 3 OS jobs.
    - Ubuntu cargo failure details indicated missing `glib-2.0`/`gio-2.0` pkg-config libs.
    - Windows cargo failure details indicated missing `icons/icon.ico`.
- Risks / Follow-ups:
  - Re-run CI on this follow-up commit is required to confirm Ubuntu/Windows `cargo:check` are green with the new packages/icon.

## 2026-03-04 - strict three-window runtime split (popup + snippet-editor + preferences)

- Commit: `8d860eb`
- Summary:
  - Added Tauri commands to open/focus independent `snippet-editor` and `preferences` windows with deterministic sizing (`800x600` and `480x374`) and popup-hide handoff (`src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`).
  - Updated popup action flow so `编辑片断...` / `偏好设置...` open dedicated windows on desktop runtime; browser preview keeps inline fallback (`src/App.tsx`, `src/features/settings/hotkeyRuntime.ts`, `src/features/settings/index.ts`).
  - Added frontend window-role bootstrap (`main`/`snippet-editor`/`preferences` via URL query), restricted hotkey registration + clipboard monitor startup to popup main window, and added focus/visibility sync reload to reduce cross-window state drift (`src/App.tsx`).
- Validation:
  - format: pass (`npm run format`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
  - cargo:test: pass (`cargo test --manifest-path src-tauri/Cargo.toml`, 25 tests)
  - dev:desktop smoke: pass (`npm run dev:desktop` reached `Running target/debug/klip-tauri`; Vite auto-switched to 5174; command timed out at 45s because dev server is long-running)
- Risks / Follow-ups:
  - Interactive macOS/Windows GUI verification is still pending for popup->editor/preferences transition, reuse/focus lifecycle, and close/reopen behavior.
  - Snippet editor and preferences visuals are still not aligned to `docs/clipy_ui/snippet_edit.png` and `docs/clipy_ui/settings*.png`.

## 2026-03-04 - commit rule clarity for body line length

- Commit: `4fff718`
- Summary:
  - Added explicit repository guideline that commit body lines must stay within 100 characters to match commitlint enforcement (`AGENTS.md`).
  - Made commitlint body line-length enforcement explicit in local config with `body-max-line-length: 100` for clearer, self-documenting rules (`.commitlintrc.json`).
- Validation:
  - lint: pass (`npm run lint`)
  - typecheck: skip (commit-rule/docs-only change)
  - test: skip (commit-rule/docs-only change)
  - build: skip (commit-rule/docs-only change)
  - cargo:check: skip (commit-rule/docs-only change)
- Risks / Follow-ups:
  - Contributors still need to manually wrap long bullet text in commit bodies; this iteration clarifies rules but does not auto-wrap commit messages.

## 2026-03-05 - clipy-style UI alignment for snippet editor and preferences

- Commit: `d64e98e`
- Summary:
  - Rebuilt snippet editor window into Clipy-style layout with top tool buttons, left navigation/list pane, and right detail editor pane while preserving snippet/folder CRUD and paste workflow integration (`src/App.tsx`, `src/styles.css`).
  - Reworked preferences window into icon-tab navigation (`通用/菜单/类型/排除/快捷键/更新/Beta测试`) and migrated existing Klip settings controls into tabbed content sections with Clipy-like visual hierarchy (`src/App.tsx`, `src/styles.css`).
  - Updated management-window shell styling for dedicated desktop windows so snippet editor/preferences no longer render as the generic white card panel and better match screenshot baselines (`src/App.tsx`, `src/styles.css`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
  - dev:desktop smoke: pass (`npm run dev:desktop` reached `Running target/debug/klip-tauri`; command timed out at 45s as expected for long-running dev process)
- Risks / Follow-ups:
  - Screenshot-level manual parity checks are still required for spacing/typography/icon fidelity against `docs/clipy_ui/snippet_edit.png` and `docs/clipy_ui/settings*.png`.
  - Interactive macOS/Windows verification remains pending for popup -> editor/preferences transitions and window reuse/focus behavior.

## 2026-03-05 - preferences top-level tab single-row fix

- Commit: `a033086`
- Summary:
  - Fixed preferences top-level menu wrapping issue by enforcing a fixed single-row 7-column tab layout so all primary tabs stay on one line in the standalone preferences window (`src/styles.css`).
  - Moved the inline fallback "返回菜单" action outside the tab container to avoid occupying one tab slot and causing row wrapping in preview mode (`src/App.tsx`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - Pixel-level icon/button spacing still needs manual review against `docs/clipy_ui/settings*.png` on macOS runtime.

## 2026-03-05 - clipy visual-scale convergence (preferences tabs + snippet toolbar)

- Commit: `9fec23b`
- Summary:
  - Refined preferences top-level tab visuals from equal-width stretch layout to fixed-size icon-tab buttons while keeping strict single-row behavior, matching Clipy screenshot proportions more closely (`src/styles.css`).
  - Tuned preferences content visual scale (section heading, row labels, checkbox size, hotkey/number input dimensions, and spacing) to reduce oversized rendering and align better with `settings*.png` baselines (`src/styles.css`).
  - Tuned snippet editor toolbar button/icon sizing and spacing to better match `snippet_edit.png` top toolbar proportions (`src/styles.css`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - Pixel-perfect icon glyph style still differs from native macOS symbols; only spacing/scale alignment is addressed in this iteration.

## 2026-03-05 - ui consistency follow-up (menu typography + select styling)

- Commit: `af7fa48`
- Summary:
  - Further reduced preferences menu-tab typography scale (section title, row labels, checkbox rows, inline notes, number/hotkey inputs) to address oversized text feedback and improve screenshot parity (`src/styles.css`).
  - Added unified custom `select` control styling (`.clipy-select`) to remove native metallic gradient look and make dropdown visuals consistent with other form controls (`src/styles.css`).
  - Applied unified select class to preferences and snippet-editor folder/paste/update dropdowns for cross-window UI consistency (`src/App.tsx`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - Manual macOS visual verification is still required for final font-size parity and select popup behavior consistency.

## 2026-03-05 - popup hover stability and menu-title downscale follow-up

- Commit: `ea2165f`
- Summary:
  - Stabilized popup menu column heights by introducing a fixed column-height baseline and matching preview-pane height, so left-panel length no longer changes when hovering different menu/snippet entries (`src/styles.css`).
  - Added stable scrollbar gutter behavior for popup columns and snippet list to prevent hover-triggered layout jitter (`src/styles.css`).
  - Reduced preferences section title size again to address "菜单" title oversizing feedback (`src/styles.css`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - Final visual parity still depends on manual side-by-side verification in macOS runtime.

## 2026-03-05 - popup snippet-hover truncation fix and title downscale follow-up

- Commit: `2a6fd45`
- Summary:
  - Raised fixed popup column-height baseline from `318px` to `640px` to prevent internal content compression/truncation when snippet preview opens on hover (`src/styles.css`).
  - Kept fixed-height model to preserve stable outer popup dimensions while avoiding per-entry visual clipping (`src/styles.css`).
  - Reduced preferences section title size one more step to address remaining oversized "菜单" title feedback (`src/styles.css`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - If popup still appears over-tall in specific data sets, next step should switch from static height constant to runtime-measured baseline per popup content.

## 2026-03-06 - popup root-cause stabilization (runtime measure + visible resize)

- Commit: `5be3130`
- Summary:
  - Replaced static popup height constant strategy with runtime-measured stable popup column height (session max), then applied the measured height consistently to popup lists and preview panel (`src/App.tsx`).
  - Updated desktop popup window sizing to use visible panel bounding-box measurements (`getBoundingClientRect`) instead of `scrollHeight`, avoiding overflow-content-driven resize distortion (`src/App.tsx`).
  - Removed static CSS popup height variable and conflicting fixed-height constraints to let runtime measurement control column sizing without internal clipping regressions (`src/styles.css`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - Need manual desktop verification for extreme long-preview samples to decide whether session-max height should be capped lower for ergonomics.

## 2026-03-06 - popup hover-decoupled stable-height measurement follow-up

- Commit: `a466d07`
- Summary:
  - Refined popup stable-height measurement to track root-column content only, instead of re-measuring on hover-specific submenu/preview transitions (`src/App.tsx`).
  - Limited stable-height recomputation trigger to root-entry count changes, preventing hover-path changes from feeding back into row-height behavior (`src/App.tsx`).
  - Kept runtime stable-height model and visible-size window resizing from prior iteration, but removed remaining hover-coupled measurement paths (`src/App.tsx`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via `npm run qa` (`test` 71; `test:e2e` skipped; coverage statements 87.08%, branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - Requires manual hover-path verification on macOS desktop runtime to confirm history-range row height remains invariant across snippet-hover states.

## 2026-03-06 - popup responsive-scope root-cause guard follow-up

- Commit: `9e9eed1`
- Summary:
  - Scoped `@media (max-width: 760px)` management rules to `.app-shell-expanded`
    only, and removed popup row padding override so popup row metrics no longer
    change when hover-driven desktop resize crosses responsive breakpoints
    (`src/styles.css`).
  - Added a regression test that parses the responsive media block and asserts:
    no `.popup-*` selectors exist there, and `clipy` selectors remain limited
    to approved management-shell prefixes (`tests/popupResponsiveScope.test.ts`).
  - Added explicit CSS note documenting why popup rows must stay
    width-invariant even when hover navigation changes popup width.
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via
    `npm run qa` (`test` 73; `test:e2e` skipped; coverage statements 87.08%,
    branches 86.71%, funcs 85.18%, lines 87.08%)
- Risks / Follow-ups:
  - Needs interactive desktop verification on macOS/Windows to confirm
    hover-driven submenu navigation no longer changes visible history-row
    metrics in actual Tauri windows.

## 2026-03-06 - desktop event-driven clipboard listener baseline

- Commit: `pending`
- Summary:
  - Added a desktop clipboard watcher runtime module backed by `clipboard-rs`
    and wired two new Tauri commands to start/stop listener lifecycle
    (`src-tauri/src/clipboard_listener.rs`, `src-tauri/src/lib.rs`,
    `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`).
  - Added frontend runtime bridge so desktop clipboard port subscribes to
    `klip://clipboard-updated` events and controls watcher lifecycle
    (`src/features/history/browserClipboard.ts`).
  - Updated clipboard monitor to accept best-effort event subscription while
    preserving polling fallback and stop-time unsubscription cleanup
    (`src/features/history/clipboardMonitor.ts`, `src/App.tsx`).
  - Added regression tests for subscribed event capture, unsubscribe cleanup,
    and polling fallback when subscription setup fails
    (`tests/clipboardMonitor.test.ts`).
- Validation:
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via
    `npm run qa` (`test` 76; `test:e2e` skipped; coverage statements 85.71%,
    branches 86.61%, funcs 84.54%, lines 85.71%)
  - cargo:test: pass (`cargo test --manifest-path src-tauri/Cargo.toml`,
    25 tests)
- Risks / Follow-ups:
  - Interactive macOS/Windows verification is still required to confirm
    watcher behavior across foreground app switches and permission edge cases.
  - Current frontend path keeps polling as fallback; future tuning may reduce
    poll frequency after broader desktop reliability validation.

## 2026-03-06 - manual verification matrix refresh for event-driven listener

- Commit: `pending`
- Summary:
  - Refreshed desktop manual verification matrix baseline commit/date and
    switched startup-log evidence to the latest event-driven smoke run
    (`docs/status/manual-verification-us001-us006.md`,
    `/tmp/klip-dev-desktop-event-listener-20260306.log`).
  - Added US-001 event-driven verification scenarios for low-latency capture
    and hide/reopen continuity to tighten interactive checklist coverage
    (`docs/status/manual-verification-us001-us006.md`).
  - Synced status snapshots so `current.md` and `prd-tracker.md` reflect
    refreshed verification evidence and latest baseline commit (`7aac9e1`).
- Validation:
  - dev:desktop smoke: pass (`npm run dev:desktop`; log includes
    `VITE v7.3.1`, `http://localhost:5173/`, and `Running target/debug/klip-tauri`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via
    `npm run qa` (`test` 76; `test:e2e` skipped; coverage statements 85.71%,
    branches 86.61%, funcs 84.54%, lines 85.71%)
- Risks / Follow-ups:
  - Matrix entries remain `pending` until hands-on macOS/Windows interactive
    execution is completed.

## 2026-03-06 - popup realtime search baseline for compact menu

- Commit: `pending`
- Summary:
  - Added popup search input and split popup/snippet query state, so compact
    menu search no longer reuses snippet-editor query state (`src/App.tsx`).
  - Added search-box keyboard navigation support (`↑/↓/←/→/Enter`) and
    reset-to-root behavior on query updates (`src/App.tsx`).
  - Extended popup menu model to accept optional query filtering for
    history/snippets with explicit empty-state labels for unmatched queries
    (`src/features/menu/popupMenuModel.ts`).
  - Added popup query regression tests and synced Biome schema version to
    current CLI (`tests/popupMenuModel.test.ts`, `biome.json`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - typecheck: pass (`npm run typecheck`)
  - test: pass (`npm run test`, 78 tests)
  - build: pass (`npm run build`)
  - cargo:check: skip (frontend-only scope)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Need desktop interactive verification for popup search latency and keyboard
    behavior in real Tauri windows.
  - If product scope wants history-only filtering, split snippet filtering from
    popup query in a follow-up iteration.

## 2026-03-06 - popup query-mode flatten for direct enter paste

- Commit: `pending`
- Summary:
  - Refactored popup menu model into two rendering modes: default Clipy-style
    hierarchy for empty query, and query-mode flattened results for history and
    snippets to reduce key depth (`src/features/menu/popupMenuModel.ts`).
  - In query mode, history/snippet rows are now directly selectable root
    entries (no submenu drilldown), enabling `Enter` from search navigation to
    trigger direct paste faster (`src/features/menu/popupMenuModel.ts`,
    `src/App.tsx` existing key handling path).
  - Kept action rows (`清除历史/编辑片断.../偏好设置.../退出 Klip`) shared across both
    modes by consolidating action entry assembly helper
    (`src/features/menu/popupMenuModel.ts`).
  - Expanded popup menu tests to assert flattened history/snippet query results
    and no snippet-folder submenu emission in query mode
    (`tests/popupMenuModel.test.ts`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - typecheck: pass (`npm run typecheck`)
  - test: pass (`npm run test`, 79 tests)
  - build: pass (`npm run build`)
  - cargo:check: skip (frontend-only scope)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Desktop manual verification is still required to validate query-mode
    keyboard usability (`↑/↓/Enter`) in real popup windows.
  - Query-mode snippet ranking is currently insertion-order match; alias/exact
    ranking can be added later if UX feedback requires tighter prioritization.

## 2026-03-06 - snippet alias trigger baseline for popup quick paste

- Commit: `pending`
- Summary:
  - Added optional snippet alias support in domain model and normalization
    utilities, including canonical lowercase alias parsing and `;`-prefix
    handling (`src/features/snippets/snippet.types.ts`,
    `src/features/snippets/snippetUtils.ts`,
    `src/features/snippets/snippetRepository.ts`).
  - Added snippet editor alias input and save-time validation/conflict feedback,
    and extended snippet search fields to include alias lookup
    (`src/App.tsx`).
  - Extended popup query mode to support `;alias` search semantics and alias
    relevance ordering for flattened snippet results
    (`src/features/menu/popupMenuModel.ts`).
  - Added/updated tests for alias normalization, repository behavior, storage
    persistence, and popup alias-query behavior
    (`tests/snippetUtils.test.ts`, `tests/snippetRepository.test.ts`,
    `tests/snippetStorage.test.ts`, `tests/popupMenuModel.test.ts`).
- Validation:
  - format: pass (`npm run format`)
  - lint: pass (`npm run lint`)
  - typecheck: pass (`npm run typecheck`)
  - test: pass (`npm run test`, 81 tests)
  - build: pass (`npm run build`)
  - cargo:check: skip (frontend-only scope)
  - test:e2e: skip (Playwright not configured)
- Risks / Follow-ups:
  - Alias trigger currently relies on popup search (`;alias`) and does not yet
    provide a standalone global alias command path.
  - Interactive desktop verification is still required for alias-search UX and
    direct-paste reliability across macOS/Windows foreground apps.

## 2026-03-06 - desktop manual verification matrix refresh for alias scenarios

- Commit: `f13f390`
- Summary:
  - Rechecked desktop startup smoke after alias baseline and captured fresh log
    evidence (`/tmp/klip-dev-desktop-alias-20260306.log`), confirming Vite +
    Tauri runtime startup path still reaches `Running target/debug/klip-tauri`.
  - Refreshed manual verification matrix baseline commit to `f13f390` and
    switched startup-log evidence path to the alias-baseline run
    (`docs/status/manual-verification-us001-us006.md`).
  - Expanded manual matrix with US-008 `;alias` scenarios for popup quick
    search, enter-to-paste, and unknown-alias empty-state checks
    (`docs/status/manual-verification-us001-us006.md`).
- Validation:
  - dev:desktop smoke: pass (`npm run dev:desktop`; log includes
    `VITE v7.3.1`, `http://localhost:5173/`, and `Running target/debug/klip-tauri`)
  - lint: pass (`npm run lint`)
- Risks / Follow-ups:
  - Interactive GUI rows remain `pending`; this terminal session can only
    complete startup/preflight evidence, not hands-on popup/tray interactions.

## 2026-03-06 - global snippet alias hotkey trigger baseline

- Commit: `pending`
- Summary:
  - Added independent snippet-alias hotkey settings persistence/runtime bridge,
    including disable-by-empty behavior and canonical hotkey normalization
    (`src/features/settings/hotkey.constants.ts`,
    `src/features/settings/hotkeyStorage.ts`,
    `src/features/settings/hotkeyRuntime.ts`,
    `src/features/settings/index.ts`).
  - Extended Tauri hotkey runtime with a second shortcut state/command
    (`register_snippet_alias_hotkey`) and global shortcut event routing that
    emits `klip://snippet-alias-hotkey-triggered` to the main window
    (`src-tauri/src/hotkey.rs`, `src-tauri/src/lib.rs`).
  - Updated popup runtime behavior so alias-hotkey trigger opens menu mode,
    pre-fills search with `;`, resets menu path, and focuses the popup search
    input for direct alias typing (`src/App.tsx`).
  - Added regression coverage for snippet-alias hotkey storage default,
    normalization, runtime-format readback, and disable flow
    (`tests/snippetAliasHotkeyStorage.test.ts`).
- Validation:
  - format: pass (`npm run format`, plus `cargo fmt --manifest-path src-tauri/Cargo.toml`)
  - lint/typecheck/test/test:e2e/build/test:coverage/cargo:check: pass via
    `npm run qa` (`test` 85; `test:e2e` skipped; coverage statements 85.24%,
    branches 86.94%, funcs 84.67%, lines 85.24%)
  - cargo:test: pass (`cargo test --manifest-path src-tauri/Cargo.toml`,
    25 tests)
- Risks / Follow-ups:
  - Interactive desktop verification is still required for alias-hotkey
    trigger flow in macOS/Windows foreground-app scenarios.

## 2026-03-06 - browser Playwright E2E baseline for preview regression

- Commit: `0fa148c`
- Summary:
  - Added Playwright browser E2E baseline with a dedicated config, Chromium
    project, local Chrome-channel fallback for non-CI runs, and repo artifact
    ignore rules (`playwright.config.ts`, `.gitignore`).
  - Added preview-mode E2E fixtures that seed browser localStorage and replace
    `navigator.clipboard` with a deterministic in-memory test clipboard so
    tests do not depend on real OS clipboard permissions
    (`tests/e2e/fixtures.ts`).
  - Added four browser-preview scenarios covering popup/menu navigation,
    history query `Enter`-to-copy fallback, snippet create + `;alias` search
    + copy flow, and settings persistence across reloads
    (`tests/e2e/browser-preview.spec.ts`).
  - Updated CI to install Playwright Chromium before `npm run test:e2e`
    (`.github/workflows/ci.yml`) and added `@playwright/test` to dev
    dependencies (`package.json`, `package-lock.json`).
- Validation:
  - format: pass (`npm run format`)
  - typecheck: pass (`npm run typecheck`)
  - test: pass (`npm run test`, 85 tests)
  - test:e2e: pass (`npm run test:e2e`, 4 tests)
  - qa: pass (`npm run qa`; `lint`/`typecheck`/`test`/`test:e2e`/`build`/`test:coverage`/`cargo:check`)
- Risks / Follow-ups:
  - Browser E2E currently protects preview-mode regressions only; Tauri-only
    tray/global-hotkey/direct-paste/independent-window behavior still requires
    manual desktop verification.
  - Local runtime is still Node `v25.2.1` while the repo target remains Node
    22; `npm install` emitted an `EBADENGINE` warning because `nvm` is not
    available in this environment.

## 2026-03-07 - second-batch Playwright popup regression scenarios

- Commit: `a417ca8`
- Summary:
  - Extended browser-preview Playwright coverage from 4 to 7 scenarios by
    adding clear-history confirm/accept validation, snippet alias-conflict
    rejection, and popup submenu keyboard traversal coverage
    (`tests/e2e/browser-preview.spec.ts`).
  - Reused the existing preview fixtures so new scenarios continue to run with
    deterministic browser localStorage and in-memory clipboard behavior
    (`tests/e2e/fixtures.ts`).
  - Refreshed status artifacts so PRD evidence and current snapshot now reflect
    the expanded browser-side E2E safety net
    (`docs/status/current.md`, `docs/status/prd-tracker.md`).
- Validation:
  - format: pass (`npm run format`)
  - typecheck: pass (`npm run typecheck`)
  - test:e2e: pass (`npm run test:e2e`, 7 tests)
  - qa: pass (`npm run qa`; `lint`/`typecheck`/`test`/`test:e2e`/`build`/`test:coverage`/`cargo:check`)
- Risks / Follow-ups:
  - Browser E2E still does not exercise Tauri-only tray/global-hotkey/
    direct-paste/independent-window behavior, so manual desktop verification
    remains required.
  - Candidate next browser scenarios are folder CRUD, invalid-alias handling,
    and additional popup action/error paths.

## 2026-03-07 - third-batch Playwright editor and popup action coverage

- Commit: `e4bf108`
- Summary:
  - Extended browser-preview Playwright coverage from 7 to 10 scenarios by
    adding folder create/rename/delete-with-move coverage, invalid snippet
    alias rejection, and browser-preview `退出 Klip` action handling
    (`tests/e2e/browser-preview.spec.ts`).
  - Reused the existing preview fixtures so new scenarios continue to run with
    deterministic browser localStorage and in-memory clipboard behavior
    (`tests/e2e/fixtures.ts`).
  - Refreshed status artifacts so the current snapshot and PRD evidence now
    reflect the broader browser-side E2E safety net
    (`docs/status/current.md`, `docs/status/prd-tracker.md`).
- Validation:
  - format: pass (`npm run format`)
  - typecheck: pass (`npm run typecheck`)
  - test:e2e: pass (`npm run test:e2e`, 10 tests)
  - qa: pass (`npm run qa`; `lint`/`typecheck`/`test`/`test:e2e`/`build`/`test:coverage`/`cargo:check`)
- Risks / Follow-ups:
  - Browser E2E still does not exercise Tauri-only tray/global-hotkey/
    direct-paste/independent-window behavior, so manual desktop verification
    remains required.
  - Candidate next browser scenarios are snippet delete confirm, folder-name
    conflict handling, and additional popup action/error paths.

## 2026-03-07 - fourth-batch Playwright delete/conflict/error coverage

- Commit: `pending`
- Summary:
  - Extended browser-preview Playwright coverage from 10 to 13 scenarios by
    adding snippet delete dismiss/accept validation, folder rename conflict
    handling, and empty-history `清除历史` action messaging
    (`tests/e2e/browser-preview.spec.ts`).
  - Reused the existing preview fixtures so new scenarios continue to run with
    deterministic browser localStorage and in-memory clipboard behavior
    (`tests/e2e/fixtures.ts`).
  - Refreshed status artifacts so the current snapshot and PRD evidence now
    reflect the broader browser-side E2E safety net
    (`docs/status/current.md`, `docs/status/prd-tracker.md`).
- Validation:
  - format: pass (`npm run format`)
  - test:e2e: pass (`npm run test:e2e`, 13 tests)
  - qa: pass (`npm run qa`; `lint`/`typecheck`/`test`/`test:e2e`/`build`/`test:coverage`/`cargo:check`)
- Risks / Follow-ups:
  - Browser E2E still does not exercise Tauri-only tray/global-hotkey/
    direct-paste/independent-window behavior, so manual desktop verification
    remains required.
  - Candidate next browser scenarios are snippet edit/update flows,
    editor-toolbar empty-selection messaging, and additional settings/error
    paths.

## 2026-03-07 - desktop release asset publishing baseline

- Commit: `pending`
- Summary:
  - Extended the desktop packaging workflow so tag-triggered runs still build
    the existing macOS/Windows matrix artifacts and now publish macOS `.dmg`
    plus Windows `.exe` bundles to the matching GitHub Release via
    `softprops/action-gh-release` (`.github/workflows/desktop-packaging.yml`).
  - Kept `workflow_dispatch` packaging dry runs artifact-only by gating the
    publish job to `refs/tags/v*`, which preserves manual verification without
    creating a GitHub Release.
  - Refreshed status artifacts so the current snapshot and PRD evidence reflect
    the new US-011 release attachment baseline
    (`docs/status/current.md`, `docs/status/prd-tracker.md`).
- Validation:
  - yaml-parse: pass
    (`ruby -e "require 'yaml'; YAML.load_file('.github/workflows/desktop-packaging.yml')"`)
  - lint: pass (`npm run lint`; Biome reported existing schema-version info only)
  - diff-check: pass (`git diff --check`)
  - typecheck: skip (workflow/docs-only change; latest 2026-03-07 pass retained)
  - test: skip (workflow/docs-only change; latest 2026-03-07 pass retained)
  - build: skip (workflow/docs-only change; latest 2026-03-07 pass retained)
  - cargo:check: skip (Rust unchanged; latest 2026-03-07 pass retained)
- Risks / Follow-ups:
  - GitHub Releases now receive unsigned desktop bundles only; macOS signing /
    notarization and Windows signing remain future distribution work.
  - Need a real tag push to verify end-to-end Release asset upload and capture
    the remaining US-011 Windows install/uninstall evidence.

## 2026-03-07 - release notes template and macOS signing workflow baseline

- Commit: `pending`
- Summary:
  - Added a checked-in GitHub Release notes template plus explicit release name
    handling so `v*` tag builds publish consistent release metadata alongside
    the packaged `.dmg` / `.exe` artifacts
    (`.github/release-notes-template.md`,
    `.github/workflows/desktop-packaging.yml`).
  - Added an optional macOS signed build path
    (`npm run build:desktop:bundle:macos:signed`) and taught the packaging
    workflow to switch between unsigned, signed-only, and signed-and-notarized
    bundle modes based on configured Apple certificate / App Store Connect
    secrets (`package.json`, `.github/workflows/desktop-packaging.yml`).
  - Documented the release flow and required Apple secrets in the project docs
    and US-011 verification baseline (`README.md`,
    `docs/status/packaging-verification-us011.md`,
    `docs/status/current.md`, `docs/status/prd-tracker.md`).
- Validation:
  - yaml-parse: pass
    (`ruby -e "require 'yaml'; YAML.load_file('.github/workflows/desktop-packaging.yml')"`)
  - release-notes-render: pass
    (`GITHUB_REF_NAME=v0.1.0 sed "s/{{TAG_NAME}}/${GITHUB_REF_NAME}/g" .github/release-notes-template.md > /tmp/klip-release-notes-preview.md`)
  - lint: pass (`npm run lint`; Biome reported existing schema-version info only)
  - typecheck: pass (`npm run typecheck`)
  - diff-check: pass (`git diff --check`)
  - test: skip (workflow/docs/package-only change; latest 2026-03-07 pass retained)
  - build: skip (release automation change; latest 2026-03-07 pass retained)
  - cargo:check: skip (Rust unchanged; latest 2026-03-07 pass retained)
- Risks / Follow-ups:
  - Release automation now supports signed/notarized macOS bundles, but CI
    still needs real `APPLE_*` secrets and a tag push to validate that path.
  - Windows installers are still unsigned, and US-011 install/uninstall
    evidence remains outstanding on a Windows runtime.

## 2026-03-07 - apple release secret registration guide

- Commit: `pending`
- Summary:
  - Added a dedicated Apple release secret registration runbook that documents
    CSR creation, `Developer ID Application` certificate export, `.p12` to
    base64 conversion, App Store Connect API key generation, GitHub secret
    setup, and release verification flow
    (`docs/release/apple-release-secrets-setup.md`).
  - Linked the new runbook from the repository release documentation so the
    README and US-011 packaging baseline both point to a single setup guide
    (`README.md`, `docs/status/packaging-verification-us011.md`).
  - Refreshed status artifacts so the current snapshot and PRD evidence reflect
    the new Apple secret registration documentation baseline
    (`docs/status/current.md`, `docs/status/prd-tracker.md`).
- Validation:
  - lint: pass (`npm run lint`; Biome reported existing schema-version info only)
  - diff-check: pass (`git diff --check`)
  - typecheck: skip (docs-only change; latest 2026-03-07 pass retained)
  - test: skip (docs-only change; latest 2026-03-07 pass retained)
  - build: skip (docs-only change; latest 2026-03-07 pass retained)
  - cargo:check: skip (Rust unchanged; latest 2026-03-07 pass retained)
- Risks / Follow-ups:
  - The setup guide still requires real Apple account access and downloaded
    credentials; no secrets were provisioned during this iteration.
  - A real `workflow_dispatch` / tag-based release run remains necessary to
    validate the signed/notarized macOS path and record US-011 evidence.

## 2026-03-07 - fresh macOS DMG rebuild for install verification

- Commit: `b9c06de`
- Summary:
  - Rebuilt the local unsigned macOS desktop bundles so DMG install verification
    can proceed against a fresh artifact instead of the older 2026-03-04 output
    (`src-tauri/target/release/bundle/macos/Klip.app`,
    `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`).
  - Captured fresh packaging evidence including timestamp, sha256, and build log
    path in the US-011 packaging verification doc
    (`docs/status/packaging-verification-us011.md`,
    `/tmp/klip-build-bundle-macos-20260307.log`).
  - Refreshed status artifacts so the current snapshot and PRD evidence reflect
    the new local macOS packaging baseline
    (`docs/status/current.md`, `docs/status/prd-tracker.md`).
- Validation:
  - build: pass (`npm run build:desktop:bundle:macos`)
  - lint: pass (`npm run lint`; Biome reported existing schema-version info only)
  - typecheck: skip (build/status-only change; latest 2026-03-07 pass retained)
  - test: skip (build/status-only change; latest 2026-03-07 pass retained)
  - diff-check: pass (`git diff --check`)
  - cargo:check: skip (covered transitively by Tauri release build for this iteration)
- Risks / Follow-ups:
  - The rebuild used local Node `v25.2.1` because Node 22 runtime switching was
    unavailable on this machine, so environment alignment remains a known gap.
  - macOS DMG install, first-launch, tray persistence, and uninstall cleanup
    checks still need hands-on verification to close the US-011 matrix rows.

## 2026-03-07 - macOS panel workspace fix for hotkey invocation

- Commit: `pending`
- Summary:
  - Fixed the macOS panel presentation path so the main window is configured as
    `visible_on_all_workspaces`, allowing the hotkey popup to behave like a
    tray panel instead of jumping to Klip's own desktop/Space
    (`src-tauri/src/tray.rs`).
  - Switched the macOS app runtime to `ActivationPolicy::Accessory` with the
    Dock hidden, matching the intended tray-app behavior when the panel is
    shown from the global hotkey (`src-tauri/src/lib.rs`).
  - Rebuilt the unsigned macOS DMG after the fix so manual installation
    verification can confirm current-space behavior from a fresh artifact
    (`/tmp/klip-build-bundle-macos-space-fix-20260307.log`,
    `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`).
- Validation:
  - cargo:check: pass (`npm run cargo:check`)
  - build: pass (`npm run build:desktop:bundle:macos`)
  - lint: pass (`npm run lint`; Biome reported existing schema-version info only)
  - typecheck: pass (`npm run typecheck`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The fix is based on macOS tray-app window semantics and still needs hands-on
    verification from the rebuilt DMG to confirm Space-switching is gone.
  - Auxiliary windows (`snippet-editor` / `preferences`) intentionally remain
    normal app windows; only the main panel uses the all-workspaces tray
    behavior.

## 2026-03-07 - macOS direct paste focus restoration fix

- Commit: `pending`
- Summary:
  - Updated the macOS panel flow to remember the frontmost app before Klip takes
    focus, storing the bundle identifier for later paste restoration
    (`src-tauri/src/tray.rs`).
  - Updated direct paste so Klip hides the panel, re-activates the remembered
    frontmost app, waits briefly, and only then sends the synthetic `Cmd+V`
    keystroke (`src-tauri/src/direct_paste.rs`).
  - Rebuilt the unsigned macOS DMG after the fix so manual verification can
    confirm paste lands in the original app again
    (`/tmp/klip-build-bundle-macos-paste-fix-20260307.log`,
    `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`).
- Validation:
  - cargo:check: pass (`npm run cargo:check`)
  - lint: pass (`npm run lint`; Biome reported existing schema-version info only)
  - typecheck: pass (`npm run typecheck`)
  - build: pass (`npm run build:desktop:bundle:macos`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The fix still needs hands-on DMG verification in a real foreground text app
    to confirm paste now returns to the original target reliably.
  - If certain apps still reject restored focus, a follow-up may be needed to
    tune the macOS re-activation delay or activation strategy.

## 2026-03-07 - native panel presenter for fullscreen-safe popup and cursor anchoring

- Commit: `pending`
- Summary:
  - Added a dedicated native panel presenter that centralizes popup show/hide,
    cursor-relative positioning, previous-target capture, and pre-paste focus
    restoration so the main panel and direct-paste pipeline share one source of
    truth (`src-tauri/src/panel_presenter.rs`,
    `src-tauri/src/direct_paste.rs`, `src-tauri/src/tray.rs`,
    `src-tauri/src/lib.rs`).
  - Added macOS native window handling that applies panel-style
    `NSWindowCollectionBehavior` (`CanJoinAllSpaces`, `MoveToActiveSpace`,
    `FullScreenAuxiliary`, `Transient`, `IgnoresCycle`) plus elevated window
    level so the popup can stay in the active desktop/full-screen context
    instead of switching to Klip's own Space
    (`src-tauri/src/panel_presenter/macos.rs`,
    `src-tauri/src/panel_presenter.rs`).
  - Added shared cursor/work-area positioning logic with Rust regression tests,
    and added Windows presenter scaffolding for the same cursor-based placement
    and foreground-target restore flow so similar focus bugs can be handled
    through the same abstraction later
    (`src-tauri/src/panel_presenter.rs`,
    `src-tauri/src/panel_presenter/windows.rs`).
- Validation:
  - cargo:test: pass (`cargo test --manifest-path src-tauri/Cargo.toml`)
  - cargo:check: pass (`PATH=/opt/homebrew/bin:$PATH npm run cargo:check`)
  - lint: pass (`PATH=/opt/homebrew/bin:$PATH npm run lint`; Biome reported
    existing schema-version info only)
  - typecheck: pass (`PATH=/opt/homebrew/bin:$PATH npm run typecheck`)
  - test: pass (`PATH=/opt/homebrew/bin:$PATH npm run test`)
  - build: pass (`PATH=/opt/homebrew/bin:$PATH npm run build`)
  - build:desktop: pass (`PATH=/opt/homebrew/bin:$PATH npm run build:desktop`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - Hands-on verification is still required in real macOS fullscreen apps,
    non-fullscreen apps, and multi-display setups to confirm cursor anchoring
    and paste restoration match the intended native feel.
  - Local validation used Homebrew Node `v25.2.1` because the repo-pinned Node
    22 runtime was not available on this machine.

## 2026-03-07 - manual macOS DMG rebuild for reinstall testing

- Commit: `pending`
- Summary:
  - Rebuilt the unsigned macOS app bundle for reinstall testing via
    `npm run build:desktop:bundle:macos`; the `.app` portion succeeded, but
    the DMG step failed because a stale temporary
    `rw.*.Klip_0.1.0_aarch64.dmg` remained mounted from an earlier failed
    attempt (`/tmp/klip-build-bundle-macos-native-panel-20260307.log`).
  - Investigated the failure, detached stale `/dev/disk8`, removed
    `src-tauri/target/release/bundle/macos/rw.40197.Klip_0.1.0_aarch64.dmg`,
    and reran the generated DMG script manually to produce a fresh installable
    `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`
    (`/tmp/klip-manual-dmg-success-20260307.log`).
  - Refreshed packaging evidence so the latest reinstall target, checksum, and
    stale-mount cleanup note are recorded in
    `docs/status/packaging-verification-us011.md` and `docs/status/current.md`.
- Validation:
  - build:desktop:bundle:macos: fail (`PATH=/opt/homebrew/bin:$PATH npm run build:desktop:bundle:macos`; DMG step blocked by stale mounted temporary image)
  - manual dmg script: pass (`src-tauri/target/release/bundle/dmg/bundle_dmg.sh --volname "Klip" ...`)
  - artifact: pass (`src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`, sha256 `602fb883e3975d80de427c7d6f7d0d22379f912b3a06aca37c15134bc4ca3b06`)
  - hdiutil verify: pass (`hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The freshly built DMG is unsigned and still needs hands-on install and
    behavior verification.
  - Future local DMG rebuilds may need stale `/Volumes/dmg.*` / `rw.*.dmg`
    cleanup before rerunning the Tauri bundle command.

## 2026-03-07 - preferences footer build commit display

- Commit: `pending`
- Summary:
  - Added a small frontend build-info helper and Vite build-time git injection
    so the app can expose the current short commit with `-dirty` fallback
    without depending on runtime access to `.git`
    (`vite.config.ts`, `src/features/build/buildInfo.ts`,
    `src/vite-env.d.ts`).
  - Added a low-visibility commit footer to the standalone preferences window
    so installed builds can be identified quickly during manual testing
    (`src/App.tsx`, `src/styles.css`).
  - Added regression coverage for normal / dirty / unknown commit formatting
    in `tests/buildInfo.test.ts`.
- Validation:
  - typecheck: pass (`PATH=/opt/homebrew/bin:$PATH npm run typecheck`)
  - test: pass (`PATH=/opt/homebrew/bin:$PATH npm run test`)
  - build: pass (`PATH=/opt/homebrew/bin:$PATH npm run build`)
  - build artifact check: pass (`rg --fixed-strings 'b9c06de-dirty' dist`)
  - lint: pass (`PATH=/opt/homebrew/bin:$PATH npm run lint`; Biome reported
    existing schema-version info only)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The displayed commit reflects the build tree state at Vite build time, so
    an already-built app will not update until rebuilt.
  - Browser preview and local dirty-tree builds intentionally show `-dirty`,
    which is useful for testing but should be expected during local development.

## 2026-03-07 - fresh macOS DMG rebuild after preferences commit footer

- Commit: `pending`
- Summary:
  - Cleared stale local DMG state, including mounted repo images and leftover
    temporary `rw.*.Klip_0.1.0_aarch64.dmg` files, before rerunning the macOS
    bundle pipeline for a fresh reinstall target.
  - Rebuilt unsigned macOS bundles through
    `npm run build:desktop:bundle:macos`, producing fresh
    `src-tauri/target/release/bundle/macos/Klip.app` and
    `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`
    (`/tmp/klip-build-bundle-macos-rebuild-20260307-183433.log`).
  - Verified the rebuilt DMG with `hdiutil verify` and recorded the new
    checksum `93a7147dfb8b79c53eaac0c570dc724a3e4005596e675b744b4d5e9b19d7b4ca`
    for reinstall testing (`/tmp/klip-dmg-verify-20260307-183433.log`).
- Validation:
  - build:desktop:bundle:macos: pass (`PATH=/opt/homebrew/bin:$PATH npm run build:desktop:bundle:macos`)
  - hdiutil verify: pass (`hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`)
  - artifact: pass (`src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`, sha256 `93a7147dfb8b79c53eaac0c570dc724a3e4005596e675b744b4d5e9b19d7b4ca`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The freshly rebuilt DMG is unsigned and still needs hands-on install and
    behavior verification.
  - If local DMG bundling fails again in future sessions, stale mounted repo
    images should be checked before retrying the bundle command.

## 2026-03-07 - macOS installed-app startup regression fix and DMG rebuild

- Commit: `pending`
- Summary:
  - Reproduced the user-reported macOS issue where the app installed from the
    latest DMG opened and immediately quit; direct release-bundle execution
    aborted during startup with a non-unwinding panic.
  - Narrowed the crash to eager macOS native panel setup during app startup:
    calling the native `NSWindow` collection-behavior mutation too early from
    `setup` caused installed builds to abort before the tray app could stay
    resident.
  - Fixed the regression by removing the eager startup-time main-window panel
    configuration and keeping the native panel configuration lazy on actual
    panel presentation, then rebuilt the unsigned macOS bundles and verified
    both the rebuilt release bundle and the DMG-installed `/Applications`
    app stay resident after launch.
- Validation:
  - cargo test: pass (`PATH=/opt/homebrew/bin:$PATH cargo test --manifest-path src-tauri/Cargo.toml`; 31 Rust tests, log dir `/tmp/klip-verify-20260307-190439/`)
  - cargo:check: pass (`PATH=/opt/homebrew/bin:$PATH npm run cargo:check`)
  - lint: pass (`PATH=/opt/homebrew/bin:$PATH npm run lint`; Biome reported existing schema-version info only)
  - typecheck: pass (`PATH=/opt/homebrew/bin:$PATH npm run typecheck`)
  - test: pass (`PATH=/opt/homebrew/bin:$PATH npm run test`; 88 tests)
  - build: pass (`PATH=/opt/homebrew/bin:$PATH npm run build`)
  - build:desktop:bundle:macos: pass (`PATH=/opt/homebrew/bin:$PATH npm run build:desktop:bundle:macos`)
  - hdiutil verify: pass (`hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`; sha256 `13995e6ede608fdbe86811991e7b7a92675faaa528668d80503cf9fd5cf28e44`)
  - release bundle launch: pass (`src-tauri/target/release/bundle/macos/Klip.app/Contents/MacOS/klip-tauri`; stayed resident, `/tmp/klip-verify-20260307-190439/release-launch.status`)
  - DMG install + `/Applications` launch: pass (mounted rebuilt DMG, reinstalled `/Applications/Klip.app`, detached image, and confirmed resident launch via `/tmp/klip-install-verify-20260307-190701/installed-launch.status`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The startup regression is fixed, but fullscreen / non-fullscreen /
    multi-display panel placement and restored direct-paste behavior still need
    hands-on verification in real apps.
  - The rebuilt DMG remains unsigned; Apple signing/notarization and Windows
    packaging/install-uninstall evidence are still pending.

## 2026-03-07 - macOS panel-show abort fix and DMG rebuild

- Commit: `pending`
- Summary:
  - Reproduced the follow-up regression where the app stayed running after
    install, but pressing the panel hotkey did nothing and the menu-bar icon
    appeared missing; investigation showed startup itself was fine and tray /
    hotkey registration completed successfully.
  - Forced a panel show on the main thread under LLDB and captured the real
    root cause: AppKit asserted in `-[TaoWindow _validateCollectionBehavior:]`
    because the custom macOS presenter was applying an invalid
    `MoveToActiveSpace` collection-behavior mutation to the Tao window when the
    panel tried to open.
  - Fixed the regression by keeping the native panel configuration on the main
    thread, reducing the custom collection-behavior mutation to the safe
    `FullScreenAuxiliary` flag only, adding Rust regression coverage to prevent
    `MoveToActiveSpace` from returning, and opting the tray icon into macOS
    template rendering so the menu-bar icon follows the native appearance more
    reliably.
- Validation:
  - cargo test: pass (`PATH=/opt/homebrew/bin:$PATH cargo test --manifest-path src-tauri/Cargo.toml`; 33 Rust tests, logs `/tmp/klip-fix-verify-20260307-193152/`)
  - cargo:check: pass (`PATH=/opt/homebrew/bin:$PATH npm run cargo:check`)
  - lint: pass (`PATH=/opt/homebrew/bin:$PATH npm run lint`; Biome reported existing schema-version info only)
  - typecheck: pass (`PATH=/opt/homebrew/bin:$PATH npm run typecheck`)
  - test: pass (`PATH=/opt/homebrew/bin:$PATH npm run test`; 88 tests)
  - build: pass (`PATH=/opt/homebrew/bin:$PATH npm run build`)
  - build:desktop:bundle:macos: pass (`PATH=/opt/homebrew/bin:$PATH npm run build:desktop:bundle:macos`)
  - hdiutil verify: pass (`hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`; sha256 `d16ad2ccab87fbe6e3c21f78a721835d3a2d2a05658649b64ff3dfa922651c3d`)
  - DMG install + `/Applications` launch: pass (mounted rebuilt DMG, reinstalled `/Applications/Klip.app`, detached image, and confirmed resident launch via `/tmp/klip-install-verify-fix-20260307-193309/installed-launch.status`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The abort-on-show regression is fixed, but interactive macOS verification
    is still needed to confirm fullscreen current-space behavior remains
    acceptable after dropping `MoveToActiveSpace`.
  - The tray icon now uses template rendering, but final visual confirmation
    still needs a hands-on check in the real menu bar.

## 2026-03-07 - macOS tray icon asset + direct paste accessibility follow-up

- Commit: `pending`
- Summary:
  - Investigated the next user report where the panel could open again, but the
    menu-bar icon still appeared missing and selecting a history item did not
    paste back into the original cursor target.
  - Added a dedicated macOS tray template icon asset and switched the tray path
    to use that asset instead of the generic app icon so the menu-bar item is
    rendered in a more native/visible way on macOS (`src-tauri/src/tray.rs`,
    `src-tauri/icons/tray-template.rgba`, source PNG retained in
    `src-tauri/icons/tray-template.png`).
  - Added macOS Accessibility preflight for direct paste so Klip now detects
    missing permission before hiding/restoring focus, returns an actionable
    fallback message instead of seeming to do nothing, and keeps the panel open
    on direct-paste fallback in the frontend so the user can actually see that
    message (`src-tauri/src/direct_paste.rs`, `src/features/paste/`,
    `src/App.tsx`).
- Validation:
  - red test: pass (`npm run test -- tests/directPasteFeedback.test.ts`; initially failed before implementing `shouldHidePanelAfterDirectPaste`)
  - cargo macos tests: pass (`PATH=/opt/homebrew/bin:$PATH cargo test --manifest-path src-tauri/Cargo.toml macos_ -- --nocapture`)
  - cargo test: pass (`PATH=/opt/homebrew/bin:$PATH cargo test --manifest-path src-tauri/Cargo.toml`; 35 Rust tests, logs `/tmp/klip-followup-verify-20260307-195815/`)
  - cargo:check: pass (`PATH=/opt/homebrew/bin:$PATH npm run cargo:check`)
  - lint: pass (`PATH=/opt/homebrew/bin:$PATH npm run lint`; Biome reported existing schema-version info only)
  - typecheck: pass (`PATH=/opt/homebrew/bin:$PATH npm run typecheck`)
  - test: pass (`PATH=/opt/homebrew/bin:$PATH npm run test`; 90 tests)
  - build: pass (`PATH=/opt/homebrew/bin:$PATH npm run build`)
  - build:desktop:bundle:macos: pass (`PATH=/opt/homebrew/bin:$PATH npm run build:desktop:bundle:macos`)
  - hdiutil verify: pass (`hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`; sha256 `f428dcf39b2cc9d4f05e37025cbc515b3d4e9b109c89f8085a54b6984b59f10c`)
  - DMG install + `/Applications` launch: pass (mounted rebuilt DMG, reinstalled `/Applications/Klip.app`, detached image, and confirmed resident launch via `/tmp/klip-install-verify-followup-20260307-195938/installed-launch.status`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - The direct-paste UX now surfaces missing macOS Accessibility permission
    clearly, but successful post-permission direct paste still needs hands-on
    verification in real apps.
  - The dedicated tray icon asset should be more visible, but final visual
    confirmation in the live menu bar is still required.

## 2026-03-07 - macOS tray title fallback follow-up

- Commit: `pending`
- Summary:
  - Added a small macOS tray title fallback (`Klip`) in `src-tauri/src/tray.rs`
    so the menu-bar entry still has visible text while template-icon
    visibility is being tuned and manually verified.
  - Applied the title only on macOS and added a Rust regression test to keep
    the fallback non-empty.
  - Refreshed `docs/status/current.md` and `docs/status/prd-tracker.md` for
    this follow-up.
- Validation:
  - cargo test: pass (`PATH=/opt/homebrew/bin:$PATH cargo test --manifest-path src-tauri/Cargo.toml`; 36 Rust tests)
  - lint: pass (`PATH=/opt/homebrew/bin:$PATH npm run lint`; Biome reported existing schema-version info only)
  - typecheck: pass (`PATH=/opt/homebrew/bin:$PATH npm run typecheck`)
  - test: pass (`PATH=/opt/homebrew/bin:$PATH npm run test`; 90 tests)
  - build: pass (`PATH=/opt/homebrew/bin:$PATH npm run build`)
  - cargo:check: pass (`PATH=/opt/homebrew/bin:$PATH npm run cargo:check`)
  - diff-check: pass (`git diff --check`)
- Risks / Follow-ups:
  - Need hands-on macOS verification to confirm the title improves
    discoverability without clashing with native menu-bar expectations.
  - Local machine still lacks an active Node 22 switch path, so validation ran
    under the currently installed Node runtime.
