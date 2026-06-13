# om'pu

Bar website — drinks menu, DJ lineup, admin panel. Orange and black. htmx frontend, Express backend.

## Run

```bash
npm install
ADMIN_PASSWORD=yourpass node server.js
```

Open `http://localhost:3000`.

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
- **Images** — upload via admin forms (multer). Stored in `public/images/`. Displayed blended: grayscale, low opacity, organic shapes.
- **Auth** — session-based. Single password from the `ADMIN_PASSWORD` env var.

## Tests

```bash
npm test
```

Uses Node's built-in test runner. 20 tests cover all public pages and admin CRUD.

## Tech

Express, express-session, multer, htmx (CDN), vanilla CSS, ~50 lines vanilla JS.
