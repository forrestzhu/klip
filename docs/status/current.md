# Project Status Snapshot

- Last Updated: 2026-03-04
- Branch: `main`
- Latest Commit: `505b94d` (`feat(release): add desktop packaging baseline for us011`)
- Working Tree: uncommitted local changes for Clipy-style compact popup menu and editor/preferences split
- PRD Source: `docs/plans/2026-03-03-klip-prd.md`

## Current Phase

- Active scope: Phase 1 (MVP) plus Phase 2 Clipy-style popup hierarchy and editor/preferences split.
- Product state: local offline clipboard workflow with History/Snippets storage, tray/menu runtime, hotkey invocation, best-effort direct paste, startup-launch setting, and packaging baseline; popup UI now uses compact hierarchical menu behavior with separate large views for snippet editing and preferences.

## Completed Highlights

- History domain modules (capture filtering, storage, repository, capacity/FIFO).
- History UI runtime wiring (search, keyboard navigation, copy-selected behavior).
- Tauri-side history model/storage/repository baseline modules.
- Snippets domain modules (folder + snippet CRUD, persistence, normalization).
- History/Snippets/Settings tri-mode panel with mode memory and keyboard mode switch (`Ctrl/Cmd+1`, `Ctrl/Cmd+2`, `Ctrl/Cmd+3`).
- Dedicated settings center baseline in panel for max history, panel hotkey apply, and paste mode selection (`src/App.tsx`, `src/styles.css`, `src/features/settings`).
- Paste mode persistence (`direct-with-fallback` vs `clipboard-only`) for desktop reliability fallback testing (`src/features/settings/pasteModeStorage.ts`).
- Settings center startup-launch toggle baseline added with local persistence normalization and desktop runtime bridge (`src/features/settings/startupLaunchStorage.ts`, `src/features/settings/startupLaunchRuntime.ts`, `src-tauri/src/startup_launch.rs`, `src-tauri/src/lib.rs`).
- Tauri tray/menu bar resident entry with icon click open, menu open, and quit action (`src-tauri/src/tray.rs`).
- Tauri global hotkey baseline for opening panel, dynamic rebind, and conflict-aware error feedback (`src-tauri/src/hotkey.rs`, `src-tauri/src/lib.rs`).
- Direct paste abstraction baseline in Tauri (`src-tauri/src/direct_paste.rs`) with platform paste attempt (macOS `osascript`, Windows `SendKeys`) and clipboard fallback response.
- Desktop startup scripts added via local Tauri CLI dependency (`npm run dev:desktop`, `npm run build:desktop`, `npm run tauri:info`).
- Clipboard monitor timer binding fix for Tauri window runtime (`Can only call Window.setTimeout on instances of Window`) with regression test coverage (`src/features/history/clipboardMonitor.ts`, `tests/clipboardMonitor.test.ts`).
- Desktop-native clipboard runtime bridge added: frontend now selects desktop clipboard port (`createClipboardPort`) and Tauri exposes `read_clipboard_text` / `write_clipboard_text` commands (`src/features/history/browserClipboard.ts`, `src-tauri/src/clipboard.rs`, `src-tauri/src/lib.rs`).
- Commit message governance tightened: commit body now requires `What changes` / `Why needed` / `How tested` sections, enforced by `commit-msg` hook + validator script (`.commitlintrc.json`, `.husky/commit-msg`, `scripts/validate-commit-message.mjs`, `AGENTS.md`, `README.md`).
- Local desktop startup smoke revalidated on latest runtime baseline (`npm run dev:desktop` reached `Running target/debug/klip-tauri`), and full local `npm run qa` pipeline passed.
- Added desktop manual verification matrix baseline for US-001/US-003/US-004/US-006 with reproducible scenarios and latest preflight evidence (`docs/status/manual-verification-us001-us006.md`).
- Panel hotkey usability update: default shortcut changed to `CommandOrControl+Shift+V`, legacy default `...+K` values auto-migrate to new default, and normalized runtime values (for example `shift+super+KeyV`) now render as readable labels (for example `Cmd+Shift+V`) in Settings (`src/features/settings`, `src/App.tsx`, `src-tauri/src/hotkey.rs`).
- Panel hotkey input normalization update: runtime-returned strings (for example `shift+super+KeyV`) are now canonicalized before persistence/input display, so settings field stores and shows `CommandOrControl+Shift+V` consistently (`src/features/settings/hotkeyStorage.ts`).
- Panel hotkey draft field now canonicalizes on user input and on apply flow, preventing runtime-formatted strings from reappearing in the input box (`src/App.tsx`, `src/features/settings/hotkeyStorage.ts`).
- Panel hotkey runtime bridge now canonicalizes backend return values before they reach UI state, removing remaining `shift+super+KeyV` leakage in restart scenarios (`src/features/settings/hotkeyRuntime.ts`, `src/App.tsx`).
- Panel hotkey parser now canonicalizes by extracted tokens instead of relying on `+` separators, so runtime variants like `shift super KeyV` or `shift+super+KeyV` map to `CommandOrControl+Shift+V` consistently (`src/features/settings/hotkeyStorage.ts`).
- Desktop packaging baseline added: bundle build scripts and CI matrix workflow for macOS/Windows artifact generation (`package.json`, `src-tauri/tauri.conf.json`, `.github/workflows/desktop-packaging.yml`).
- US-011 packaging verification document added with artifact checklist, install/run/uninstall matrix, and release-note permission/limitation draft (`docs/status/packaging-verification-us011.md`).
- Local macOS packaging preflight now produced unsigned `.app` and `.dmg` artifacts (`src-tauri/target/release/bundle/macos/Klip.app`, `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`).
- Clipy-style popup hierarchy baseline added: compact menu now shows `History`/`Snippets` submenu structure plus `Edit Snippets...` and `Preferences...`, with history default capped to 30 and grouped as `1-10`, `11-20`, `21-30` (`src/App.tsx`, `src/features/menu/popupMenuModel.ts`, `src/features/history/history.constants.ts`).
- Popup keyboard navigation now supports `↑/↓` selection and `←/→` hierarchical navigation, with `Enter` selecting/pasting at leaf items (`src/App.tsx`).
- Editor/preferences split baseline added: popup stays compact by default; snippet editing and settings move to expanded panels and runtime window resize targets (`src/App.tsx`, `src/styles.css`, `src-tauri/tauri.conf.json`).

## In Progress / Gaps

- Direct paste path is best-effort and still needs manual verification for reliability/permissions on macOS and Windows foreground apps (US-006/US-008 hardening gap).
- History capture now has desktop-native clipboard read path, but still uses polling and lacks event-driven system listener integration (US-001 hardening gap).
- Tray behavior has baseline runtime coverage; desktop cross-platform manual verification evidence is still incomplete.
- Global hotkey behavior lacks macOS/Windows manual conflict verification evidence (US-004 final hardening gap).
- Startup-launch toggle runtime bridge is implemented, but interactive macOS/Windows verification evidence is still pending.
- US-011 packaging baseline now exists, but Windows installer artifact evidence and install/uninstall interactive checks are still pending.
- New Clipy-style popup behavior still needs manual interactive verification (submenu navigation, paste flow, focus return, and editor/preferences entry transitions).
- Local machine is still running Node `v25.2.1`; project target is Node 22 and runtime alignment is still pending.
- Manual matrix exists, but interactive GUI step execution evidence is still pending for both macOS and Windows.

## Next Focus

1. Run macOS interactive verification for new compact popup hierarchy (`History` ranges, `Snippets` folders, arrow-key navigation, paste-and-hide behavior).
2. Verify expanded `Edit Snippets...` and `Preferences...` transitions from popup and confirm expected window-size changes.
3. Execute the existing manual matrix (US-001/US-003/US-004/US-006) and Windows packaging/install evidence update.

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
- 2026-03-04: `npm run qa` passed (`lint`/`typecheck`/`test`/`test:e2e` skip/`build`/`test:coverage`/`cargo:check`).
- 2026-03-04: `npm run dev:desktop` smoke passed again on latest commit (`9fa6085`), with Vite auto-switching to port `5174` because `5173` was occupied.
- 2026-03-04: `npm run dev:desktop` startup preflight rechecked and logged at `/tmp/klip-dev-desktop-20260304.log` (includes `Running target/debug/klip-tauri`).
- 2026-03-04: `cargo test --manifest-path src-tauri/Cargo.toml` passed again (23 tests).
- 2026-03-04: hotkey usability update validation passed via `npm run qa` (`test` now 57 tests, `test:coverage` statements 87.55%, branches 85.57%, funcs 88.88%, lines 87.55%) and `cargo test --manifest-path src-tauri/Cargo.toml` (23 tests).
- 2026-03-04: `npm run dev:desktop` startup smoke rechecked after hotkey update (log: `/tmp/klip-dev-desktop-hotkey-20260304.log`, reached `Running target/debug/klip-tauri`).
- 2026-03-04: panel hotkey canonical-input fix validated via `npm run lint` and `npm run test` (58 tests).
- 2026-03-04: panel hotkey draft canonicalization follow-up validated via `npm run lint` and `npm run test` (59 tests).
- 2026-03-04: panel hotkey runtime-return canonicalization follow-up validated via `npm run lint` and `npm run test` (59 tests).
- 2026-03-04: token-based panel hotkey canonicalization follow-up validated via `npm run qa` (`test` 60 tests; coverage statements 87.37%, branches 85.88%, funcs 89.01%, lines 87.37%), `npm run lint`, and `cargo test --manifest-path src-tauri/Cargo.toml` (23 tests).
- 2026-03-04: startup-launch toggle/runtime bridge iteration validated via `npm run qa` (`test` 65 tests; coverage statements 86.55%, branches 86.47%, funcs 87.5%, lines 86.55%), `cargo test --manifest-path src-tauri/Cargo.toml` (24 tests), and `npm run dev:desktop` smoke (reached `Running target/debug/klip-tauri` before command timeout at 35s).
- 2026-03-04: `npm run tauri:info` rechecked for US-011 baseline (Xcode app missing warning remains; build-type now `bundle`; log: `/tmp/klip-tauri-info-us011-20260304.log`).
- 2026-03-04: `npm run build:desktop:bundle:macos` passed and produced unsigned artifacts (`Klip.app` + `Klip_0.1.0_aarch64.dmg`; log: `/tmp/klip-build-bundle-macos-us011-20260304.log`).
- 2026-03-04: `npm run qa` revalidated after US-011 baseline changes (`test` 65 tests; coverage statements 86.55%, branches 86.47%, funcs 87.5%, lines 86.55%).
- 2026-03-04: Clipy-style popup/editor split iteration validated via `npm run lint`, `npm run typecheck`, `npm run test` (68 tests), and `npm run qa` (coverage statements 87.62%, branches 86.77%, funcs 87.25%, lines 87.62%).
- 2026-03-04: `npm run dev:desktop` smoke rechecked after popup/menu refactor (log: `/tmp/klip-dev-desktop-menu-rework-20260304.log`, reached `Running target/debug/klip-tauri` before timeout).

## Quick Resume Steps

1. Ensure local Node major is 22 (`node -v`; use your local version manager such as `nvm`/`asdf`/`volta` as available).
2. Read `docs/status/prd-tracker.md`.
3. Read `docs/status/manual-verification-us001-us006.md`.
4. Read `docs/status/packaging-verification-us011.md`.
5. Read latest entries in `docs/status/progress-log.md`.
6. Run `git log --oneline -n 10`.
7. Run `npm run qa`, then `npm run dev:desktop` to verify compact popup defaults and keyboard submenu navigation.
