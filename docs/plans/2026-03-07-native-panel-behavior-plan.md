# Native Panel Behavior Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the main Klip panel behave like a native quick panel: stay in the active Space/fullscreen context, open near the cursor, and restore the previous target before pasting.

**Architecture:** Add a dedicated `panel_presenter` backend module that owns panel context capture, cross-platform cursor-based positioning, native window configuration, and pre-paste focus restoration. `tray.rs` and `direct_paste.rs` become thin callers into this presenter so the show/paste lifecycle shares one source of truth.

**Tech Stack:** Rust, Tauri 2, macOS native window APIs (`objc2-app-kit`), Windows foreground-window APIs, Vitest (existing frontend), Rust unit tests.

---

### Task 1: Add failing panel-position tests

**Files:**
- Create: `src-tauri/src/panel_presenter.rs`
- Modify: `src-tauri/src/lib.rs`
- Test: `src-tauri/src/panel_presenter.rs`

**Step 1: Write the failing test**

Add pure Rust tests for:
- default bottom-right placement near the cursor
- right-edge flip to the left
- bottom-edge flip upward
- oversize window clamp into monitor work area

**Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml panel_origin`
Expected: FAIL because `panel_origin` helper is not implemented or returns wrong coordinates.

**Step 3: Write minimal implementation**

Implement pure helper structs and a `panel_origin` function in `src-tauri/src/panel_presenter.rs` using monitor work-area bounds and cursor-relative flipping/clamping.

**Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml panel_origin`
Expected: PASS

### Task 2: Route panel showing through presenter

**Files:**
- Modify: `src-tauri/src/tray.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/panel_presenter.rs`

**Step 1: Write the failing test**

Add unit coverage for presenter fallback helpers where no previous target is stored and direct-paste preparation must report fallback instead of pretending success.

**Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml presenter_requires_previous_target`
Expected: FAIL because presenter pre-paste state handling is incomplete.

**Step 3: Write minimal implementation**

Add `PanelPresenterState`, target capture, and `present_main_panel` / `prepare_paste` helpers. Update `tray.rs` to call presenter instead of directly doing `show + focus`.

**Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml presenter_requires_previous_target`
Expected: PASS

### Task 3: Apply native macOS panel behavior and cross-platform target restoration

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/panel_presenter.rs`
- Create: `src-tauri/src/panel_presenter/macos.rs`
- Create: `src-tauri/src/panel_presenter/windows.rs`
- Modify: `src-tauri/src/direct_paste.rs`

**Step 1: Write the failing test**

Add Rust tests for the direct-paste decision path so restore failure returns `Fallback`.

**Step 2: Run test to verify it fails**

Run: `cargo test --manifest-path src-tauri/Cargo.toml direct_paste`
Expected: FAIL because restore failure is currently ignored.

**Step 3: Write minimal implementation**

On macOS, configure the Tauri main window with native panel-like collection behavior and window level, capture/restore the previous app, and verify restoration before sending paste. On Windows, add the matching presenter hooks to capture and restore the foreground window handle before paste.

**Step 4: Run test to verify it passes**

Run: `cargo test --manifest-path src-tauri/Cargo.toml direct_paste`
Expected: PASS

### Task 4: Verify, document, and refresh status artifacts

**Files:**
- Modify: `docs/status/current.md`
- Modify: `docs/status/progress-log.md`
- Modify: `docs/status/prd-tracker.md`

**Step 1: Run focused validation**

Run:
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `npm run cargo:check`

**Step 2: Run repository quality gates**

Run:
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

**Step 3: Refresh status docs**

Record the implementation summary, evidence, and pass/fail outcomes in the required status artifacts.
