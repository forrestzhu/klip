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
