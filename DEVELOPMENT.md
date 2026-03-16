# Klip Development Guide

This guide helps you set up your development environment and contribute to Klip.

## Prerequisites

- **Node.js**: 19.x or higher
- **Rust**: stable toolchain (`rustup install stable`)
- **pnpm**: `npm install -g pnpm` (recommended for faster installs)

## Getting Started

```bash
# Clone and navigate to project
cd /Users/jayzero/Documents/workspace/klip

# Install frontend dependencies
pnpm install

# Install Rust toolchain (if not already installed)
rustup install stable

# Build the project
pnpm tauri build
```

## Development

```bash
# Start development server (with hot reload)
pnpm dev

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test:all
```

## Building

```bash
# Development build
pnpm tauri build

# Production build
pnpm tauri build --release

# The output DMG will be in:
# src-tauri/target/release/bundle/dmg/Klip_[version]_aarch64.dmg
```

## Project Structure

- `src/` - React + TypeScript frontend
- `src-tauri/` - Rust backend (Tauri)
- `tests/` - Vitest unit tests + Playwright E2E tests
- `docs/plans/` - Product Requirements & Design Docs
- `scripts/` - Automation scripts

## Code Standards

See `docs/plans/2026-03-03-code-standards-design.md` for detailed conventions.

Quick highlights:
- TypeScript strict mode
- Biome for linting/formatting
- Conventional commits
- All functions must have JSDoc

## Testing Strategy

### Unit Tests
- Located in `tests/unit/`
- Run with `pnpm test`
- Aim for high test coverage

### E2E Tests
- Located in `tests/e2e/`
- Run with `pnpm test:e2e`
- Tests key user flows using Playwright

### macOS UI Testing
- Uses Appium for UI automation
- Requires macOS permissions (Accessibility & Automation)
- See `docs/research/mac-ui-verification-research.md`

## Current Status

- **MVP**: ✅ Complete
- **Clipy Parity**: ✅ Complete
- **Enhancements**: 🔄 In Progress

See `README.md` for detailed roadmap.

## Troubleshooting

### macOS Permissions Issues

If you encounter permission errors for Appium tests:

1. Open **System Settings** → **Privacy & Security**
2. Go to **Accessibility** tab → Add Terminal.app
3. Go to **Automation** tab → Add Terminal.app
4. Restart your terminal

### Build Errors

If build fails with "dylib not found" errors:

```bash
# Clean Rust artifacts
rm -rf src-tauri/target

# Rebuild
pnpm tauri build
```

## Contributing

We welcome contributions! Please:

1. Check existing issues and PRs
2. Fork and create a feature branch
3. Make your changes following code standards
4. Add tests for new functionality
5. Submit PR with clear description

## License

See LICENSE file for details.
