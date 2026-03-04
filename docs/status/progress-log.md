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
