# PRD Tracker

Source PRD: `docs/plans/2026-03-03-klip-prd.md`  
Last Updated: 2026-03-04

Status legend: `todo` | `in-progress` | `done`

| User Story | Title | Status | Evidence |
| --- | --- | --- | --- |
| US-001 | Clipboard text monitoring | in-progress | Frontend polling monitor + dedup in `src/features/history/clipboardMonitor.ts`; fixed timer binding for Tauri window runtime and added regression test in `tests/clipboardMonitor.test.ts`; added desktop-native clipboard read/write commands (`src-tauri/src/clipboard.rs`) and runtime port bridge (`src/features/history/browserClipboard.ts` + `src-tauri/src/lib.rs`); event-driven listener integration and cross-platform reliability verification are still pending. |
| US-002 | History persistence and capacity | in-progress | Implemented in history storage/repository and settings-center max-items control in `src/App.tsx`; cross-platform runtime config hardening still pending. |
| US-003 | Tray/Menu bar entry | done | Implemented Tauri runtime tray/menu bar flow in `src-tauri/src/tray.rs` + `src-tauri/src/lib.rs` (icon click open panel, menu open panel, quit action, close-to-hide behavior). |
| US-004 | Global hotkey panel toggle | in-progress | Implemented in commit `30a6501`: Tauri global shortcut registration/rebind/conflict feedback in `src-tauri/src/hotkey.rs`; settings-center hotkey apply flow now in `src/App.tsx` + `src/features/settings`; desktop manual conflict verification evidence still pending. |
| US-005 | History search and keyboard navigation | in-progress | Search filter + arrow navigation + Enter action in `src/App.tsx`; performance e2e benchmark pending. |
| US-006 | Direct paste on selection | in-progress | Added in commit `30a6501`: Tauri direct paste command with platform paste attempt + clipboard fallback (`src-tauri/src/direct_paste.rs`) and wired selection flow in `src/App.tsx`; added paste-mode toggle (`direct-with-fallback`/`clipboard-only`) for reliability testing in `src/features/settings/pasteModeStorage.ts`; cross-platform manual reliability verification is still pending. |
| US-007 | Snippets and folders CRUD | in-progress | Snippet/folder repository + persistence + UI CRUD implemented in `src/features/snippets` and `src/App.tsx`; conflict/UX hardening pending. |
| US-008 | Snippets quick paste | in-progress | Snippet selection reuses direct paste runtime with clipboard fallback (`src/features/paste`, `src/App.tsx`); global trigger/alias and cross-platform verification are still pending. |
| US-009 | Dual-mode History/Snippets entry | in-progress | Mode switch UI + keyboard shortcuts + mode persistence in `src/App.tsx`; now expanded to tri-mode (`history/snippets/settings`) for unified panel navigation. |
| US-010 | Settings center | in-progress | Dedicated settings center baseline added as panel mode with shortcut/capacity/paste controls (`src/App.tsx`, `src/styles.css`, `src/features/settings`); startup-launch toggle/runtime bridge is still missing. |
| US-011 | Cross-platform packaging verification | todo | No installer artifact verification workflow documented/executed. |
| US-012 | Regression baseline and automation | in-progress | Unit tests and coverage gates exist; added regression test for Tauri timer binding failure in `tests/clipboardMonitor.test.ts`; desktop smoke command path now documented via `npm run dev:desktop`; required e2e flows and platform matrix completion pending. |

## Immediate Next Stories

1. US-001 desktop manual verification for clipboard capture reliability (macOS/Windows) and polling limitations.
2. US-006 desktop manual verification for direct paste reliability and fallback behavior on macOS/Windows.
3. US-010 startup-launch toggle and runtime bridge completion.
