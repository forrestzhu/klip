# Preferences Build Commit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show the current short git commit in the preferences window so testers can identify the installed build quickly.

**Architecture:** Inject the short commit hash at Vite build time, normalize it through a small frontend helper, and render it as a low-visibility footer in the preferences window.

**Tech Stack:** Vite, React, TypeScript, Vitest.

---

### Task 1: Add failing build-info tests

**Files:**
- Create: `src/features/build/buildInfo.ts`
- Test: `tests/buildInfo.test.ts`

**Step 1: Write the failing test**

Add tests for:
- formatting a normal short commit
- preserving `-dirty`
- falling back to `unknown`

**Step 2: Run test to verify it fails**

Run: `npm run test -- buildInfo`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Implement a tiny build-info helper that normalizes the injected raw value and returns the display string.

**Step 4: Run test to verify it passes**

Run: `npm run test -- buildInfo`
Expected: PASS

### Task 2: Inject build commit at Vite build time

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/vite-env.d.ts`

**Step 1: Write the minimal config**

Read short commit + dirty state from git, with `unknown` fallback, and expose it through a Vite-defined global constant.

**Step 2: Verify the config compiles**

Run: `npm run typecheck`
Expected: PASS

### Task 3: Render commit in preferences

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Step 1: Add the UI**

Render the formatted commit string in the preferences window footer using the helper from Task 1.

**Step 2: Verify the app still builds**

Run: `npm run build`
Expected: PASS

### Task 4: Refresh status docs

**Files:**
- Modify: `docs/status/current.md`
- Modify: `docs/status/progress-log.md`
- Modify: `docs/status/prd-tracker.md`

**Step 1: Record evidence**

Capture test/typecheck/build outcomes and summarize the feature in the required status docs.
