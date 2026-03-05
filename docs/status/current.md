# Project Status Snapshot

- Last Updated: 2026-03-05
- Branch: `main`
- Latest Commit: `4fff718` (`docs: clarify commit body line length governance`)
- Working Tree: dirty (`src/App.tsx` + `src/styles.css` + `docs/status/*`)
- PRD Source: `docs/plans/2026-03-03-klip-prd.md`

## Current Phase

- Active scope: Phase 1 (MVP) plus Phase 2 Clipy-style popup hierarchy and editor/preferences split.
- Product state: local offline clipboard workflow with History/Snippets storage, tray/menu runtime, hotkey invocation, best-effort direct paste, startup-launch setting, and packaging baseline; popup UI now uses Clipy-style flattened root sections with cascading submenu columns, while `编辑片断...` and `偏好设置...` now open standalone windows (`snippet-editor` / `preferences`) with reuse/focus lifecycle.

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
- Commit message governance follow-up now explicitly documents and enforces commit body line width `<= 100` in both team guide and commitlint config (`AGENTS.md`, `.commitlintrc.json`).
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
- Added three-window Clipy parity design spec for next implementation iteration (`docs/plans/2026-03-04-three-window-clipy-parity-design.md`).
- Popup parity follow-up implemented: removed `History/Snippets` wrapper nodes, added section headers + separators + `清除历史/编辑片断.../偏好设置.../退出 Klip`, and added multi-column cascading submenu with snippet preview pane (`src/App.tsx`, `src/features/menu/popupMenuModel.ts`, `src/styles.css`).
- Popup action runtime follow-up implemented: added history clear repository API and desktop `quit_app` Tauri command bridge (`src/features/history/historyRepository.ts`, `src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`).
- Popup shell/chrome follow-up implemented: popup webview now fills window without outer margin wrapper, and menu mode hides macOS titlebar controls by disabling decorations/resizable state (`src/styles.css`, `src/App.tsx`, `src-tauri/tauri.conf.json`).
- Popup shell/chrome follow-up updated: runtime decoration toggle is removed from resize path to avoid blocking popup `setSize`; popup sizing now follows rendered content changes via `ResizeObserver` (`src/App.tsx`, `src/styles.css`, `src-tauri/tauri.conf.json`).
- Added Tauri capability file for main window to explicitly allow runtime window operations used by popup flow (`src-tauri/capabilities/default.json`).
- Added local popup badcase screenshot artifacts for visual debugging and manual verification traceability (`docs/klip-test-ui/*.png`).
- Three-window runtime baseline implemented: popup actions now open/focus standalone `snippet-editor` and `preferences` windows (reused by label), then hide popup; frontend role-aware initialization avoids duplicate hotkey registration/clipboard monitor startup in auxiliary windows, and focus/visibility sync reloads shared local state across windows (`src-tauri/src/commands.rs`, `src-tauri/src/lib.rs`, `src/App.tsx`, `src/features/settings/hotkeyRuntime.ts`).
- Snippet editor and preferences visual baseline now aligned to Clipy screenshots: snippet editor uses toolbar + split-pane management layout, and preferences uses icon-tab navigation with Clipy-style tab content sections (`src/App.tsx`, `src/styles.css`).
- CI install reliability hardening added: workflow now pins Node `22.22.0`, pins npm `10.9.4`, disables Husky during CI install, retries `npm ci`, and dumps npm debug logs on final failure (`.github/workflows/ci.yml`).
- CI registry root-cause hardening added: lockfile `resolved` URLs are normalized from `registry.anpm.alibaba-inc.com` to `registry.npmjs.org`, project-level `.npmrc` now pins `registry=https://registry.npmjs.org/`, and CI setup/install path explicitly uses npmjs registry (`.npmrc`, `package-lock.json`, `.github/workflows/ci.yml`).
- CI cross-platform follow-up hardening added: enforce LF checkouts via `.gitattributes` to avoid Windows lint CRLF diffs, and bump Rust toolchain from `1.84.0` to `1.85.0` (repo + workflow) to handle transitive crates requiring `edition2024` parsing support (`.gitattributes`, `rust-toolchain.toml`, `.github/workflows/ci.yml`).
- CI cargo follow-up hardening added: install required Linux GTK/WebKit dependencies on Ubuntu runners before Rust checks, and add a real Windows `.ico` app icon for Tauri build-script requirements (`.github/workflows/ci.yml`, `src-tauri/icons/icon.png`, `src-tauri/icons/icon.ico`).

## In Progress / Gaps

- Direct paste path is best-effort and still needs manual verification for reliability/permissions on macOS and Windows foreground apps (US-006/US-008 hardening gap).
- History capture now has desktop-native clipboard read path, but still uses polling and lacks event-driven system listener integration (US-001 hardening gap).
- Tray behavior has baseline runtime coverage; desktop cross-platform manual verification evidence is still incomplete.
- Global hotkey behavior lacks macOS/Windows manual conflict verification evidence (US-004 final hardening gap).
- Startup-launch toggle runtime bridge is implemented, but interactive macOS/Windows verification evidence is still pending.
- US-011 packaging baseline now exists, but Windows installer artifact evidence and install/uninstall interactive checks are still pending.
- Three-window runtime split is implemented, but interactive verification evidence is still pending for popup-to-window transition, reuse/focus lifecycle, and close/reopen behavior on macOS/Windows.
- Snippet editor/preferences now have Clipy-style baseline layout, but pixel-level spacing/typography and full interaction parity still need manual screenshot verification.
- Popup badcase behavior still requires hands-on verification against newly added local screenshots (`docs/klip-test-ui`).
- Local machine is still running Node `v25.2.1`; project target is Node 22 and runtime alignment is still pending.
- Manual matrix exists, but interactive GUI step execution evidence is still pending for both macOS and Windows.

## Next Focus

1. Run macOS interactive verification for popup hierarchy, paste-hide-focus flow, and independent-window transitions (including window reuse/focus behavior).
2. Run screenshot-by-screenshot parity review for `snippet_edit.png` and `settings*.png` and capture remaining pixel diffs.
3. Continue US-011 Windows packaging evidence (artifact + install/uninstall matrix).

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
- 2026-03-04: popup parity follow-up validated via `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test` (71 tests), `npm run build`, `npm run cargo:check`, and `cargo test --manifest-path src-tauri/Cargo.toml` (24 tests).
- 2026-03-04: `npm run dev:desktop` smoke rechecked after popup parity follow-up (reached `Running target/debug/klip-tauri` before 45s command timeout).
- 2026-03-04: popup window shell/chrome fix validated via `npm run format`, `npm run lint`, `npm run typecheck`, and `npm run dev:desktop` smoke (reached `Running target/debug/klip-tauri` before 30s command timeout).
- 2026-03-04: popup resize error hotfix validated via `npm run format`, `npm run lint`, `npm run typecheck`, and `npm run dev:desktop` smoke (reached `Running target/debug/klip-tauri` before 30s command timeout).
- 2026-03-04: popup content-size sync follow-up validated via `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test` (71 tests), and `npm run dev:desktop` smoke (reached `Running target/debug/klip-tauri`).
- 2026-03-04: popup parity commit preflight validated via `npm run lint`, `npm run typecheck`, `npm run test` (71 tests), `npm run build`, `npm run cargo:check`, `cargo test --manifest-path src-tauri/Cargo.toml` (24 tests), and `npm run dev:desktop` smoke (reached `Running target/debug/klip-tauri`; Vite switched to `5174` because `5173` was occupied).
- 2026-03-04: CI workflow hardening iteration validated via `npm run lint` after updating install path in `.github/workflows/ci.yml`.
- 2026-03-04: CI registry hardening iteration validated via `npm run lint` and `npm ci --ignore-scripts` after lockfile registry normalization.
- 2026-03-04: CI cross-platform hardening follow-up validated via `npm run lint` and `npm run cargo:check` after LF normalization and Rust `1.85.0` bump.
- 2026-03-04: CI cargo follow-up validated via `npm run lint` and `npm run cargo:check` after Linux dependency install step and Windows icon asset update.
- 2026-03-04: three-window runtime split iteration validated via `npm run format`, `npm run qa` (`test` 71 tests; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`), and `cargo test --manifest-path src-tauri/Cargo.toml` (25 tests).
- 2026-03-04: `npm run dev:desktop` smoke rechecked after three-window split (reached `Running target/debug/klip-tauri`; Vite switched to `5174` because `5173` was occupied; command timed out at 45s as expected for long-running dev process).
- 2026-03-04: commit rule clarity follow-up validated via `npm run lint` after adding explicit `body-max-line-length` governance/config entries.
- 2026-03-05: snippet editor/preferences UI alignment iteration validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-05: `npm run dev:desktop` smoke rechecked after Clipy-style editor/preferences UI refactor (reached `Running target/debug/klip-tauri`; command timed out at 45s as expected for long-running dev process).

## Quick Resume Steps

1. Ensure local Node major is 22 (`node -v`; use your local version manager such as `nvm`/`asdf`/`volta` as available).
2. Read `docs/status/prd-tracker.md`.
3. Read `docs/status/manual-verification-us001-us006.md`.
4. Read `docs/status/packaging-verification-us011.md`.
5. Read latest entries in `docs/status/progress-log.md`.
6. Run `git log --oneline -n 10`.
7. Run `npm run qa`, then `npm run dev:desktop` to verify compact popup defaults, keyboard submenu navigation, and `编辑片断...` / `偏好设置...` standalone-window transitions.
