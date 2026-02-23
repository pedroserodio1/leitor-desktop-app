# Leitor

> **Early development** — This project is in active development and still in its early stages. Features may change, bugs are expected, and the API/UX is not stable yet. Feedback and contributions are welcome!

---

Open source desktop reader for EPUB, PDF, and image folders (manga/comics), with a focus on **offline-first** and full user control over their files.

Built with [Tauri](https://tauri.app/) (Rust) + [React](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/), the app runs **100% offline**, saves progress locally, and supports multiple reading modes (single page, dual page, continuous scroll, LTR/RTL), configurable per book.

## Support

If this project helps you, consider supporting its development:

<script type='text/javascript' src='https://storage.ko-fi.com/cdn/widget/Widget_2.js'></script><script type='text/javascript'>kofiwidget2.init('Support Me', '#72a4f2', 'K3K41UTLAL');kofiwidget2.draw();</script>

## Philosophy

- **No monetization** — donations only
- **Lightweight** — small binary, minimal resource usage
- **Private** — your files stay on your computer
- **Extensible** — architecture ready for future enhancements

## Features

- **Supported formats** — EPUB, PDF, JPG, PNG, WebP
- **Reading modes** — single page, dual page, continuous scroll
- **Direction** — LTR and RTL configurable per book
- **Presets** — Book, Manga, Comic, PDF
- **Library** — add folders or files from your machine
- **Internationalization** — Portuguese (Brazil), English, Spanish

## Roadmap

The architecture is already prepared for:

- **Optional sync** — Go API with Last Write Wins strategy
- **Google login** and Google Drive backup
- **React Native app** — reading on mobile devices
- **Book identification** — SHA-256 hash for deduplication and sync

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/)
- [Tauri prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites) for your platform

### Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

The executable will be generated in `src-tauri/target/release/`.

## Tech Stack

| Area     | Stack                   |
| -------- | ----------------------- |
| Desktop  | Tauri 2 (Rust)          |
| Frontend | React 19, Vite 7, TypeScript |
| Styling  | Tailwind CSS 4          |
| State    | Zustand                 |
| EPUB     | epub.js                 |
| PDF      | PDF.js (Mozilla)        |
| i18n     | i18next                 |

## License

To be defined. The project is open source and welcomes contributions.
