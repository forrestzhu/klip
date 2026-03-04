# Project Progress Log

This file is append-only. Add one entry after each completed iteration.

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
