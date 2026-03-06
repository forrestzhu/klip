# Desktop Manual Verification Matrix (US-001/US-003/US-004/US-006)

- Last Updated: 2026-03-06
- Baseline Commit: `7aac9e1`
- Target Runtime: Tauri desktop (`npm run dev:desktop`)
- Status Legend: `pass` | `fail` | `pending` | `blocked`

## Environment Baseline

- Local OS: macOS 15.7.4 (Build 24G517, arm64)
- Local Node/NPM: Node `v25.2.1`, npm `10.9.3` (project target is Node 22)
- Desktop startup log evidence: `/tmp/klip-dev-desktop-event-listener-20260306.log`

## Automated Preflight Evidence

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-03-04 | `npm run dev:desktop` | pass | Log includes `Running target/debug/klip-tauri` and Vite local URL. |
| 2026-03-04 | `npm run qa` | pass | `lint/typecheck/test/build/test:coverage/cargo:check` all passed; e2e skipped (no Playwright setup). |
| 2026-03-04 | `cargo test --manifest-path src-tauri/Cargo.toml` | pass | 23 tests passed (0 failed). |
| 2026-03-06 | `npm run dev:desktop` | pass | Log `/tmp/klip-dev-desktop-event-listener-20260306.log` includes `VITE v7.3.1` and `Running target/debug/klip-tauri`. |
| 2026-03-06 | `npm run qa` | pass | `lint/typecheck/test/build/test:coverage/cargo:check` all passed; `test`=76, e2e skipped (no Playwright setup). |
| 2026-03-06 | `cargo test --manifest-path src-tauri/Cargo.toml` | pass | 25 tests passed (0 failed). |

## Manual Verification Matrix

| Story | Scenario | macOS | Windows | Notes |
| --- | --- | --- | --- | --- |
| US-001 | App startup reaches listener-ready state within 2 seconds after panel appears | pending | pending | Confirm via UI status line (`ready`) with stopwatch. |
| US-001 | Copy text in external app appears in History list | pending | pending | Test in at least one editor and one browser input. |
| US-001 | Event-driven capture latency stays below one poll cycle for single copy action | pending | pending | Copy once in external app and confirm history updates immediately (without noticeable polling delay). |
| US-001 | Event-driven listener still captures after panel hide/reopen | pending | pending | Hide panel with `Esc`, copy external text, reopen via hotkey/tray, confirm latest item is captured. |
| US-001 | Non-text clipboard content is ignored | pending | pending | Copy image/file and confirm no history entry added. |
| US-001 | App self-write does not create capture loop | pending | pending | Trigger paste/copy from Klip and verify no runaway duplicate growth. |
| US-003 | Tray/menu icon can reopen panel after window close | pending | pending | Close panel (`Esc` or window close), then reopen from tray/menu icon. |
| US-003 | Tray/menu "Quit" exits app cleanly | pending | pending | Process exits; no resident `klip-tauri` process remains. |
| US-004 | Global hotkey opens panel in foreground workflow | pending | pending | Default `CommandOrControl+Shift+V` (or configured value). |
| US-004 | Hotkey conflict shows actionable error message | pending | pending | Attempt known occupied shortcut and verify clear conflict feedback. |
| US-004 | `Esc` hides panel and returns focus to previous app | pending | pending | Verify focus returns to prior foreground app. |
| US-006 | Select history item performs direct paste into active app | pending | pending | Validate insertion in external app text field. |
| US-006 | On direct paste success, panel auto-hides | pending | pending | Should hide immediately after success. |
| US-006 | On direct paste failure, user sees message and clipboard fallback works | pending | pending | Switch to `clipboard-only` mode and verify fallback message + paste with `Cmd/Ctrl+V`. |

## Execution Notes

- This matrix is prepared and preflight-validated on local macOS.
- Interactive GUI steps still require hands-on execution on:
  - macOS local interactive session
  - Windows local interactive session
