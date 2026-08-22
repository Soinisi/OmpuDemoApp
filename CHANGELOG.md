# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-08-22

### Added
- Bulk DJ import on `/admin/djs` — paste the lineup as text, one DJ per line (`name | date | time | genre | bio`), with on-page format instructions. (#17, PR #16)

### Fixed
- DJ date validation now rejects impossible calendar dates (e.g. `31/02/2027`). (#18)

### Changed
- Deduplicated id-generation, sort, and nav-link logic in `server.js`. (#19)
- Admin passwords (`ADMIN/DJ/ART_PASSWORD`) trimmed at startup. (#19)

## [1.0.0] - 2026-07-01

Initial release: public pages (home, drinks, DJs, art), admin panel with role-based auth (master/dj/art), and Netlify blob persistence with backups.
