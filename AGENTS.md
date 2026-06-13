# AGENTS.md - ompu bar website

## Behavioral
- State assumptions before coding. If multiple interpretations exist, present them.
- If something is unclear, stop and ask. Don't hide confusion.
- Push back on unnecessary complexity. The user explicitly wants minimal code.
- Minimum code to solve the problem. No speculative features, no abstractions for single-use code, no error handling for impossible scenarios.
- Don't "improve" adjacent code, comments, or formatting. Touch only what the user asked for.
- Match existing style even if you'd do it differently.
- For multi-step tasks, state a brief plan with verifiable checkpoints before coding.

## Stack
- **Backend:** Node.js + Express (single `server.js`)
- **Templates:** ES6 template literals in route handlers (no EJS, no Pug)
- **Frontend:** htmx (CDN) + vanilla CSS + minimal vanilla JS
- **Uploads:** multer → `public/images/`
- **No build step, no bundler, no TypeScript**

## Run
```bash
npm install
ADMIN_PASSWORD=yourpass node server.js
```

## Data
- Drink and DJ data as JSON arrays in `data/drinks.json` and `data/djs.json`
- Admin pages at `/admin` CRUD these — writes back to JSON files via `fs.writeFileSync`
- Each drink/DJ can have an optional `image` field (filename in `public/images/`)
- `data/site.json` holds site-level settings (`hero_image`)
- Admin auth: session-based (`express-session`), password from `ADMIN_PASSWORD` env var
- Admin forms with file inputs use `hx-encoding="multipart/form-data"` + multer middleware

## Conventions
- htmx `hx-boost="true"` on `<body>` — all internal links swap content, no full reloads
- Routes return HTML fragments as template literals directly in `server.js`
- Admin forms submit via htmx for inline updates; each form targets its own row/card
- Colors: orange `#E85D04`, black `#0D0D0D`, card `#1A1A1A`, text `#F5F5F5`, muted `#A0A0A0`
- `public/` is static; `style.css` and `app.js` live there
- Logo: `public/logo.svg`
- Images blend via CSS: grayscale, low opacity/brightness, organic border-radius — no hard edges

## Routes
| Path | Purpose |
|------|---------|
| `/`, `/drinks`, `/djs` | Public pages |
| `/admin` | Login |
| `/admin/drinks`, `/admin/djs` | CRUD (session-guarded) |
| `/admin/site` | Hero image upload |
