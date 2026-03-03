# PRD Tracker

Source PRD: `docs/plans/2026-03-03-klip-prd.md`  
Last Updated: 2026-03-04

Status legend: `todo` | `in-progress` | `done`

| User Story | Title | Status | Evidence |
| --- | --- | --- | --- |
| US-001 | Clipboard text monitoring | in-progress | Frontend polling monitor + dedup in `src/features/history/clipboardMonitor.ts`; not system-level Tauri integration yet. |
| US-002 | History persistence and capacity | in-progress | Implemented in history storage/repository and App max-items control; cross-platform runtime config/settings center not done. |
| US-003 | Tray/Menu bar entry | todo | No tray/menu bar runtime code yet. |
| US-004 | Global hotkey panel toggle | todo | No global hotkey registration yet. |
| US-005 | History search and keyboard navigation | in-progress | Search filter + arrow navigation + Enter action in `src/App.tsx`; performance e2e benchmark pending. |
| US-006 | Direct paste on selection | in-progress | Current behavior writes selected text to clipboard; native direct paste injection and panel auto-close not implemented. |
| US-007 | Snippets and folders CRUD | in-progress | Snippet/folder repository + persistence + UI CRUD implemented in `src/features/snippets` and `src/App.tsx`; conflict/UX hardening pending. |
| US-008 | Snippets quick paste | in-progress | Snippet search/select and clipboard write action implemented; global trigger/alias and native paste pending. |
| US-009 | Dual-mode History/Snippets entry | in-progress | Mode switch UI + keyboard shortcuts + mode persistence via localStorage in `src/App.tsx`. |
| US-010 | Settings center | todo | Only partial controls in main panel; no dedicated settings center for all required options. |
| US-011 | Cross-platform packaging verification | todo | No installer artifact verification workflow documented/executed. |
| US-012 | Regression baseline and automation | in-progress | Unit tests and coverage gates exist; required e2e flows and platform matrix completion pending. |

## Immediate Next Stories

1. US-003 tray/menu bar entry.
2. US-004 global hotkey registration and conflict handling.
3. US-006 direct paste backend abstraction and fallback UX finalization.
