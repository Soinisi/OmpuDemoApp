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
| `/drinks` | Menu — filter by category (Cocktails / Beer / Wine) |
| `/djs` | Lineup — upcoming sets, toggle past sets |
| `/admin` | Login — enter the ADMIN_PASSWORD |
| `/admin/drinks` | Add, edit, delete drinks |
| `/admin/djs` | Add, edit, delete DJs |
| `/admin/site` | Upload a hero background image |

## How it works

- **One file backend** — `server.js` is the whole app. Routes return HTML fragments as template literals.
- **htmx** — `hx-boost` on the body makes all navigation feel like an SPA. Drink tabs and admin forms submit via `hx-get`/`hx-post` with no full reloads.
- **Data** — drinks and DJs live as JSON arrays in `data/`. The admin panel writes changes back with `fs.writeFileSync`. No database.
- **Images** — upload via admin forms (multer). Stored in `public/images/` locally. Displayed blended: grayscale, low opacity, organic shapes.
- **Auth** — signed admin cookie. Single password from the `ADMIN_PASSWORD` env var.
- **Netlify** — production admin changes use Netlify Blobs for persistent drinks, DJs, site settings, and uploaded images.

## Netlify

This repo includes `netlify.toml` and a Netlify Function wrapper for the Express app.

1. Connect the GitHub repo to Netlify.
2. Set environment variables in Netlify:

```bash
ADMIN_PASSWORD=your-admin-password
SESSION_SECRET=use-a-long-random-string
```

3. Push to GitHub. Netlify installs dependencies and deploys automatically.

Production data is independent from git. The first Netlify request seeds Blob storage from the committed JSON files if Blobs are empty. After that, `/admin` edits in production update Netlify Blobs and are not overwritten by later deploys.

## Tests

```bash
npm test
```

Uses Node's built-in test runner. 20 tests cover all public pages and admin CRUD.

## Tech

Express, express-session, multer, htmx (CDN), vanilla CSS, ~50 lines vanilla JS.
