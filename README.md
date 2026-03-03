# Klip

<div align="center">

![Klip Logo](https://via.placeholder.com/128?text=Klip)

**A modern, cross-platform clipboard manager**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/forrestzhu/klip/ci.yml?branch=main)](https://github.com/forrestzhu/klip/actions)

</div>

## Introduction

Klip is a powerful clipboard manager designed to boost your productivity. Keep track of your clipboard history, search through past items, and sync across devices.

Inspired by [Clipy](https://github.com/Clipy/Clipy), built with modern technologies for cross-platform support.

## Features

- **Cross-Platform** - Works seamlessly on macOS, Windows, and Linux
- **History Management** - Keep extensive clipboard history with configurable limits
- **Quick Search** - Instantly find and paste previous clipboard items
- **Cloud Sync** - (Planned) Sync clipboard history across devices
- **Snippets** - Save and organize frequently used text snippets
- **Privacy First** - Local-first architecture with optional cloud features
- **Keyboard Shortcuts** - Fully customizable hotkeys for power users

## Screenshots

> Coming soon...

## Installation

### Download

Pre-built binaries will be available soon for:
- [macOS (Intel & Apple Silicon)](https://github.com/forrestzhu/klip/releases)
- [Windows (x64)](https://github.com/forrestzhu/klip/releases)
- [Linux (AppImage)](https://github.com/forrestzhu/klip/releases)

### From Source

```bash
# Clone the repository
git clone https://github.com/forrestzhu/klip.git
cd klip

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Development Workflow

```bash
# Use the pinned Node.js major version
nvm use

# Install dependencies and git hooks
npm install

# Quality checks
npm run lint
npm run typecheck
npm run test
npm run build
```

- Commit messages follow Conventional Commits (validated by commitlint).
- Pre-commit runs `lint-staged` to format and check staged files with Biome.

## Usage

1. **Launch Klip** - The app runs in your system tray/menu bar
2. **Copy anything** - Klip automatically captures your clipboard
3. **Open history** - Use the default hotkey `Cmd+Shift+V` (macOS) or `Ctrl+Shift+V` (Windows/Linux)
4. **Select & paste** - Browse your history and select items to paste

## Development Status

> **This project is in early development.**

### Roadmap

- [ ] Core clipboard monitoring
- [ ] History storage and retrieval
- [ ] Quick search interface
- [ ] System tray integration
- [ ] Keyboard shortcuts
- [ ] Snippets management
- [ ] Cloud sync
- [ ] Plugins system

## Technology Stack

- **Frontend**: [React](https://react.dev/) / [Vue](https://vuejs.org/) (TBD)
- **Desktop Framework**: [Tauri](https://tauri.app/) / [Electron](https://www.electronjs.org/) (TBD)
- **Language**: TypeScript / Rust (TBD)
- **State Management**: (TBD)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Clipy](https://github.com/Clipy/Clipy) - Inspiration for many features
- All contributors who helped build this project

---

Made with ❤️ by [forrestzhu](https://github.com/forrestzhu)
