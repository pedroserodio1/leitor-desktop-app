# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-03-01

### Added

- **Internationalization (i18n)** — Portuguese (Brazil), English, Spanish via i18next
- **Error boundary** — CrashScreen for uncaught React errors
- **Splash screen** — Splash screen window on app launch
- **Custom themes** — Custom theme modal with CSS validation, backend commands and repository
- **Metadata search** — Online metadata search (Open Library, LoC, AniList, Kitsu, Jikan) in book detail view
- **Context menu** — Right-click context menu on book cards
- **Fullscreen** — Fullscreen button and sidebar toggle in reader TopBar
- **File association** — Open file from system file association (EPUB, PDF, CBZ, CBR)
- **VITE_BASE_URL** — Environment variable for base URL; doc link in custom theme modal
- **Splash-like loading** — Loading state while app initializes

### Changed

- **EPUB reader** — Improved EPUB adapter and virtualized scroll
- **Shelf selection** — Improved shelf selection UI, About section, and library filters
- **Capabilities & permissions** — Updated Tauri capabilities and permissions

### Fixed

- **PDF** — Fix PDF pages not rendering

### Dependencies

- Added reqwest, regex, urlencoding for metadata search
- Added i18next for internationalization
