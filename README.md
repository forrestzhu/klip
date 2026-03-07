# Klip

Klip is a cross-platform clipboard manager inspired by Clipy.

Current product direction is fixed by the PRD in `docs/plans`:
- Platforms: macOS + Windows
- Architecture: React + TypeScript frontend, Rust backend in `src-tauri/`
- Scope baseline: Clipy parity for `History + Snippets + Tray/Menu Bar + Global Hotkey + Search + Direct Paste`
- Current content type: text-only clipboard entries

## Project Status

The roadmap is split into three phases:
1. MVP
2. Clipy parity
3. Enhancements

Source of truth:
- `docs/plans/2026-03-03-klip-prd.md`
- `docs/plans/2026-03-03-code-standards-design.md`
- `AGENTS.md`

## Platform Scope

- Supported target platforms: macOS, Windows
- Out of scope for now: Linux

## Tech Stack

- Frontend: React 19 + TypeScript + Vite
- Backend: Rust (`src-tauri/`)
- Lint/format: Biome
- Test: Vitest
- CI: GitHub Actions matrix (`ubuntu`, `macos`, `windows`)

## Repository Layout

```text
src/                frontend code
src-tauri/          Rust backend scaffold
tests/              unit/integration tests
docs/plans/         PRD and engineering standards
scripts/            QA and automation scripts
```

## Quick Start

```bash
nvm use
npm install
npm run dev
npm run dev:desktop
```

- `npm run dev`: web preview only.
- `npm run dev:desktop`: start the full Tauri desktop runtime for local manual testing.

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run test:coverage
npm run cargo:check
```

Run all checks in one command:

```bash
npm run qa
```

`test:e2e` currently skips when no Playwright setup exists.

## Commit Message Format

Use Conventional Commits with a required body template:

```text
feat|fix|docs|style|refactor|perf|test|chore|ci: short summary

### What changes were proposed in this CL?
- ...

### Why are the changes needed?
- ...

### How was this CL tested?
- ...
```

`commit-msg` hook enforces both conventional header rules and these body sections.

## Desktop Smoke Test

1. Run `nvm use` to match `.nvmrc` (`Node 22`).
2. Run `npm run dev:desktop`.
3. Verify the basic flow:
	- Tray icon is visible and can reopen the window.
	- `Ctrl/Cmd+1`, `Ctrl/Cmd+2`, `Ctrl/Cmd+3` switch History/Snippets/Settings.
	- Settings panel can update max history, panel hotkey, and paste mode.
	- Selecting a history/snippet item triggers paste or clipboard fallback.

## Desktop Packaging Baseline (US-011)

```bash
npm run build:desktop:bundle:macos
npm run build:desktop:bundle:windows
```

- `build:desktop:bundle:macos` is for macOS runners/local macOS.
- `build:desktop:bundle:macos:signed` enables macOS code signing/notarization
  when the required Apple release secrets are present in CI.
- `build:desktop:bundle:windows` is for Windows runners/local Windows.
- Verification matrix and release-note constraints are tracked in `docs/status/packaging-verification-us011.md`.

## GitHub Release Automation

- Push a `v*` tag to run `.github/workflows/desktop-packaging.yml`, build the
  desktop bundles, upload Actions artifacts, and attach `.dmg` / `.exe` files
  to the matching GitHub Release.
- `workflow_dispatch` keeps the same packaging workflow available for artifact
  dry runs without publishing a GitHub Release.
- Release title/body come from the workflow plus `.github/release-notes-template.md`.

### Apple Release Secrets

| Secret | Required For | Notes |
| --- | --- | --- |
| `APPLE_CERTIFICATE` | macOS signing | Base64-encoded `.p12` Developer ID Application certificate. |
| `APPLE_CERTIFICATE_PASSWORD` | macOS signing | Password for the `.p12` certificate. |
| `APPLE_SIGNING_IDENTITY` | optional | Override signing identity; if omitted, Tauri infers it from the certificate. |
| `APPLE_API_KEY` | notarization | App Store Connect API key ID. |
| `APPLE_API_ISSUER` | notarization | App Store Connect issuer ID. |
| `APPLE_API_KEY_P8` | notarization | Raw contents of the `.p8` App Store Connect private key. |

- If only the certificate secrets are configured, tag builds produce signed
  macOS bundles without notarization.
- If the certificate and App Store Connect secrets are all configured, tag
  builds produce signed and notarized macOS bundles.
- If the Apple secrets are absent, the workflow falls back to unsigned macOS
  artifacts and the release notes call that out.

## License

MIT
