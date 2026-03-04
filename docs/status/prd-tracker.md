# PRD Tracker

Source PRD: `docs/plans/2026-03-03-klip-prd.md`  
Last Updated: 2026-03-04

Status legend: `todo` | `in-progress` | `done`

| User Story | Title | Status | Evidence |
| --- | --- | --- | --- |
| US-001 | Clipboard text monitoring | in-progress | Frontend polling monitor + dedup in `src/features/history/clipboardMonitor.ts`; fixed timer binding for Tauri window runtime and added regression test in `tests/clipboardMonitor.test.ts`; added desktop-native clipboard read/write commands (`src-tauri/src/clipboard.rs`) and runtime port bridge (`src/features/history/browserClipboard.ts` + `src-tauri/src/lib.rs`); manual verification matrix and local preflight evidence added in `docs/status/manual-verification-us001-us006.md`; event-driven listener integration and interactive macOS/Windows verification are still pending. |
| US-002 | History persistence and capacity | in-progress | Implemented in history storage/repository and settings-center max-items control in `src/App.tsx`; cross-platform runtime config hardening still pending. |
| US-003 | Tray/Menu bar entry | done | Implemented Tauri runtime tray/menu bar flow in `src-tauri/src/tray.rs` + `src-tauri/src/lib.rs` (icon click open panel, menu open panel, quit action, close-to-hide behavior). |
| US-004 | Global hotkey panel toggle | in-progress | Implemented in commit `30a6501`: Tauri global shortcut registration/rebind/conflict feedback in `src-tauri/src/hotkey.rs`; settings-center hotkey apply flow now in `src/App.tsx` + `src/features/settings`; default hotkey updated to `CommandOrControl+Shift+V`, and display/persistence/input/runtime-return paths now normalize runtime values into readable/canonical forms (`Cmd/Ctrl+Shift+V` and `CommandOrControl+Shift+V`) with legacy default migration from `...+K`; parser is now token-based (not `+`-separator dependent) to handle runtime variants like `shift super KeyV`; manual verification scenarios (open/focus/conflict/esc) are defined in `docs/status/manual-verification-us001-us006.md`; interactive macOS/Windows evidence is still pending. |
| US-005 | History search and keyboard navigation | in-progress | Search filter + arrow navigation + Enter action in `src/App.tsx`; performance e2e benchmark pending. |
| US-006 | Direct paste on selection | in-progress | Added in commit `30a6501`: Tauri direct paste command with platform paste attempt + clipboard fallback (`src-tauri/src/direct_paste.rs`) and wired selection flow in `src/App.tsx`; added paste-mode toggle (`direct-with-fallback`/`clipboard-only`) for reliability testing in `src/features/settings/pasteModeStorage.ts`; manual verification scenarios (success auto-hide + failure fallback) are defined in `docs/status/manual-verification-us001-us006.md`; cross-platform interactive reliability verification is still pending. |
| US-007 | Snippets and folders CRUD | in-progress | Snippet/folder repository + persistence + UI CRUD implemented in `src/features/snippets` and `src/App.tsx`; conflict/UX hardening pending. |
| US-008 | Snippets quick paste | in-progress | Snippet selection reuses direct paste runtime with clipboard fallback (`src/features/paste`, `src/App.tsx`); global trigger/alias and cross-platform verification are still pending. |
| US-009 | Dual-mode History/Snippets entry | in-progress | Mode switch UI + keyboard shortcuts + mode persistence in `src/App.tsx`; now expanded to tri-mode (`history/snippets/settings`) for unified panel navigation. |
| US-010 | Settings center | in-progress | Dedicated settings center baseline added as panel mode with shortcut/capacity/paste controls (`src/App.tsx`, `src/styles.css`, `src/features/settings`); startup-launch toggle now implemented with local persistence normalization and desktop runtime bridge (`src/features/settings/startupLaunchStorage.ts`, `src/features/settings/startupLaunchRuntime.ts`, `src-tauri/src/startup_launch.rs`, `src-tauri/src/lib.rs`); cross-platform interactive verification evidence is still pending. |
| US-011 | Cross-platform packaging verification | todo | No installer artifact verification workflow documented/executed. |
| US-012 | Regression baseline and automation | in-progress | Unit tests and coverage gates exist; added regression test for Tauri timer binding failure in `tests/clipboardMonitor.test.ts`; desktop smoke command path now documented via `npm run dev:desktop`; revalidated on 2026-03-04 with `npm run qa` pass (`60` tests, coverage statements `87.37%`) plus `cargo test` (23 passed), and desktop startup log evidence in `/tmp/klip-dev-desktop-20260304.log` and `/tmp/klip-dev-desktop-hotkey-20260304.log`; panel hotkey canonical-input/runtime-return fixes are covered by hotkey storage/display tests; required e2e flows and interactive platform matrix completion pending. |

## Immediate Next Stories

1. Execute `docs/status/manual-verification-us001-us006.md` on macOS and fill result columns for US-001/US-003/US-004/US-006.
2. Execute the same matrix on Windows and capture behavior deltas and permission notes.
3. Start US-011 packaging verification baseline and installer/runbook evidence.
