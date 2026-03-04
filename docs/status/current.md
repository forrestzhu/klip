# Project Status Snapshot

- Last Updated: 2026-03-04
- Branch: `main`
- Latest Commit: `30a6501` (`feat(runtime): add global hotkey and direct paste fallback`)
- Working Tree: uncommitted local changes for settings center baseline, desktop startup scripts, clipboard monitor runtime fix, desktop-native clipboard runtime bridge, and commit message policy enforcement
- PRD Source: `docs/plans/2026-03-03-klip-prd.md`

## Current Phase

- Active scope: Phase 1 (MVP) plus Phase 2 settings center baseline and local desktop startup smoke baseline.
- Product state: local offline clipboard workflow with history + snippets + settings tri-mode panel in web runtime; Tauri runtime supports tray/menu bar, configurable global hotkey, best-effort direct paste with clipboard fallback, and desktop-native clipboard read/write bridge for history capture.

## Completed Highlights

- History domain modules (capture filtering, storage, repository, capacity/FIFO).
- History UI runtime wiring (search, keyboard navigation, copy-selected behavior).
- Tauri-side history model/storage/repository baseline modules.
- Snippets domain modules (folder + snippet CRUD, persistence, normalization).
- History/Snippets/Settings tri-mode panel with mode memory and keyboard mode switch (`Ctrl/Cmd+1`, `Ctrl/Cmd+2`, `Ctrl/Cmd+3`).
- Dedicated settings center baseline in panel for max history, panel hotkey apply, and paste mode selection (`src/App.tsx`, `src/styles.css`, `src/features/settings`).
- Paste mode persistence (`direct-with-fallback` vs `clipboard-only`) for desktop reliability fallback testing (`src/features/settings/pasteModeStorage.ts`).
- Tauri tray/menu bar resident entry with icon click open, menu open, and quit action (`src-tauri/src/tray.rs`).
- Tauri global hotkey baseline for opening panel, dynamic rebind, and conflict-aware error feedback (`src-tauri/src/hotkey.rs`, `src-tauri/src/lib.rs`).
- Direct paste abstraction baseline in Tauri (`src-tauri/src/direct_paste.rs`) with platform paste attempt (macOS `osascript`, Windows `SendKeys`) and clipboard fallback response.
- Desktop startup scripts added via local Tauri CLI dependency (`npm run dev:desktop`, `npm run build:desktop`, `npm run tauri:info`).
- Clipboard monitor timer binding fix for Tauri window runtime (`Can only call Window.setTimeout on instances of Window`) with regression test coverage (`src/features/history/clipboardMonitor.ts`, `tests/clipboardMonitor.test.ts`).
- Desktop-native clipboard runtime bridge added: frontend now selects desktop clipboard port (`createClipboardPort`) and Tauri exposes `read_clipboard_text` / `write_clipboard_text` commands (`src/features/history/browserClipboard.ts`, `src-tauri/src/clipboard.rs`, `src-tauri/src/lib.rs`).
- Commit message governance tightened: commit body now requires `What changes` / `Why needed` / `How tested` sections, enforced by `commit-msg` hook + validator script (`.commitlintrc.json`, `.husky/commit-msg`, `scripts/validate-commit-message.mjs`, `AGENTS.md`, `README.md`).

## In Progress / Gaps

- Direct paste path is best-effort and still needs manual verification for reliability/permissions on macOS and Windows foreground apps (US-006/US-008 hardening gap).
- History capture now has desktop-native clipboard read path, but still uses polling and lacks event-driven system listener integration (US-001 hardening gap).
- Tray behavior has baseline runtime coverage; desktop cross-platform manual verification evidence is still incomplete.
- Global hotkey behavior lacks macOS/Windows manual conflict verification evidence (US-004 final hardening gap).
- Settings center startup-launch toggle is still missing (US-010 remaining scope).
- Cross-platform installer release and e2e desktop regression baseline (US-011, US-012 partial) not implemented.

## Next Focus

1. Run focused manual verification for clipboard history capture + tray/hotkey/direct-paste on macOS/Windows (US-001/US-003/US-004/US-006).
2. Complete US-010 remaining scope: startup-launch toggle and related runtime bridge.
3. Add snippets quick-trigger strategy and conflict handling (US-008 remaining scope).

## Last Validation Snapshot

- 2026-03-04: `npm run lint` passed.
- 2026-03-04: `npm run typecheck` passed.
- 2026-03-04: `npm run test` passed (51 tests).
- 2026-03-04: `npm run test:coverage` passed (statements 89.97%, branches 87.26%, funcs 89.41%, lines 89.97%).
- 2026-03-04: `npm run test:e2e` skipped (no Playwright setup).
- 2026-03-04: `npm run build` passed.
- 2026-03-04: `npm run cargo:check` passed.
- 2026-03-04: `cargo test --manifest-path src-tauri/Cargo.toml` passed (23 tests).
- 2026-03-04: `npm run tauri:info` completed (warning: Xcode not installed, command exited successfully).
- 2026-03-04: `npm run dev:desktop` smoke passed (process reached `Running target/debug/klip-tauri`).

## Quick Resume Steps

1. Run `nvm use` (project requires Node 22 from `.nvmrc`).
2. Read `docs/status/prd-tracker.md`.
3. Read latest entries in `docs/status/progress-log.md`.
4. Run `git log --oneline -n 10`.
5. Run `npm run dev:desktop` for local desktop smoke verification.
