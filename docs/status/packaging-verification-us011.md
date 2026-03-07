# Packaging Verification Baseline (US-011)

- Last Updated: 2026-03-07
- Baseline Commit: `2799b1d`
- Status Legend: `pass` | `fail` | `pending` | `blocked`

## Environment Baseline

- Local OS: macOS 15.7.4 (Build 24G517, arm64)
- Local Node/NPM: Node `v25.2.1`, npm `10.9.3` (project target is Node 22)
- Target Runtime: Tauri desktop bundle (`npm run build:desktop:bundle:*`)

## Packaging Command Matrix

| Platform | Command | Expected Output |
| --- | --- | --- |
| macOS | `npm run build:desktop:bundle:macos` | `app` + `dmg` bundles under `src-tauri/target/release/bundle/` |
| macOS | `npm run build:desktop:bundle:macos:signed` | Signed `app` + `dmg`, with notarization when Apple API secrets are present |
| Windows | `npm run build:desktop:bundle:windows` | `nsis` installer under `src-tauri/target/release/bundle/nsis/` |
| CI Matrix | `.github/workflows/desktop-packaging.yml` | Artifact upload per OS (`klip-bundles-macos-latest`, `klip-bundles-windows-latest`) |
| GitHub Release | Push `v*` tag | Attach `.dmg` + `.exe` to the matching GitHub Release using `.github/release-notes-template.md` |

## Artifact Checklist

| Platform | Artifact Type | Path Pattern | Status | Evidence |
| --- | --- | --- | --- | --- |
| macOS | `.app` | `src-tauri/target/release/bundle/macos/*.app` | pass | Latest local run on 2026-03-07 produced `Klip.app` from the current dirty working tree atop commit `2799b1d` after the tray-icon/direct-paste follow-up, including the dedicated macOS tray icon asset and direct-paste Accessibility preflight behavior. |
| macOS | `.dmg` | `src-tauri/target/release/bundle/dmg/*.dmg` | pass | Latest local run on 2026-03-07 produced `Klip_0.1.0_aarch64.dmg` (size `3.0M`, sha256 `f428dcf39b2cc9d4f05e37025cbc515b3d4e9b109c89f8085a54b6984b59f10c`) via a fresh `npm run build:desktop:bundle:macos` after the tray-icon/direct-paste follow-up. |
| Windows | `.exe` (NSIS) | `src-tauri/target/release/bundle/nsis/*.exe` | pending | Pending CI Windows bundle run. |

## Automated Preflight Evidence

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-03-04 | `npm run tauri:info` | pass | Log at `/tmp/klip-tauri-info-us011-20260304.log`; environment warning: Xcode app missing, command completed. |
| 2026-03-04 | `npm run build:desktop:bundle:macos` | pass | Log at `/tmp/klip-build-bundle-macos-us011-20260304.log`; output includes `Klip.app` + `Klip_0.1.0_aarch64.dmg`. |
| 2026-03-07 | Workflow YAML parse | pass | `.github/workflows/desktop-packaging.yml` parses after adding release metadata plus optional macOS signing/notarization path. |
| 2026-03-07 | `npm run build:desktop:bundle:macos` | pass | Log at `/tmp/klip-build-bundle-macos-20260307.log`; rebuilt `Klip.app` + fresh `Klip_0.1.0_aarch64.dmg` from commit `b9c06de` using local Node `v25.2.1` because Node 22 runtime switching was unavailable on this machine. |
| 2026-03-07 | `npm run build:desktop:bundle:macos` (panel workspace fix) | pass | Log at `/tmp/klip-build-bundle-macos-space-fix-20260307.log`; rebuilt `Klip.app` + `Klip_0.1.0_aarch64.dmg` after the macOS panel workspace/Space-switch fix so DMG verification can validate current-space hotkey behavior. |
| 2026-03-07 | `npm run build:desktop:bundle:macos` (direct paste focus fix) | pass | Log at `/tmp/klip-build-bundle-macos-paste-fix-20260307.log`; rebuilt `Klip.app` + `Klip_0.1.0_aarch64.dmg` after restoring the original foreground app before synthetic `Cmd+V`, so DMG verification can validate paste behavior. |
| 2026-03-07 | `npm run build:desktop:bundle:macos` (native panel rebuild) | fail | Log at `/tmp/klip-build-bundle-macos-native-panel-20260307.log`; app bundling succeeded, but the DMG step failed because a stale temporary `rw.*.Klip_0.1.0_aarch64.dmg` remained mounted from an earlier failed attempt. |
| 2026-03-07 | manual `bundle_dmg.sh --volname "Klip" ...` after stale-mount cleanup | pass | Logs at `/tmp/klip-manual-dmg-debug-20260307.log` and `/tmp/klip-manual-dmg-success-20260307.log`; detached stale `/dev/disk8`, removed `src-tauri/target/release/bundle/macos/rw.40197.Klip_0.1.0_aarch64.dmg`, and created fresh `Klip_0.1.0_aarch64.dmg` successfully. |
| 2026-03-07 | `hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` | pass | Image checksum verified successfully after the manual DMG rebuild. |
| 2026-03-07 | `npm run build:desktop:bundle:macos` (preferences build-commit rebuild) | pass | Log at `/tmp/klip-build-bundle-macos-rebuild-20260307-183433.log`; rebuilt `Klip.app` + `Klip_0.1.0_aarch64.dmg` after clearing stale temporary mounts. |
| 2026-03-07 | `hdiutil verify src-tauri/target/release/bundle/dmg/Klip_0.1.0_aarch64.dmg` (fresh rebuild) | pass | Log at `/tmp/klip-dmg-verify-20260307-183433.log`; checksum is valid for the freshly rebuilt DMG. |
| 2026-03-07 | full rebuild + verification after macOS startup regression fix | pass | Logs under `/tmp/klip-verify-20260307-190439/`; reran `cargo test`, `npm run cargo:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run build:desktop:bundle:macos`, `hdiutil verify`, and `git diff --check`; rebuilt `Klip.app` + `Klip_0.1.0_aarch64.dmg`, verified sha256 `13995e6ede608fdbe86811991e7b7a92675faaa528668d80503cf9fd5cf28e44`, and confirmed the rebuilt release app stays resident after launch (`release-launch.status`). |
| 2026-03-07 | DMG install to `/Applications` and first launch after startup regression fix | pass | Logs under `/tmp/klip-install-verify-20260307-190701/`; mounted the rebuilt DMG, reinstalled `/Applications/Klip.app`, detached the image, launched the installed app, and confirmed it stayed resident (`installed-launch.status`). |
| 2026-03-07 | full rebuild + verification after macOS panel-show regression fix | pass | Logs under `/tmp/klip-fix-verify-20260307-193152/`; reran `cargo test`, `npm run cargo:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run build:desktop:bundle:macos`, `hdiutil verify`, and `git diff --check`; rebuilt `Klip.app` + `Klip_0.1.0_aarch64.dmg`, verified sha256 `d16ad2ccab87fbe6e3c21f78a721835d3a2d2a05658649b64ff3dfa922651c3d`, and captured the corrected install target after removing the invalid `MoveToActiveSpace` mutation and enabling template tray rendering. |
| 2026-03-07 | DMG install to `/Applications` and first launch after macOS panel-show regression fix | pass | Logs under `/tmp/klip-install-verify-fix-20260307-193309/`; mounted the rebuilt DMG, reinstalled `/Applications/Klip.app`, detached the image, launched the installed app, and confirmed it stayed resident (`installed-launch.status`). |
| 2026-03-07 | full rebuild + verification after macOS tray-icon/direct-paste follow-up | pass | Logs under `/tmp/klip-followup-verify-20260307-195815/`; reran `cargo test`, `npm run cargo:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run build:desktop:bundle:macos`, `hdiutil verify`, and `git diff --check`; rebuilt `Klip.app` + `Klip_0.1.0_aarch64.dmg`, verified sha256 `f428dcf39b2cc9d4f05e37025cbc515b3d4e9b109c89f8085a54b6984b59f10c`, and captured the latest install target after adding a dedicated macOS tray asset plus direct-paste Accessibility preflight/fallback UX updates. |
| 2026-03-07 | DMG install to `/Applications` and first launch after macOS tray-icon/direct-paste follow-up | pass | Logs under `/tmp/klip-install-verify-followup-20260307-195938/`; mounted the rebuilt DMG, reinstalled `/Applications/Klip.app`, detached the image, launched the installed app, and confirmed it stayed resident (`installed-launch.status`). |

## GitHub Release Baseline

- Release name format: `Klip <tag>`
- Release body template: `.github/release-notes-template.md`
- `workflow_dispatch`: build + upload Actions artifacts only
- `push.tags=v*`: build + upload Actions artifacts + attach release assets
- Apple secret provisioning runbook:
  `docs/release/apple-release-secrets-setup.md`

## Apple Signing / Notarization Secrets

| Secret | Purpose | Status |
| --- | --- | --- |
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` signing certificate | pending |
| `APPLE_CERTIFICATE_PASSWORD` | Signing certificate password | pending |
| `APPLE_SIGNING_IDENTITY` | Optional explicit identity override | pending |
| `APPLE_API_KEY` | App Store Connect key ID for notarization | pending |
| `APPLE_API_ISSUER` | App Store Connect issuer ID for notarization | pending |
| `APPLE_API_KEY_P8` | App Store Connect `.p8` private key contents | pending |

- Tag builds without Apple secrets fall back to unsigned macOS artifacts.
- Tag builds with only the certificate secrets produce signed macOS artifacts.
- Tag builds with all certificate + App Store Connect secrets produce signed
  and notarized macOS artifacts.
- Full secret registration / verification checklist:
  `docs/release/apple-release-secrets-setup.md`

## Install/Run/Uninstall Matrix

| Platform | Scenario | Status | Notes |
| --- | --- | --- | --- |
| macOS | Install from generated artifact and launch once | pass | Re-verified on 2026-03-07 after the tray-icon/direct-paste follow-up by mounting `Klip_0.1.0_aarch64.dmg`, reinstalling `/Applications/Klip.app`, detaching the image, and confirming the installed app stayed resident after launch (`/tmp/klip-install-verify-followup-20260307-195938/installed-launch.status`). |
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

- This machine can generate unsigned macOS bundles, but release signing/notarization secrets are still unset and local Xcode prerequisites remain incomplete.
- Windows installer verification requires CI Windows runs and/or a Windows interactive test environment.
