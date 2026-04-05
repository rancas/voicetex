# VoiceTeX

Dictate mathematical formulas with your voice and get LaTeX in real time. Edit with voice commands or manually, undo/redo every change, and manage multiple sessions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Voice-to-LaTeX** - Speak a math expression, get LaTeX instantly via OpenAI GPT models
- **Dual transcription** - Local Whisper (offline, free) or OpenAI API (faster, multilingual)
- **Voice editing** - Say corrections to modify existing formulas
- **Manual editing** - Click to edit LaTeX code directly with live preview
- **Undo/Redo** - Full history of every change (Ctrl+Z / Ctrl+Shift+Z)
- **Sessions** - Persistent sessions saved in SQLite, resume where you left off
- **Multi-language** - Dictate in 20+ languages
- **Model selection** - Choose any OpenAI model (GPT-5.4, GPT-4.1, o3, etc.)
- **Cost tracking** - Live session cost counter for API usage
- **Dark mode** - Automatic or manual theme switching

## Downloads

Pre-built binaries are available on the [Releases page](https://github.com/rancas/voicetex/releases).

### Windows
| Package | Size | Description |
|---------|------|-------------|
| `VoiceTeX-Setup.exe` | ~5 MB | Installer (Rust backend) - lightweight, opens in browser |
| `VoiceTeX.Setup.x.x.x.exe` | ~200 MB | Installer (Electron) - standalone desktop app |

### Linux
| Package | Size | Description |
|---------|------|-------------|
| `voicetex-backend` | ~5 MB | Standalone binary (Rust) - run and open browser |
| `VoiceTeX-x.x.x.AppImage` | ~200 MB | Desktop app (Electron) |
| `voicetex_x.x.x_amd64.deb` | ~150 MB | Debian/Ubuntu package (Electron) |

## Quick Start

### Option 1: Rust backend (lightweight)

Download the binary for your platform from [Releases](https://github.com/rancas/voicetex/releases), then:

```bash
# Linux
chmod +x voicetex-backend
NODE_ENV=production ./voicetex-backend
# Opens at http://localhost:3001

# Windows: run VoiceTeX-Setup.exe installer, then launch from Start Menu
```

### Option 2: Development (from source)

```bash
# With Node.js backend (Express)
npm install
npm run dev

# With Rust backend
npm install
npm run dev:rust
```

Open http://localhost:5173, create a new session, enter your OpenAI API key in Settings, and start dictating.

## Architecture

The app has two interchangeable backends. The frontend doesn't know which one is running.

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend (Node.js) | Express.js 5, better-sqlite3 |
| Backend (Rust) | Axum, rusqlite |
| Desktop wrapper | Electron (optional) |
| Transcription (local) | Whisper via @xenova/transformers (WebGPU) |
| Transcription (cloud) | OpenAI gpt-4o-mini-transcribe |
| LaTeX generation | OpenAI chat completions (streaming) |
| LaTeX rendering | MathJax 3 |
| Database | SQLite (shared schema between backends) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Frontend + Express backend |
| `npm run dev:rust` | Frontend + Rust backend |
| `npm run dev:frontend` | Vite dev server only |
| `npm run dev:backend` | Express backend only |
| `npm run dev:backend:rust` | Rust backend only |
| `npm run build` | Build frontend for production |
| `npm start` | Start Express production server |
| `npm run electron:build:linux` | Build Electron desktop app (Linux) |
| `npm run electron:build` | Build Electron desktop app (Windows) |
| `cargo build --release -p voicetex-backend` | Build Rust backend binary |

## Credits

This project is a fork of [Speech to LaTeX](https://github.com/Thomas-McKanna/speech-to-latex) by [Thomas McKanna](https://github.com/Thomas-McKanna), originally a client-side app using WebLLM for local LLM inference.

### Changes from the original

- Replaced WebLLM (local browser LLM) with OpenAI API for LaTeX generation
- Added OpenAI audio transcription as alternative to local Whisper
- Added multi-language support (20+ languages)
- Added LLM model selector with full OpenAI model catalog
- Added voice editing mode for correcting formulas
- Added manual LaTeX editing with live preview
- Added Express.js backend with SQLite for persistence
- Added Rust backend (Axum + rusqlite) as lightweight alternative
- Added session management with sidebar and date filtering
- Added undo/redo with full change history
- Added API cost tracking
- Added Electron desktop packaging (Windows + Linux)
- Added Windows installer via Inno Setup (for Rust backend)
- Added GitHub Actions CI/CD for multi-platform builds

## License

MIT License - see [LICENSE](LICENSE) for details.

Original work copyright (c) 2025 Thomas McKanna.
VoiceTeX modifications copyright (c) 2026 Luca Secchi.
