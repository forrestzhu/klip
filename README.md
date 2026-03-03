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
```

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

## License

MIT
