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

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (frontend + backend)
npm run dev
```

Open http://localhost:5173, create a new session, enter your OpenAI API key in Settings, and start dictating.

## Architecture

| Component | Technology |
|-----------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS, Vite |
| Backend | Express.js, better-sqlite3 |
| Transcription (local) | Whisper via @xenova/transformers (WebGPU) |
| Transcription (cloud) | OpenAI gpt-4o-mini-transcribe |
| LaTeX generation | OpenAI chat completions (streaming) |
| LaTeX rendering | MathJax 3 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend (Vite) + backend (Express) concurrently |
| `npm run dev:frontend` | Start Vite dev server only |
| `npm run dev:backend` | Start Express backend only |
| `npm run build` | Build frontend for production |
| `npm start` | Start production server |

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
- Added session management with sidebar
- Added undo/redo with full change history
- Added API cost tracking
- Added date filtering for sessions

## License

MIT License - see [LICENSE](LICENSE) for details.

Original work copyright (c) 2025 Thomas McKanna.
VoiceTeX modifications copyright (c) 2026 Luca Secchi.
