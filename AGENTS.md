# Repository Guidelines

## Project Structure & Module Organization
- Root configuration files (`package.json`, `biome.json`, `.commitlintrc.json`, `rust-toolchain.toml`) define toolchain and quality gates.
- Planning and standards live in `docs/plans/`.
- Session-resume status artifacts live in `docs/status/`:
	- `current.md` (latest project snapshot, overwritten each iteration)
	- `progress-log.md` (append-only iteration log)
	- `prd-tracker.md` (US-level status matrix mapped to PRD)
- Automation scripts are in `scripts/` (`typecheck.mjs`, `test.mjs`, `test-e2e.mjs`, `test-coverage.mjs`, `build.mjs`, `cargo-check.mjs`).
- CI and PR policy live in `.github/` (`workflows/ci.yml`, `pull_request_template.md`).
- As implementation grows, keep app code in `src/` (frontend), `src-tauri/` (Rust backend), and tests in `tests/`.

## Status Snapshot Workflow (Required)
- Goal: make every completed iteration recoverable after context clear.
- At the end of each implementation task, update status artifacts in `docs/status/`.
- Minimum update checklist:
	- `current.md`: refresh latest commit, current phase, completed/in-progress/next work.
	- `progress-log.md`: append one entry with date, scope, commit, and validation result.
	- `prd-tracker.md`: update user-story status (`todo|in-progress|done`) and evidence.
- Validation before closing a task:
	- Run relevant quality gates for changed scope (`lint`, `typecheck`, `test`, `build`, `cargo:check` when Rust touched).
	- Record pass/fail/skip outcomes in the status docs.
- Session bootstrap rule (for new/cleared sessions):
	- Read `docs/status/current.md`, `docs/status/prd-tracker.md`, and latest entries in `docs/status/progress-log.md` before coding.

## Build, Test, and Development Commands
- `nvm use` - switch to the pinned Node major version from `.nvmrc`.
- `npm install` - install dependencies and set up Husky hooks.
- `npm run lint` - run Biome checks across the repository.
- `npm run format` - auto-fix formatting with Biome.
- `npm run typecheck` - run TypeScript type checks (skips if no `tsconfig.json`).
- `npm run test` - run Vitest (skips if no tests/config yet).
- `npm run test:e2e` - run Playwright e2e tests (skips if Playwright setup is absent).
- `npm run test:coverage` - run Vitest with coverage thresholds.
- `npm run build` - run frontend build checks (skips if `src/` is absent).
- `npm run cargo:check` - run Rust checks for `src-tauri` (skips if absent).
- `npm run qa` - run the full local quality gate pipeline.
- `cargo check --manifest-path src-tauri/Cargo.toml --locked` - required when Rust backend exists.

## Coding Style & Naming Conventions
- Formatting/linting: Biome (tabs for indentation, organize imports enabled).
- Use `kebab-case` for directories.
- Use `PascalCase.tsx` for React components, `useXxx.ts` for hooks, `camelCase.ts` for utilities, and `*.types.ts` for shared types.
- Prefer clear semantic names; avoid ambiguous names like `data1` or `tempValue`.

## Testing Guidelines
- Framework: Vitest.
- Test files: `*.test.ts` or `*.test.tsx`.
- Target at least 80% coverage for changed/new code.
- If coverage is not practical, document manual verification steps in the PR.

## Commit & Pull Request Guidelines
- Follow Conventional Commits: `feat|fix|docs|style|refactor|perf|test|chore|ci`.
- Commit header max length is 72, lowercase subject, no trailing period.
- Commit body max line length is 100 characters (hard limit enforced by commitlint).
- Every commit message must include structured body sections with non-empty content:
	- `### What changes were proposed in this CL?`
	- `### Why are the changes needed?`
	- `### How was this CL tested?`
- Commit message template:
```text
feat|fix|docs|style|refactor|perf|test|chore|ci: short summary

### What changes were proposed in this CL?
- Scope might be affected include: ...
- ...

### Why are the changes needed?
- ...

### How was this CL tested?
- `npm run lint`
- `npm run typecheck`
```
- Hooks enforce quality: `pre-commit` runs `lint-staged`; `commit-msg` runs `commitlint` plus `scripts/validate-commit-message.mjs` for the required body template.
- PRs must complete the template: scope, DoD checks, security/privacy checks, risks, and rollback plan.
- Use trunk-based branching: short-lived `feat/*|fix/*|chore/*` branches from `main`, prefer squash merge, avoid direct push to `main` except emergency `hotfix/*`.

## Security & Configuration Tips
- Treat clipboard content as sensitive data; do not log plaintext clipboard payloads.
- Never commit secrets, tokens, or personal data; use environment variables or secure key storage.
- Keep Node and Rust versions pinned to avoid local/CI drift.
