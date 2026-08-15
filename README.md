# om'pu

Bar website — drinks menu, DJ lineup, admin panel. Orange and black. htmx frontend, Express backend.

## Run

```bash
npm install
ADMIN_PASSWORD=yourpass node server.js
```

Open `http://localhost:3000`.

Local admin changes write to tracked files in `data/` and `public/images/`, so you can review them with `git status`, commit, and push.

## Pages

| Path | Content |
|------|---------|
| `/` | Home — hero, room description, drinks/music teasers, rules, location |
| `/drinks` | Menu — tabs for Beer &amp; Cider &amp; Others, Wine, Hard Spirits, Cocktails |
| `/djs` | Lineup — upcoming sets, toggle past sets |
| `/art` | Art page — artists and artworks |
| `/admin` | Login — enter the ADMIN_PASSWORD |
| `/admin/drinks` | Add, edit, delete drinks |
| `/admin/djs` | Add, edit, delete DJs |
| `/admin/art` | Manage artists and artworks |
| `/admin/site` | Hero, tagline, hours, homepage content, data backups |

## How it works

- **One file backend** — `server.js` is the whole app. Routes return HTML fragments as template literals.
- **htmx** — `hx-boost` on the body makes all navigation feel like an SPA. Drink tabs and admin forms submit via `hx-get`/`hx-post` with no full reloads.
- **Data** — drinks, DJs, artworks, artists, and site settings live as JSON files in `data/`. Admin panel writes changes back with `fs.writeFileSync`. No database.
- **Images** — upload via admin forms (multer). Stored in `public/images/` locally. Displayed blended: grayscale, low opacity, organic shapes.
- **Auth** — signed HMAC cookie carrying a role. Three roles via passwords: `ADMIN_PASSWORD` (master), `DJ_PASSWORD` (DJs only), `ART_PASSWORD` (art only).
- **Backups** — every admin login auto-snapshots all JSON data to Netlify Blobs. Last 50 kept. Restore from `/admin/site`. Local mode skips backups.
- **Netlify** — production admin changes use Netlify Blobs for persistent data and uploaded images.

## Netlify

This repo includes `netlify.toml` and a Netlify Function wrapper for the Express app.

1. Connect the GitHub repo to Netlify.
2. Set environment variables in Netlify:

```bash
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=use-a-long-random-string
DJ_PASSWORD=optional-dj-only-password
ART_PASSWORD=optional-art-only-password
```

Roles map to passwords: `ADMIN_PASSWORD` → master (everything), `DJ_PASSWORD` → DJs only, `ART_PASSWORD` → art/artists only. Leave the DJ/ART vars unset to disable those roles.

Store isolation is automatic: if the request hostname contains `--` (all non-production Netlify URLs), the app uses `getDeployStore` for isolated, ephemeral data. Production uses site-wide `getStore` for persistent data. No configuration needed — detection happens in the function wrapper.

3. Push to GitHub. Netlify installs dependencies and deploys automatically.

Production data is independent from git. The first Netlify request seeds Blob storage from the committed JSON files if Blobs are empty. After that, `/admin` edits in production update Netlify Blobs and are not overwritten by later deploys.

## Tests

```bash
npm test
```

Uses Node's built-in test runner. 48 tests cover all public pages, admin CRUD, and role-based auth.

## Tech

Express, multer, htmx (CDN), vanilla CSS, ~50 lines vanilla JS.
