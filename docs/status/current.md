# Project Status Snapshot

- Last Updated: 2026-04-01
- Branch: `main`
- Latest Commit: `cf9446d` (`fix: resolve TypeScript errors in clipboardMonitor and historyStats`)
- Working Tree: clean
- PRD Source: `docs/plans/2026-03-03-klip-prd.md`

## Current Phase

- Active scope: Phase 1 (MVP) plus Phase 2 Clipy-style popup hierarchy/editor/preferences split, with browser-side Playwright E2E regression baseline now covering baseline, second-batch, third-batch, and fourth-batch popup/editor validation ahead of manual desktop verification.
- Product state: local offline clipboard workflow with History/Snippets storage, tray/menu runtime, hotkey invocation, best-effort direct paste, startup-launch setting, and packaging baseline with tag-triggered GitHub Release asset upload, custom release-note template, optional macOS signing/notarization path when Apple CI secrets are configured, and a dedicated runbook for Apple secret registration / verification; the main popup is now routed through a dedicated native panel presenter that anchors the panel near the cursor, clamps it to the active monitor work area, stores the pre-popup foreground target, and reuses that target during direct paste; on macOS the presenter now applies accessory-tray runtime behavior plus native `NSWindow` panel-style collection behavior (`CanJoinAllSpaces` + `MoveToActiveSpace` + `FullScreenAuxiliary`) so the popup can stay in the active desktop/full-screen context instead of jumping to a separate Klip Space, while the Windows path now shares the same presenter abstraction for cursor-based placement and foreground-target restore plumbing; popup UI now uses Clipy-style flattened root sections with cascading submenu columns, while `编辑片断...` and `偏好设置...` open standalone windows (`snippet-editor` / `preferences`) with reuse/focus lifecycle, and browser preview now has Playwright coverage for popup search, inline management views, `;alias` lookup, settings persistence, clear-history confirm + empty-history action messaging, alias-conflict/invalid-alias guardrails, submenu keyboard traversal, snippet delete confirmation, folder CRUD/relocation, folder rename conflict handling, and browser-preview quit-action handling.

## Completed Highlights

- History domain modules (capture filtering, storage, repository, capacity/FIFO).
- History UI runtime wiring (search, keyboard navigation, copy-selected behavior).
- Tauri-side history model/storage/repository baseline modules.
- Snippets domain modules (folder + snippet CRUD, persistence, normalization).
- History/Snippets/Settings tri-mode panel with mode memory and keyboard mode switch (`Ctrl/Cmd+1`, `Ctrl/Cmd+2`, `Ctrl/Cmd+3`).
- Dedicated settings center baseline in panel for max history, panel hotkey apply, and paste mode selection (`src/App.tsx`, `src/styles.css`, `src/features/settings`).
- Paste mode persistence (`direct-with-fallback` vs `clipboard-only`) for desktop reliability fallback testing (`src/features/settings/pasteModeStorage.ts`).
- Settings center startup-launch toggle baseline added with local persistence normalization and desktop runtime bridge (`src/features/settings/startupLaunchStorage.ts`, `src/features/settings/startupLaunchRuntime.ts`, `src-tauri/src/startup_launch.rs`, `src-tauri/src/lib.rs`).
- Preferences window now shows a low-visibility build footer with the current short commit (and `-dirty` when built from a dirty tree), injected at Vite build time so installed builds can be identified from the settings window without access to git metadata (`vite.config.ts`, `src/features/build/buildInfo.ts`, `src/App.tsx`, `src/styles.css`).
- Tauri tray/menu bar resident entry with icon click open, menu open, and quit action (`src-tauri/src/tray.rs`).
- macOS tray follow-up now also sets a non-empty `Klip` title fallback so the menu-bar item still has visible text even when the template icon is subtle (`src-tauri/src/tray.rs`).
- Tauri global hotkey baseline for opening panel, dynamic rebind, and conflict-aware error feedback (`src-tauri/src/hotkey.rs`, `src-tauri/src/lib.rs`).
- Direct paste abstraction baseline in Tauri (`src-tauri/src/direct_paste.rs`) with platform paste attempt (macOS `osascript`, Windows `SendKeys`) and clipboard fallback response.
- Native panel presenter follow-up now centralizes popup presentation, cursor-relative positioning, previous-target capture, and pre-paste focus restoration; macOS applies native `NSWindow` panel-style behavior lazily when the panel is actually presented, which avoids the installed-app startup abort seen when that native collection-behavior mutation was attempted too early during `setup`, and the latest follow-up also removes the invalid `MoveToActiveSpace` mutation that caused AppKit to abort the app as soon as the panel was shown via hotkey/tray while retaining a safe `FullScreenAuxiliary` collection behavior plus status-window level/hide-on-deactivate semantics; the tray icon now uses a dedicated macOS template asset so the menu bar item remains visible in the native menu bar appearance, while direct paste now preflights macOS Accessibility trust before hiding/restoring focus so permission-denied cases stay in-panel with an actionable fallback message instead of appearing to do nothing (`src-tauri/src/panel_presenter.rs`, `src-tauri/src/panel_presenter/macos.rs`, `src-tauri/src/panel_presenter/windows.rs`, `src-tauri/src/direct_paste.rs`, `src-tauri/src/tray.rs`, `src-tauri/src/lib.rs`, `src/features/paste/directPasteFeedback.ts`, `src/App.tsx`).
- Desktop startup scripts added via local Tauri CLI dependency (`npm run dev:desktop`, `npm run build:desktop`, `npm run tauri:info`).
- Clipboard monitor timer binding fix for Tauri window runtime (`Can only call Window.setTimeout on instances of Window`) with regression test coverage (`src/features/history/clipboardMonitor.ts`, `tests/clipboardMonitor.test.ts`).
- Desktop-native clipboard runtime bridge added: frontend now selects desktop clipboard port (`createClipboardPort`) and Tauri exposes `read_clipboard_text` / `write_clipboard_text` commands (`src/features/history/browserClipboard.ts`, `src-tauri/src/clipboard.rs`, `src-tauri/src/lib.rs`).
- Desktop event-driven clipboard listener baseline added: Tauri now runs `clipboard-rs` watcher and emits `klip://clipboard-updated` to main window, while frontend clipboard monitor subscribes to events with polling fallback and added regression coverage for subscription/unsubscribe/fallback paths (`src-tauri/src/clipboard_listener.rs`, `src-tauri/src/lib.rs`, `src/features/history/browserClipboard.ts`, `src/features/history/clipboardMonitor.ts`, `tests/clipboardMonitor.test.ts`).
- Commit message governance tightened: commit body now requires `What changes` / `Why needed` / `How tested` sections, enforced by `commit-msg` hook + validator script (`.commitlintrc.json`, `.husky/commit-msg`, `scripts/validate-commit-message.mjs`, `AGENTS.md`, `README.md`).
- Commit message governance follow-up now explicitly documents and enforces commit body line width `<= 100` in both team guide and commitlint config (`AGENTS.md`, `.commitlintrc.json`).
- Local desktop startup smoke revalidated on latest runtime baseline (`npm run dev:desktop` reached `Running target/debug/klip-tauri`), and full local `npm run qa` pipeline passed.
- Added desktop manual verification matrix baseline for US-001/US-003/US-004/US-006 with reproducible scenarios and latest preflight evidence (`docs/status/manual-verification-us001-us006.md`).
- Manual verification matrix refreshed for event-driven listener baseline: updated preflight evidence (`/tmp/klip-dev-desktop-event-listener-20260306.log`, `npm run qa`, `cargo test`) and expanded US-001 scenarios for event-driven capture latency and hide/reopen continuity (`docs/status/manual-verification-us001-us006.md`).
- Manual verification matrix refreshed for snippet alias baseline: updated startup log evidence (`/tmp/klip-dev-desktop-alias-20260306.log`), baseline commit (`f13f390`), and added US-008 `;alias` quick-search scenarios (`docs/status/manual-verification-us001-us006.md`).
- Panel hotkey usability update: default shortcut changed to `CommandOrControl+Shift+V`, legacy default `...+K` values auto-migrate to new default, and normalized runtime values (for example `shift+super+KeyV`) now render as readable labels (for example `Cmd+Shift+V`) in Settings (`src/features/settings`, `src/App.tsx`, `src-tauri/src/hotkey.rs`).
- Panel hotkey input normalization update: runtime-returned strings (for example `shift+super+KeyV`) are now canonicalized before persistence/input display, so settings field stores and shows `CommandOrControl+Shift+V` consistently (`src/features/settings/hotkeyStorage.ts`).
- Panel hotkey draft field now canonicalizes on user input and on apply flow, preventing runtime-formatted strings from reappearing in the input box (`src/App.tsx`, `src/features/settings/hotkeyStorage.ts`).
- Panel hotkey runtime bridge now canonicalizes backend return values before they reach UI state, removing remaining `shift+super+KeyV` leakage in restart scenarios (`src/features/settings/hotkeyRuntime.ts`, `src/App.tsx`).
- Panel hotkey parser now canonicalizes by extracted tokens instead of relying on `+` separators, so runtime variants like `shift super KeyV` or `shift+super+KeyV` map to `CommandOrControl+Shift+V` consistently (`src/features/settings/hotkeyStorage.ts`).
- Global snippet alias hotkey trigger baseline added: settings now support independent alias hotkey persistence/apply/disable, Tauri can register/unregister a second shortcut, and alias-hotkey press opens popup then pre-fills `;` with focused search input for direct alias typing (`src/features/settings`, `src-tauri/src/hotkey.rs`, `src-tauri/src/lib.rs`, `src/App.tsx`, `tests/snippetAliasHotkeyStorage.test.ts`).
- Desktop packaging baseline added: bundle build scripts and CI matrix workflow for macOS/Windows artifact generation (`package.json`, `src-tauri/tauri.conf.json`, `.github/workflows/desktop-packaging.yml`).
- US-011 packaging verification document added with artifact checklist, install/run/uninstall matrix, and release-note permission/limitation draft (`docs/status/packaging-verification-us011.md`).
- Desktop packaging workflow now preserves manual-dispatch artifact uploads and publishes tag-triggered GitHub Release assets for unsigned macOS `.dmg` and Windows `.exe` bundles (`.github/workflows/desktop-packaging.yml`).
- Desktop packaging release metadata now uses a checked-in GitHub Release body template, and macOS tag builds can switch between unsigned, signed-only, or signed-and-notarized bundle modes depending on configured Apple secrets (`.github/release-notes-template.md`, `.github/workflows/desktop-packaging.yml`, `package.json`, `README.md`, `docs/status/packaging-verification-us011.md`).
- Added a dedicated Apple release secrets setup runbook covering CSR creation, Developer ID certificate export, App Store Connect API key generation, GitHub secret registration, and release verification flow (`docs/release/apple-release-secrets-setup.md`, `README.md`, `docs/status/packaging-verification-us011.md`).
- Rebuilt the unsigned local macOS packaging artifacts on the latest release-automation baseline so DMG installation verification can proceed against a fresh bundle (`src-tauri/target/release/bundle/macos/Klip.app`, `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`, `/tmp/klip-build-bundle-macos-20260307.log`).
- Added a macOS panel workspace fix: the main popup window is now configured for `visible_on_all_workspaces`, and the app switches to `ActivationPolicy::Accessory` with the Dock hidden so panel hotkey invocation behaves like a tray app instead of switching to a separate Klip desktop (`src-tauri/src/lib.rs`, `src-tauri/src/tray.rs`, `/tmp/klip-build-bundle-macos-space-fix-20260307.log`).
- Added a macOS direct-paste focus restoration fix: showing the panel now records the previously frontmost app, and direct paste hides Klip, re-activates that app, waits briefly, and only then sends the synthetic paste shortcut so text should return to the original target instead of the panel itself (`src-tauri/src/tray.rs`, `src-tauri/src/direct_paste.rs`, `/tmp/klip-build-bundle-macos-paste-fix-20260307.log`).
- Local macOS packaging preflight now produced unsigned `.app` and `.dmg` artifacts (`src-tauri/target/release/bundle/macos/Klip.app`, `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg`).
- Clipy-style popup hierarchy baseline added: compact menu now shows `History`/`Snippets` submenu structure plus `Edit Snippets...` and `Preferences...`, with history default capped to 30 and grouped as `1-10`, `11-20`, `21-30` (`src/App.tsx`, `src/features/menu/popupMenuModel.ts`, `src/features/history/history.constants.ts`).
- Popup keyboard navigation now supports `↑/↓` selection and `←/→` hierarchical navigation, with `Enter` selecting/pasting at leaf items (`src/App.tsx`).
- Popup search baseline added: compact menu now includes a real-time search input, with query-mode flattened history/snippet results (directly selectable without entering submenus), keyboard navigation from the search box (`↑/↓/←/→/Enter`), and explicit empty-state labels for unmatched history/snippet queries (`src/App.tsx`, `src/features/menu/popupMenuModel.ts`, `src/styles.css`, `tests/popupMenuModel.test.ts`).
- Snippet alias trigger baseline added: snippets now support optional normalized alias metadata, editor UI supports alias input/validation/conflict feedback, and popup/snippet search supports `;alias` lookup with query-mode ranking for faster direct paste (`src/features/snippets`, `src/App.tsx`, `src/features/menu/popupMenuModel.ts`, `tests/snippet*.test.ts`, `tests/popupMenuModel.test.ts`).
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
- Preferences top-level tab bar now enforces fixed single-row layout (7 primary tabs in one line) for Clipy parity in the `480x374` preferences window (`src/App.tsx`, `src/styles.css`).
- Clipy visual convergence follow-up tuned preferences primary tab/icon sizes, content typography scale, and snippet toolbar button proportions for closer screenshot parity while keeping single-row constraints (`src/styles.css`).
- UI consistency follow-up now unifies dropdown/select visuals across preferences and snippets (removing native metallic style), and further scales down preferences menu typography for closer screenshot parity (`src/App.tsx`, `src/styles.css`).
- Popup panel height behavior follow-up now locks menu-column heights to a stable baseline and keeps preview/list scroll gutters stable, preventing left-panel length jumps when hovering different snippet/menu entries (`src/styles.css`).
- Popup snippet-hover follow-up raises fixed popup column baseline to prevent internal content compression/truncation when snippet preview opens, while keeping panel height stable (`src/styles.css`).
- Popup root-cause follow-up now replaces static popup-height constant with runtime-measured stable column height (session max) and switches desktop window sizing to visible bounding-box measurements, preventing snippet-hover clipping/regressions from overflow-based resize calculations (`src/App.tsx`, `src/styles.css`).
- Popup stability follow-up now decouples stable-height measurement from hover-state transitions by deriving the baseline from root-column content only and only on root-entry changes, avoiding hover-driven internal row-metric churn (`src/App.tsx`).
- Popup responsive root-cause follow-up now scopes `@media (max-width: 760px)` management rules to `.app-shell-expanded` only and removes popup-specific breakpoint overrides, preventing hover-driven popup width changes from switching row metrics; added regression guard test to keep popup selectors out of that media block (`src/styles.css`, `tests/popupResponsiveScope.test.ts`).
- CI install reliability hardening added: workflow now pins Node `22.22.0`, pins npm `10.9.4`, disables Husky during CI install, retries `npm ci`, and dumps npm debug logs on final failure (`.github/workflows/ci.yml`).
- CI registry root-cause hardening added: lockfile `resolved` URLs are normalized from `registry.anpm.alibaba-inc.com` to `registry.npmjs.org`, project-level `.npmrc` now pins `registry=https://registry.npmjs.org/`, and CI setup/install path explicitly uses npmjs registry (`.npmrc`, `package-lock.json`, `.github/workflows/ci.yml`).
- CI cross-platform follow-up hardening added: enforce LF checkouts via `.gitattributes` to avoid Windows lint CRLF diffs, and bump Rust toolchain from `1.84.0` to `1.85.0` (repo + workflow) to handle transitive crates requiring `edition2024` parsing support (`.gitattributes`, `rust-toolchain.toml`, `.github/workflows/ci.yml`).
- CI cargo follow-up hardening added: install required Linux GTK/WebKit dependencies on Ubuntu runners before Rust checks, and add a real Windows `.ico` app icon for Tauri build-script requirements (`.github/workflows/ci.yml`, `src-tauri/icons/icon.png`, `src-tauri/icons/icon.ico`).
- Browser Playwright E2E suite now covers thirteen preview-mode Chromium scenarios with seeded browser fixtures, deterministic clipboard/localStorage control, CI browser install wiring, and artifact ignore rules (`playwright.config.ts`, `tests/e2e/browser-preview.spec.ts`, `tests/e2e/fixtures.ts`, `.github/workflows/ci.yml`, `.gitignore`).

## In Progress / Gaps

- Direct paste path now restores a captured previous target through the shared presenter instead of blindly pasting after a fixed delay, but it still needs manual verification for reliability/permissions on macOS and Windows foreground apps (US-006/US-008 hardening gap).
- History capture now has desktop event-driven listener + polling fallback, but interactive macOS/Windows reliability verification evidence is still pending (US-001 hardening gap).
- Popup search (including query-mode flattened direct-paste flow) is now implemented, but interactive latency/usability verification evidence is still pending for larger history datasets on desktop runtime (US-005 hardening gap).
- Snippet alias lookup and global alias hotkey trigger are implemented, but cross-platform interactive verification evidence is still pending (US-008 remaining gap).
- Browser Playwright coverage now protects preview-mode popup/history/snippet/settings regressions including clear-history confirm + empty-history action messaging, alias-conflict and invalid-alias rejection, submenu keyboard traversal, snippet delete confirm, folder CRUD/relocation, folder rename conflict handling, and browser-preview quit-action handling, but it does not cover Tauri-only tray/hotkey/direct-paste/independent-window behavior.
- Tray behavior has baseline runtime coverage and now includes a macOS title fallback for menu-bar visibility, but desktop cross-platform manual verification evidence is still incomplete.
- Global hotkey behavior now routes through the native panel presenter with cursor-relative placement, but macOS/Windows manual conflict and placement verification evidence is still pending (US-004 final hardening gap).
- The native macOS panel presenter fix is implemented, and both the startup regression that made freshly installed builds quit immediately and the panel-show regression that aborted the app when the hotkey/tray tried to present the panel are now fixed in the rebuilt DMG; direct paste now explicitly gates on macOS Accessibility permission and no longer silently closes the panel on fallback, but hands-on verification is still pending for fullscreen apps, non-fullscreen apps, multi-display cursor anchoring, menu-bar icon visibility, and successful post-permission direct paste into the original foreground app.
- The latest unsigned DMG has been rebuilt for reinstall testing after the macOS startup/panel-show/direct-paste follow-ups; local `tauri build --bundles app,dmg` currently succeeds again, though future runs may still require cleaning stale mounted `rw.*.dmg` leftovers before the DMG step can succeed.
- Startup-launch toggle runtime bridge is implemented, but interactive macOS/Windows verification evidence is still pending.
- US-011 packaging baseline now covers CI artifact generation, checked-in release metadata, optional macOS signing/notarization automation on tag builds, and a dedicated Apple secret provisioning runbook, but a real signed/notarized tag run plus Windows installer artifact evidence and install/uninstall interactive checks are still pending.
- Three-window runtime split is implemented, but interactive verification evidence is still pending for popup-to-window transition, reuse/focus lifecycle, and close/reopen behavior on macOS/Windows.
- Snippet editor/preferences now have Clipy-style baseline layout, but pixel-level spacing/typography and full interaction parity still need manual screenshot verification.
- Popup badcase behavior still requires hands-on verification against newly added local screenshots (`docs/klip-test-ui`).
- Local machine is still running Node `v25.2.1`; project target is Node 22 and runtime alignment is still pending.
- Manual matrix exists, but interactive GUI step execution evidence is still pending for both macOS and Windows.

## Next Focus

1. Validate the latest desktop build in real macOS apps, especially menu-bar icon visibility, fullscreen current-space behavior, cursor-relative popup positioning, and restored direct paste into the original target across non-fullscreen/fullscreen/multi-display scenarios now that the installed-app startup regression and hotkey-panel crash are fixed and direct paste now surfaces Accessibility gating more clearly, then continue popup hierarchy + popup search (`;alias`) / alias-hotkey-trigger flow, paste-hide-focus behavior, independent-window transitions, and event-driven clipboard capture behavior.
2. Complete screenshot-level parity review for popup, snippet editor, and preferences windows.
3. Review `docs/release/apple-release-secrets-setup.md`, provision Apple release secrets, run a tag-based US-011 release dry run, and continue Windows packaging evidence (Release upload + install/uninstall matrix).

## Last Validation Snapshot

- 2026-03-07: `cargo test --manifest-path src-tauri/Cargo.toml` passed after adding the macOS tray title fallback (36 Rust tests including the new non-empty tray-title regression).
- 2026-03-07: `npm run lint` passed after the macOS tray title follow-up (Biome reported existing schema-version info only).
- 2026-03-07: `npm run typecheck` passed after the macOS tray title follow-up.
- 2026-03-07: `npm run test` passed (90 tests) after the macOS tray title follow-up.
- 2026-03-07: `npm run build` passed after the macOS tray title follow-up.
- 2026-03-07: `npm run cargo:check` passed after the macOS tray title follow-up.
- 2026-03-07: `git diff --check` passed after the macOS tray title follow-up and status refresh.
- 2026-03-07: `cargo test --manifest-path src-tauri/Cargo.toml` passed after the macOS tray-icon/direct-paste follow-up (35 Rust tests including tray-icon asset and Accessibility guidance regressions; log: `/tmp/klip-followup-verify-20260307-195815/cargo-test.log`).
- 2026-03-07: `npm run cargo:check` passed after the macOS tray-icon/direct-paste follow-up (log: `/tmp/klip-followup-verify-20260307-195815/cargo-check.log`).
- 2026-03-07: `npm run lint` passed after the macOS tray-icon/direct-paste follow-up (Biome reported existing schema-version info only; log: `/tmp/klip-followup-verify-20260307-195815/lint-rerun.log`).
- 2026-03-07: `npm run typecheck` passed after the macOS tray-icon/direct-paste follow-up (log: `/tmp/klip-followup-verify-20260307-195815/typecheck-rerun.log`).
- 2026-03-07: `npm run test` passed (90 tests) after adding direct-paste fallback hide-behavior coverage (log: `/tmp/klip-followup-verify-20260307-195815/test-rerun.log`).
- 2026-03-07: `npm run build` passed after the macOS tray-icon/direct-paste follow-up (log: `/tmp/klip-followup-verify-20260307-195815/build-rerun.log`).
- 2026-03-07: `npm run build:desktop:bundle:macos` passed after the macOS tray-icon/direct-paste follow-up, rebuilding fresh unsigned `Klip.app` / `Klip_0.1.0_aarch64.dmg` artifacts (log: `/tmp/klip-followup-verify-20260307-195815/bundle-macos-rerun.log`).
- 2026-03-07: `hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` passed for the rebuilt DMG after the macOS tray-icon/direct-paste follow-up (log: `/tmp/klip-followup-verify-20260307-195815/dmg-verify-rerun.log`; sha256 `f428dcf39b2cc9d4f05e37025cbc515b3d4e9b109c89f8085a54b6984b59f10c`).
- 2026-03-07: install-from-DMG launch verification passed again after the macOS tray-icon/direct-paste follow-up by mounting the rebuilt DMG, reinstalling `/Applications/Klip.app`, detaching the image, and confirming the installed app stayed resident after launch (logs: `/tmp/klip-install-verify-followup-20260307-195938/hdiutil-attach.log`, `/tmp/klip-install-verify-followup-20260307-195938/installed-launch.status`).
- 2026-03-07: `git diff --check` passed after the macOS tray-icon/direct-paste follow-up and status refresh (log: `/tmp/klip-followup-verify-20260307-195815/diff-check-rerun.log`).
- 2026-03-07: `cargo test --manifest-path src-tauri/Cargo.toml` passed after the macOS hotkey/panel regression fix (33 Rust tests including new `panel_presenter::macos` regressions; log: `/tmp/klip-fix-verify-20260307-193152/cargo-test.log`).
- 2026-03-07: `npm run cargo:check` passed after removing the invalid macOS `MoveToActiveSpace` panel mutation and enabling template tray icons (log: `/tmp/klip-fix-verify-20260307-193152/cargo-check.log`).
- 2026-03-07: `npm run lint` passed after the macOS hotkey/panel regression fix (Biome reported existing schema-version info only; log: `/tmp/klip-fix-verify-20260307-193152/lint.log`).
- 2026-03-07: `npm run typecheck` passed after the macOS hotkey/panel regression fix (log: `/tmp/klip-fix-verify-20260307-193152/typecheck.log`).
- 2026-03-07: `npm run test` passed (88 tests) after the macOS hotkey/panel regression fix (log: `/tmp/klip-fix-verify-20260307-193152/test.log`).
- 2026-03-07: `npm run build` passed after the macOS hotkey/panel regression fix (log: `/tmp/klip-fix-verify-20260307-193152/build.log`).
- 2026-03-07: `npm run build:desktop:bundle:macos` passed after the macOS hotkey/panel regression fix, rebuilding fresh unsigned `Klip.app` / `Klip_0.1.0_aarch64.dmg` artifacts (log: `/tmp/klip-fix-verify-20260307-193152/bundle-macos.log`).
- 2026-03-07: `hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` passed for the rebuilt DMG after the macOS hotkey/panel regression fix (log: `/tmp/klip-fix-verify-20260307-193152/dmg-verify.log`; sha256 `d16ad2ccab87fbe6e3c21f78a721835d3a2d2a05658649b64ff3dfa922651c3d`).
- 2026-03-07: install-from-DMG launch verification passed again after the macOS hotkey/panel regression fix by mounting the rebuilt DMG, reinstalling `/Applications/Klip.app`, detaching the image, and confirming the installed app stayed resident after launch (logs: `/tmp/klip-install-verify-fix-20260307-193309/hdiutil-attach.log`, `/tmp/klip-install-verify-fix-20260307-193309/installed-launch.status`).
- 2026-03-07: `git diff --check` passed after the macOS hotkey/panel regression fix and status refresh (log: `/tmp/klip-fix-verify-20260307-193152/diff-check.log`).
- 2026-03-07: `cargo test --manifest-path src-tauri/Cargo.toml` passed again (31 Rust tests) after fixing the macOS installed-app startup regression by deferring native panel window mutation until panel presentation (log: `/tmp/klip-verify-20260307-190439/cargo-test.log`).
- 2026-03-07: `npm run cargo:check` passed after the macOS startup-regression fix using `PATH=/opt/homebrew/bin:$PATH` (log: `/tmp/klip-verify-20260307-190439/cargo-check.log`; local Node remained `v25.2.1` because Node 22 switching was unavailable on this machine).
- 2026-03-07: `npm run lint` passed after the macOS startup-regression fix (Biome reported existing schema-version info only; log: `/tmp/klip-verify-20260307-190439/lint.log`).
- 2026-03-07: `npm run typecheck` passed after the macOS startup-regression fix (log: `/tmp/klip-verify-20260307-190439/typecheck.log`).
- 2026-03-07: `npm run test` passed (88 tests) after the macOS startup-regression fix (log: `/tmp/klip-verify-20260307-190439/test.log`).
- 2026-03-07: `npm run build` passed after the macOS startup-regression fix (log: `/tmp/klip-verify-20260307-190439/build.log`).
- 2026-03-07: `npm run build:desktop:bundle:macos` passed after the macOS startup-regression fix, rebuilding fresh unsigned `Klip.app` / `Klip_0.1.0_aarch64.dmg` artifacts (log: `/tmp/klip-verify-20260307-190439/bundle-macos.log`).
- 2026-03-07: `hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` passed for the rebuilt DMG after the startup-regression fix (log: `/tmp/klip-verify-20260307-190439/dmg-verify.log`; sha256 `13995e6ede608fdbe86811991e7b7a92675faaa528668d80503cf9fd5cf28e44`).
- 2026-03-07: direct launch of the rebuilt release bundle stayed resident for at least 5 seconds after startup (`src-tauri/target/release/bundle/macos/Klip.app/Contents/MacOS/klip-tauri`; log: `/tmp/klip-verify-20260307-190439/release-launch.status`).
- 2026-03-07: install-from-DMG launch verification passed by mounting the rebuilt DMG, reinstalling `/Applications/Klip.app`, detaching the image, and confirming the installed app stayed resident after launch (logs: `/tmp/klip-install-verify-20260307-190701/hdiutil-attach.log`, `/tmp/klip-install-verify-20260307-190701/installed-launch.status`).
- 2026-03-07: `git diff --check` passed after the macOS startup-regression fix and status-doc refresh (log: `/tmp/klip-verify-20260307-190439/diff-check.log`).
- 2026-03-07: `npm run typecheck` passed after the preferences build-commit footer changes.
- 2026-03-07: `npm run test` passed (88 tests) after adding `tests/buildInfo.test.ts`.
- 2026-03-07: `npm run build` passed after Vite build-commit injection changes, and the built asset contains `b9c06de-dirty`.
- 2026-03-07: `npm run lint` passed after preferences build-commit footer changes (Biome reported existing schema-version info only).
- 2026-03-07: `cargo test --manifest-path src-tauri/Cargo.toml` passed (31 Rust tests) after the native panel presenter, cursor-based positioning, and pre-paste restore changes.
- 2026-03-07: `npm run cargo:check` passed after the native panel presenter changes using `PATH=/opt/homebrew/bin:$PATH` (local Node `v25.2.1`; Node 22 was still unavailable on this machine).
- 2026-03-07: `npm run lint` passed after native panel presenter + status updates (Biome reported existing schema-version info only).
- 2026-03-07: `npm run typecheck` passed after native panel presenter changes.
- 2026-03-07: `npm run test` passed (85 tests) after native panel presenter changes.
- 2026-03-07: `npm run build` passed after native panel presenter changes.
- 2026-03-07: `npm run build:desktop` passed after native panel presenter changes, producing debug desktop app `src-tauri/target/debug/klip-tauri`.
- 2026-03-07: `.github/workflows/desktop-packaging.yml` parsed successfully via `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/desktop-packaging.yml')"` .
- 2026-03-07: `.github/release-notes-template.md` render preview passed via `GITHUB_REF_NAME=v0.1.0 sed "s/{{TAG_NAME}}/${GITHUB_REF_NAME}/g" .github/release-notes-template.md > /tmp/klip-release-notes-preview.md`.
- 2026-03-07: `npm run build:desktop:bundle:macos` passed on commit `b9c06de`, producing fresh local `Klip.app` / `Klip_0.1.0_aarch64.dmg` artifacts (log: `/tmp/klip-build-bundle-macos-20260307.log`; local Node remained `v25.2.1` because Node 22 switching was unavailable).
- 2026-03-07: `npm run cargo:check` passed after the macOS panel workspace fix (`src-tauri/src/lib.rs`, `src-tauri/src/tray.rs`).
- 2026-03-07: `npm run build:desktop:bundle:macos` passed after the macOS panel workspace fix, rebuilding `Klip.app` / `Klip_0.1.0_aarch64.dmg` for DMG verification (log: `/tmp/klip-build-bundle-macos-space-fix-20260307.log`).
- 2026-03-07: `npm run cargo:check` passed after the macOS direct-paste focus restoration fix (`src-tauri/src/direct_paste.rs`, `src-tauri/src/tray.rs`).
- 2026-03-07: `npm run build:desktop:bundle:macos` passed after the macOS direct-paste focus restoration fix, rebuilding `Klip.app` / `Klip_0.1.0_aarch64.dmg` for another DMG verification pass (log: `/tmp/klip-build-bundle-macos-paste-fix-20260307.log`).
- 2026-03-07: `npm run build:desktop:bundle:macos` rebuilt `Klip.app` for the native panel follow-up but the DMG step failed because a stale temporary `rw.*.Klip_0.1.0_aarch64.dmg` remained mounted (log: `/tmp/klip-build-bundle-macos-native-panel-20260307.log`).
- 2026-03-07: manual `src-tauri/target/release/bundle/dmg/bundle_dmg.sh --volname "Klip" ...` passed after detaching stale `/dev/disk8` and deleting `src-tauri/target/release/bundle/macos/rw.40197.Klip_0.1.0_aarch64.dmg`, producing fresh `src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` (sha256 `602fb883e3975d80de427c7d6f7d0d22379f912b3a06aca37c15134bc4ca3b06`).
- 2026-03-07: `hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` passed after the manual rebuild, confirming the DMG checksum is valid.
- 2026-03-07: `npm run build:desktop:bundle:macos` passed after the preferences build-commit footer changes, producing fresh `Klip.app` / `Klip_0.1.0_aarch64.dmg` (log: `/tmp/klip-build-bundle-macos-rebuild-20260307-183433.log`).
- 2026-03-07: `hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` passed for the freshly rebuilt DMG (log: `/tmp/klip-dmg-verify-20260307-183433.log`; sha256 `93a7147dfb8b79c53eaac0c570dc724a3e4005596e675b744b4d5e9b19d7b4ca`).
- 2026-03-07: `git diff --check` passed after desktop release workflow/status updates.
- 2026-03-07: `npm run lint` passed after Apple release guide documentation updates.
- 2026-03-07: `npm run format` passed.
- 2026-03-07: `npm run lint` passed after desktop release workflow/status updates.
- 2026-03-07: `npm run typecheck` passed after release metadata/signing workflow updates.
- 2026-03-07: `npm run lint` and `npm run typecheck` passed again after the macOS panel workspace fix (Biome reported existing schema-version info only).
- 2026-03-07: `npm run test` passed (85 tests).
- 2026-03-07: `npm run test:e2e` passed (13 browser-preview Chromium scenarios).
- 2026-03-07: `npm run build` passed.
- 2026-03-07: `npm run test:coverage` passed (statements 85.24%, branches 86.94%, funcs 84.67%, lines 85.24%).
- 2026-03-07: `npm run cargo:check` passed.
- 2026-03-04: `cargo test --manifest-path src-tauri/Cargo.toml` passed (23 tests).
- 2026-03-04: `npm run tauri:info` completed (warning: Xcode not installed, command exited successfully).
- 2026-03-04: `npm run dev:desktop` smoke passed (process reached `Running target/debug/klip-tauri`).
- 2026-03-07: `npm run qa` passed (`lint`/`typecheck`/`test`/`test:e2e`/`build`/`test:coverage`/`cargo:check`).
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
- 2026-03-05: preferences tab single-row follow-up validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-05: preferences/snippet visual-scale convergence follow-up validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-05: preferences/snippets typography + select-consistency follow-up validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-05: popup left-panel stability + menu-title size follow-up validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-05: popup snippet-hover truncation follow-up (raised fixed popup column baseline + menu title downscale) validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-06: popup root-cause stabilization follow-up (runtime-measured stable column height + bounding-box resize) validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-06: popup hover-decoupled stable-height follow-up (root-column-only baseline measurement) validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 71 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-06: popup responsive-scope follow-up (remove popup breakpoint override + media-scope guard test) validated via `npm run format`, `npm run lint`, and `npm run qa` (`test` 73 tests; `test:e2e` skipped; coverage statements `87.08%`, branches `86.71%`, funcs `85.18%`, lines `87.08%`).
- 2026-03-06: desktop event-driven clipboard listener follow-up validated via `npm run qa` (`test` 76 tests; `test:e2e` skipped; coverage statements `85.71%`, branches `86.61%`, funcs `84.54%`, lines `85.71%`) and `cargo test --manifest-path src-tauri/Cargo.toml` (25 tests).
- 2026-03-06: desktop smoke preflight rechecked on event-driven listener baseline via `npm run dev:desktop` (log: `/tmp/klip-dev-desktop-event-listener-20260306.log`, includes `VITE v7.3.1` and `Running target/debug/klip-tauri`).
- 2026-03-06: popup search baseline follow-up validated via `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test` (78 tests), and `npm run build`.
- 2026-03-06: popup search flatten follow-up (query-mode direct selectable results) validated via `npm run format`, `npm run lint`, `npm run test` (79 tests), and `npm run build`.
- 2026-03-06: snippet alias-trigger baseline follow-up validated via `npm run format`, `npm run lint`, `npm run typecheck`, `npm run test` (81 tests), and `npm run build`.
- 2026-03-06: desktop smoke preflight rechecked after alias baseline via `npm run dev:desktop` (log: `/tmp/klip-dev-desktop-alias-20260306.log`, includes `VITE v7.3.1` and `Running target/debug/klip-tauri`).
- 2026-03-06: global snippet alias hotkey trigger follow-up validated via `npm run qa` (`test` 85 tests; `test:e2e` skipped; coverage statements 85.24%, branches 86.94%, funcs 84.67%, lines 85.24%) and `cargo test --manifest-path src-tauri/Cargo.toml` (25 tests).

## Quick Resume Steps

1. Ensure local Node major is 22 (`node -v`; use your local version manager such as `nvm`/`asdf`/`volta` as available).
2. Read `docs/status/prd-tracker.md`.
3. Read `docs/status/manual-verification-us001-us006.md`.
4. Read `docs/status/packaging-verification-us011.md`.
5. Read latest entries in `docs/status/progress-log.md`.
6. Run `git log --oneline -n 10`.
7. Run `npm run qa`, then `npm run dev:desktop` to verify compact popup defaults, keyboard submenu navigation, event-driven clipboard capture, and `编辑片断...` / `偏好设置...` standalone-window transitions.
