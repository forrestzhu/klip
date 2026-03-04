# Packaging Verification Baseline (US-011)

- Last Updated: 2026-03-04
- Baseline Commit: `95f7c29`
- Status Legend: `pass` | `fail` | `pending` | `blocked`

## Environment Baseline

- Local OS: macOS 15.7.4 (Build 24G517, arm64)
- Local Node/NPM: Node `v25.2.1`, npm `10.9.3` (project target is Node 22)
- Target Runtime: Tauri desktop bundle (`npm run build:desktop:bundle:*`)

## Packaging Command Matrix

| Platform | Command | Expected Output |
| --- | --- | --- |
| macOS | `npm run build:desktop:bundle:macos` | `app` + `dmg` bundles under `src-tauri/target/release/bundle/` |
| Windows | `npm run build:desktop:bundle:windows` | `nsis` installer under `src-tauri/target/release/bundle/nsis/` |
| CI Matrix | `.github/workflows/desktop-packaging.yml` | Artifact upload per OS (`klip-bundles-macos-latest`, `klip-bundles-windows-latest`) |

## Artifact Checklist

| Platform | Artifact Type | Path Pattern | Status | Evidence |
| --- | --- | --- | --- | --- |
| macOS | `.app` | `src-tauri/target/release/bundle/macos/*.app` | pass | Local run produced `Klip.app` (size `8.8M`) via `npm run build:desktop:bundle:macos`. |
| macOS | `.dmg` | `src-tauri/target/release/bundle/dmg/*.dmg` | pass | Local run produced `Klip_0.1.0_aarch64.dmg` (size `2.9M`). |
| Windows | `.exe` (NSIS) | `src-tauri/target/release/bundle/nsis/*.exe` | pending | Pending CI Windows bundle run. |

## Automated Preflight Evidence

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-03-04 | `npm run tauri:info` | pass | Log at `/tmp/klip-tauri-info-us011-20260304.log`; environment warning: Xcode app missing, command completed. |
| 2026-03-04 | `npm run build:desktop:bundle:macos` | pass | Log at `/tmp/klip-build-bundle-macos-us011-20260304.log`; output includes `Klip.app` + `Klip_0.1.0_aarch64.dmg`. |

## Install/Run/Uninstall Matrix

| Platform | Scenario | Status | Notes |
| --- | --- | --- | --- |
| macOS | Install from generated artifact and launch once | pending | Verify first launch enters listener-ready state and tray/menu appears. |
| macOS | Uninstall does not leave running `klip-tauri` process | pending | Verify Activity Monitor/process list clean after uninstall. |
| Windows | Install from generated artifact and launch once | pending | Verify startup listener + tray visible. |
| Windows | Uninstall does not leave running background process | pending | Verify Task Manager process cleanup. |

## Release Notes Draft (Known Permissions and Limits)

- macOS may require Accessibility/Input Monitoring permission for consistent direct paste and global hotkey behavior.
- Windows direct paste reliability depends on active window focus and OS input simulation acceptance.
- Clipboard scope in this phase is text-only; image/file/rich-text content is intentionally ignored.
- `Launch at login` behavior writes OS startup registration; enterprise login-item policies may block it.
- E2E desktop workflow automation is not complete; interactive matrix execution remains required per release.

## Open Blockers

- This machine can generate unsigned macOS bundles, but code-signing/notarization prerequisites (Xcode app + certificates) are still missing.
- Windows installer verification requires CI Windows runs and/or a Windows interactive test environment.
