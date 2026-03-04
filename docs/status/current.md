# Project Status Snapshot

- Last Updated: 2026-03-04
- Branch: `main`
- Latest Commit: `30a6501` (`feat(runtime): add global hotkey and direct paste fallback`)
- PRD Source: `docs/plans/2026-03-03-klip-prd.md`

## Current Phase

- Active scope: Phase 1 (MVP) plus initial Phase 2 snippets baseline, tray/menu bar entry, global hotkey baseline, and direct-paste fallback abstraction baseline.
- Product state: local offline clipboard workflow with history + snippets dual mode in web runtime; Tauri runtime now supports tray/menu bar entry, configurable panel global hotkey, and best-effort direct paste with clipboard fallback.

## Completed Highlights

- History domain modules (capture filtering, storage, repository, capacity/FIFO).
- History UI runtime wiring (search, keyboard navigation, copy-selected behavior).
- Tauri-side history model/storage/repository baseline modules.
- Snippets domain modules (folder + snippet CRUD, persistence, normalization).
- History/Snippets dual-mode UI with mode memory and keyboard mode switch (`Ctrl/Cmd+1`, `Ctrl/Cmd+2`).
- Tauri tray/menu bar resident entry with icon click open, menu open, and quit action (`src-tauri/src/tray.rs`).
- Tauri global hotkey baseline for opening panel, dynamic rebind, and conflict-aware error feedback (`src-tauri/src/hotkey.rs`, `src-tauri/src/lib.rs`).
- Frontend shortcut settings baseline with persistence, apply action, and `Esc` panel hide integration (`src/features/settings`, `src/App.tsx`).
- Direct paste abstraction baseline in Tauri (`src-tauri/src/direct_paste.rs`) with platform paste attempt (macOS `osascript`, Windows `SendKeys`) and clipboard fallback response.
- History/Snippets selection flow now routes through direct paste runtime with fallback messaging in UI (`src/features/paste`, `src/App.tsx`).

## In Progress / Gaps

- Direct paste path is best-effort and still needs manual verification for reliability/permissions on macOS and Windows foreground apps (US-006/US-008 hardening gap).
- Tray behavior has only baseline runtime coverage; no desktop e2e/manual platform verification evidence yet.
- Global hotkey behavior lacks macOS/Windows manual conflict verification evidence (US-004 final hardening gap).
- Dedicated settings center is still missing; controls are currently embedded in main panel (US-010 partial).
- Cross-platform installer release and e2e desktop regression baseline (US-011, US-012 partial) not implemented.

## Next Focus

1. Expand settings into dedicated settings center for shortcut/capacity/paste controls (US-010).
2. Add desktop manual verification evidence for tray/hotkey/direct-paste behavior on macOS/Windows (US-003/US-004/US-006).
3. Add snippets quick-trigger strategy and conflict handling (US-008 remaining scope).

## Last Validation Snapshot

- 2026-03-04: `npm run lint` passed.
- 2026-03-04: `npm run typecheck` passed.
- 2026-03-04: `npm run test` passed (47 tests).
- 2026-03-04: `npm run build` passed.
- 2026-03-04: `npm run cargo:check` passed.
- 2026-03-04: `cargo test --manifest-path src-tauri/Cargo.toml` passed (22 tests).

## Quick Resume Steps

1. Read `docs/status/prd-tracker.md`.
2. Read latest entries in `docs/status/progress-log.md`.
3. Run `git log --oneline -n 10`.
