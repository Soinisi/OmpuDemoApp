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
- **Persistence:** `fs.writeFileSync` (local), `@netlify/blobs` `getStore`/`getDeployStore` (Netlify)
- **Netlify wrapper:** `serverless-http` in `netlify/functions/server.js`
- **No build step, no bundler, no TypeScript**

## Run
```bash
npm install
ADMIN_PASSWORD=yourpass node server.js
```

## Data
- 5 JSON stores in `data/`: `drinks.json`, `djs.json`, `artworks.json`, `artists.json`, `site.json`
- Generic persistence: `loadData(name)` reads from blob or disk, seeds bundled JSON if blob empty
- `saveData(name, data)` writes to blob (`setJSON`) or `fs.writeFileSync`
- Wrappers: `loadDrinks()`, `saveDrinks(data)`, etc. — all route through `loadData`/`saveData`
- Images: `saveUploadedImage(file)` → returns filename; `removeImage(filename)` cleans up
- Multer switches `diskStorage` (local) vs `memoryStorage` (blobs) based on `USE_BLOBS`
- Seed data in `data/*.json` is only used on first deploy if blob store is empty; never overwrites production data

## Conventions
- htmx `hx-boost="true"` on `<body>` — all internal links swap content, no full reloads
- Routes return HTML fragments as template literals directly in `server.js`
- Admin forms submit via htmx for inline updates; each form targets its own row/card
- Admin edit forms use surgical row-level swaps (`hx-target="#id-N" hx-swap="outerHTML"`), not full-list `innerHTML`
- Colors: orange `#E85D04`, black `#0D0D0D`, card `#1A1A1A`, text `#F5F5F5`, muted `#A0A0A0`
- `public/` is static; `style.css` and `app.js` live there
- Images blend via CSS: grayscale, low opacity/brightness, organic border-radius — no hard edges
- **Price handling:** stored as float internally; input `type="text"` accepts `8.5` or `8,5` via `parsePrice()`; display via `formatPrice()` — comma separator, 2 decimal places (`€8,50`), whole numbers no trailing zeros (`€8`)
- **Date handling (DJs):** stored as `yyyy-mm-dd`; admin input `dd/mm/yyyy` text field via `parseEUDate()`/`formatEUDate()`; public display via `toLocaleDateString("en-GB", ...)`
- **Admin dropdowns:** `categoryDropdown(selected)` helper generates `<select>` options to avoid duplication

## Routes
| Path | Purpose |
|------|---------|
| `/`, `/drinks`, `/djs`, `/art` | Public pages |
| `/admin` | Login (signed HMAC cookie) |
| `/admin/drinks`, `/admin/djs`, `/admin/art` | CRUD — list, add, edit, delete |
| `/admin/site` | Hero image, tagline, hours, homepage content, backups list |
| `/admin/backups` | List/download/restore data snapshots (htmx sub-routes) |
| `/admin/artists` | CRUD sub-routes for artists (no standalone page — lives on `/admin/art`) |

## Netlify Deploy Architecture

### Store isolation
- **Production**: hostname has no `--` → `getStore()` — site-wide, persistent across deploys
- **Previews/Branches**: hostname contains `--` → `getDeployStore(name, { region })` — deploy-scoped, isolated
- Detection: `netlify/functions/server.js` wrapper reads `event.headers.host`, sets `process.env.IS_PRODUCTION`
- `getDataStore()`, `getImageStore()`, `getBackupStore()` helpers encapsulate the selection logic
- Null guard pattern: if store is `null` (deploy store unavailable), `loadData` falls back to bundled JSON, `saveData` skips writes silently

### Blob auth (function wrapper — must run in this order)
1. `process.env.IS_PRODUCTION` ← hostname contains `--`?
2. `process.env.BLOBS_REGION` ← `event.blobs` base64 JSON (try `data.region`) or `process.env.AWS_REGION`
3. `connectLambda(event)` ← sets up `deployID`, `siteID`, `token` for `@netlify/blobs`
4. `handler(event, context)` ← serverless-http → Express

### Backups
- `snapshotBlobs()` called on every admin login — reads all 5 stores, writes timestamped bundle to `ompu-backups`
- 50-backup cap: oldest deleted when exceeding limit
- List/download/restore routes behind `requireAdmin`
- `sitePageBody()` shows backup list via `hx-get="/admin/backups"` on load
- Local mode skips backups; preview/branch deploys show "unavailable" message

## Learnings (Netlify gotchas)
- `process.env.NETLIFY` is build-time only — NOT available at runtime in functions
- `process.env.AWS_LAMBDA_FUNCTION_NAME` is the reliable runtime signal for "running on Netlify"
- `netlify.toml` `[context.*.environment]` variables never reach function runtime
- Hostname `--` pattern is the only reliable runtime signal for deploy context
- `getDeployStore` requires explicit `region` option in function context; extract from `event.blobs` base64
- `connectLambda()` only sets `deployID`/`siteID`/`token` — not `region`
- Deploy-specific blob stores (`getDeployStore`) are invisible in Netlify Blobs UI
- `consistency: "strong"` is not supported in Lambda-based function blobs (throws `BlobsConsistencyError`)
- Eventual consistency window: up to 60s. Post-save responses must use in-memory data, never re-read from blobs
- `app.listen()` guarded with `require.main === module` so the serverless wrapper doesn't bind a port
- Don't commit `site.json` changes — inline backup/restore in tests that modify it

## Tests
- Node built-in test runner: `npm test` — 38 tests across 7 suites
- `findRowId(html, prefix, name)` helper — finds an item's DOM id by scanning for the row id attribute before the name text
- Inline backup/restore pattern: read file before POST, `fs.writeFileSync` after assertions — prevents test artifacts
- Top-level `after` hook restores all data files as safety net
- Login → extract cookie → pass to subsequent admin requests
- htmx assertions: check for `Save`/`Cancel`/`Edit`/`Delete` buttons and `admin-row-edit` class on edit forms
