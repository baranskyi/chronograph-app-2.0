# Chronograph.pro

Professional countdown timer for conferences and presentations.

**Website:** https://chronograph.pro

## Features

- **Countdown Timer** — main countdown mode with visual alerts
- **Count-up Timer** — elapsed time tracking
- **Clock Mode** — display current time
- **Fullscreen Mode** — for speaker monitors
- **Color Indicators** — green (safe), yellow (warning), red (critical)
- **Sound Alerts** — Web Audio API beeps on timer end
- **Overtime Mode** — continue counting after zero with negative time
- **Keyboard Shortcuts** — Space, R, F, S, Esc
- **Time Presets** — 1, 3, 5, 10, 15, 20, 30, 45 minutes
- **PWA Support** — works offline, installable as app
- **Settings Persistence** — auto-save to localStorage

## Tech Stack

- Vue 3 + TypeScript
- Vite
- TailwindCSS v4
- Pinia (state management)
- VueUse
- vite-plugin-pwa

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| R | Reset timer |
| F | Toggle fullscreen |
| S | Open settings |
| Esc | Close settings / Exit fullscreen |

## License

MIT
