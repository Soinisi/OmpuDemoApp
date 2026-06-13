const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PW = process.env.ADMIN_PASSWORD || "admin";

const upload = multer({
  storage: multer.diskStorage({
    destination: "public/images/",
    filename: (_req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
    },
  }),
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(
  session({
    secret: "ompu-bar-secret-" + (ADMIN_PW || "fallback"),
    resave: false,
    saveUninitialized: false,
  })
);

// --- Data helpers ---

function loadDrinks() {
  return JSON.parse(fs.readFileSync("data/drinks.json", "utf-8"));
}
function saveDrinks(data) {
  fs.writeFileSync("data/drinks.json", JSON.stringify(data, null, 2));
}
function loadDJs() {
  return JSON.parse(fs.readFileSync("data/djs.json", "utf-8"));
}
function saveDJs(data) {
  fs.writeFileSync("data/djs.json", JSON.stringify(data, null, 2));
}
function loadSite() {
  return JSON.parse(fs.readFileSync("data/site.json", "utf-8"));
}
function saveSite(data) {
  fs.writeFileSync("data/site.json", JSON.stringify(data, null, 2));
}
function removeImage(filename) {
  if (!filename) return;
  const p = path.join("public/images", filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// --- Auth middleware ---

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect("/admin");
}

// --- Layout ---

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ompu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="/style.css">
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script src="/app.js" defer></script>
</head>
<body hx-boost="true" hx-swap="innerHTML transition:true">
  <nav class="nav">
    <a href="/" class="nav-logo">
      <img src="/logo.svg" alt="ompu" height="52">
    </a>
    <div class="nav-links">
      <a href="/drinks" class="nav-link${title === "Drinks" ? " active" : ""}">Drinks</a>
      <a href="/djs" class="nav-link${title === "DJs" ? " active" : ""}">DJs</a>
    </div>
  </nav>
  <main class="main" id="main">
${indent(body, 4)}
  </main>
  <footer class="footer">
    <p>Thu–Sat 20:00–02:00 &nbsp;|&nbsp; 42 Vinyl Lane &nbsp;|&nbsp; 30+ only</p>
  </footer>
</body>
</html>`;
}

function indent(str, n) {
  const pad = " ".repeat(n);
  return str
    .split("\n")
    .map((line) => (line ? pad + line : line))
    .join("\n");
}

// ============================================================
// PUBLIC PAGES
// ============================================================

app.get("/", (_req, res) => {
  const site = loadSite();
  res.send(
    layout(
      "Home",
      `
<div class="hero">
  ${site.hero_image ? `<div class="hero-bg"><img src="/images/${site.hero_image}" class="hero-bg-img"></div>` : ""}
  <img src="/logo.svg" alt="ompu" class="hero-logo">
  <p class="hero-tagline">Drinks. Music. After dark.</p>
  <div class="hero-hours">
    <span>THU–SAT</span>
    <span class="hero-dot"></span>
    <span>20:00–02:00</span>
  </div>
</div>

<section class="section reveal">
  <h2 class="section-title">The Room</h2>
  <p class="section-text">
    om'pu lives behind the old record shop on Vinyl Lane — you won't find a
    sign, just a warm orange glow spilling from under a heavy door. Step inside
    and the city disappears. Low ceilings, exposed brick, a wall of vinyl sleeves
    behind the bar. The sound system wasn't chosen — it was built. Warm, weighty,
    the kind that makes you feel bass in your chest before you hear it.
  </p>
  <p class="section-text" style="margin-top:1.25rem">
    The bar itself is a single slab of blackened oak. Behind it, shelves climb
    to the ceiling — bottles backlit in amber. No TVs. No fruit machines. No
    neon signs screaming for attention. Just a room that knows exactly what it
    is and doesn't need to explain itself.
  </p>
</section>

<section class="section reveal">
  <h2 class="section-title">The Drinks</h2>
  <p class="section-text">
    Every cocktail on the menu was built in this room, for this room. No
    borrowed recipes, no crowd-pleasing sugar bombs. The Old Fashioned is
    smoked with hickory. The Margarita runs black from activated charcoal.
    The Sour changes with the season — whatever fruit is worth using that week.
  </p>
  <p class="section-text" style="margin-top:1.25rem">
    Beer comes from breweries within fifty kilometres. Wine is natural,
    funky, alive — poured by people who can tell you the grower's name.
    If you want a vodka soda you can have one, but nobody's going to pretend
    it's a good idea.
  </p>
  <p style="margin-top:1.5rem">
    <a href="/drinks" class="nav-link" style="font-size:0.85rem">See the full menu →</a>
  </p>
</section>

<section class="section reveal">
  <h2 class="section-title">The Sound</h2>
  <p class="section-text">
    Music here isn't background — it's half the reason people come. Thursdays
    lean deep and hypnotic. Fridays stretch from funk to Afrobeat to whatever
    the selector pulled from a crate that afternoon. Saturdays go late — minimal,
    dub, the kind of techno that feels like a pulse rather than a song.
  </p>
  <p class="section-text" style="margin-top:1.25rem">
    All vinyl. No laptops. No playlists. Every DJ who plays here knows the room
    — knows how the sound fills the low corners, knows when to let the track
    breathe and when to push. Some nights you'll hear records that haven't been
    pressed since 1978. Some nights you'll hear things you can't find anywhere.
  </p>
  <p style="margin-top:1.5rem">
    <a href="/djs" class="nav-link" style="font-size:0.85rem">See who's playing →</a>
  </p>
</section>

<section class="section reveal">
  <h2 class="section-title">The Rules</h2>
  <p class="section-text">
    <strong>30+ only.</strong> Not a gimmick — just the kind of room we want.
    No ID, no entry. <strong>No photography.</strong> What happens here stays
    in the low light. <strong>No large groups.</strong> Four people max; six
    if you book ahead. <strong>No shouting across the bar.</strong> You're
    three feet from the bartender — use your voice.
  </p>
</section>

<section class="section reveal">
  <h2 class="section-title">Find Us</h2>
  <p class="section-text">
    42 Vinyl Lane — walk past the record shop, turn left at the courtyard,
    look for the orange light under the door. Knock twice.
  </p>
  <p class="section-text muted" style="margin-top:0.75rem">
    Thursday to Saturday, 20:00 until late. No reservations except for
    groups of four to six — email room@ompu.bar at least 48 hours ahead.
  </p>
</section>`
    )
  );
});

app.get("/drinks", (req, res) => {
  const drinks = loadDrinks();
  const categories = [...new Set(drinks.map((d) => d.category))];
  const selectedCat = req.query.cat || categories[0];

  if (req.query.cat) {
    return res.send(drinkCards(drinks.filter((d) => d.category === selectedCat)));
  }

  res.send(
    layout(
      "Drinks",
      `
<div class="page-header">
  <h1 class="page-title">Drinks</h1>
  <p class="page-subtitle">Crafted. No shortcuts.</p>
</div>
<div class="tabs" role="tablist">
  ${categories
    .map(
      (cat, i) =>
        `<button class="tab${i === 0 ? " active" : ""}"
          hx-get="/drinks?cat=${cat}"
          hx-target="#drink-list"
          hx-swap="innerHTML"
          hx-indicator="#drink-loading"
          onclick="document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));this.classList.add('active')">${capitalize(cat)}</button>`
    )
    .join("\n  ")}
</div>
<div id="drink-loading" class="htmx-indicator">
  <div class="spinner"></div>
</div>
<div id="drink-list">
  ${drinkCards(drinks.filter((d) => d.category === selectedCat))}
</div>`
    )
  );
});

function drinkCards(drinks) {
  return drinks
    .map(
      (d) => `
<div class="drink-item reveal">
  ${d.image ? `<img src="/images/${d.image}" class="drink-photo">` : ""}
  <h3 class="drink-name">${d.name}</h3>
  <span class="drink-price" data-price="${d.price}">€${d.price}</span>
  <p class="drink-desc">${d.description}</p>
</div>`
    )
    .join("\n");
}

app.get("/djs", (_req, res) => {
  const djs = loadDJs();
  const now = new Date();
  const upcoming = djs
    .filter((d) => new Date(d.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = djs
    .filter((d) => new Date(d.date) < now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  res.send(
    layout(
      "DJs",
      `
<div class="page-header">
  <h1 class="page-title">Lineup</h1>
  <p class="page-subtitle">The sound of ompu.</p>
</div>
<section class="section">
  <h2 class="section-title">Upcoming</h2>
  <div class="dj-list">
    ${upcoming.length
      ? upcoming.map(djRow).join("\n    ")
      : '<p class="empty">No upcoming sets. Check back soon.</p>'}
  </div>
</section>
${
  past.length
    ? `
<section class="section">
  <button class="toggle-btn reveal" onclick="this.nextElementSibling.classList.toggle('hidden')">
    Past Sets
  </button>
  <div class="dj-list hidden">
    ${past.map(djRow).join("\n    ")}
  </div>
</section>`
    : ""
}`
    )
  );
});

function djRow(d) {
  const date = new Date(d.date);
  const day = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  return `
<div class="dj-item reveal">
  <div class="dj-date">${d.image ? `<img src="/images/${d.image}" class="dj-photo">` : ""}
    <span class="dj-day">${day}</span>
    <span class="dj-time">${d.time}</span>
  </div>
  <div class="dj-info">
    <h3 class="dj-name">${d.name}</h3>
    <span class="tag">${d.genre}</span>
  </div>
  <p class="dj-bio">${d.bio}</p>
</div>`;
}

// ============================================================
// ADMIN
// ============================================================

function adminLayout(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ompu admin</title>
  <link rel="stylesheet" href="/style.css">
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
</head>
<body>
  <nav class="nav admin-nav">
    <a href="/admin/drinks" class="nav-link${title.includes("Drinks") ? " active" : ""}">Manage Drinks</a>
    <a href="/admin/djs" class="nav-link${title.includes("DJs") ? " active" : ""}">Manage DJs</a>
    <a href="/admin/site" class="nav-link${title.includes("Site") ? " active" : ""}">Site</a>
    <a href="/" class="nav-link">View Site</a>
    <form action="/admin/logout" method="post" style="display:inline">
      <button class="btn btn-ghost">Logout</button>
    </form>
  </nav>
  <main class="main admin-main">
${indent(body, 4)}
  </main>
</body>
</html>`;
}

app.get("/admin", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — ompu</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <main class="login-page">
    <form class="login-form" method="post" action="/admin/login">
      <img src="/logo.svg" alt="ompu" height="64">
      <h2>Admin</h2>
      <input type="password" name="password" placeholder="Password" class="input" autofocus>
      <button class="btn">Enter</button>
      <p class="muted" style="font-size:0.8rem;margin-top:1rem">Set via ADMIN_PASSWORD env var</p>
    </form>
  </main>
</body>
</html>`);
});

app.post("/admin/login", (req, res) => {
  if (req.body.password === ADMIN_PW) {
    req.session.isAdmin = true;
    return res.redirect("/admin/drinks");
  }
  res.send(`<p style="color:#E85D04;text-align:center;margin-top:2rem">Wrong password.</p>`);
});

app.post("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin");
});

// --- Site settings ---

app.get("/admin/site", requireAdmin, (_req, res) => {
  const site = loadSite();
  res.send(
    adminLayout(
      "Admin — Site",
      `
<h1 class="page-title">Site</h1>
<div class="admin-add-form">
  <h2>Hero Image</h2>
  ${site.hero_image ? `<p class="muted" style="margin-bottom:1rem"><img src="/images/${site.hero_image}" class="site-thumb"></p>` : ""}
  <form hx-post="/admin/site" hx-encoding="multipart/form-data" hx-target="body" hx-swap="innerHTML">
    <input type="file" name="image" accept="image/*" class="input">
    <button class="btn">Upload</button>
  </form>
  ${site.hero_image ? `
  <form hx-post="/admin/site/remove-hero" style="margin-top:0.5rem">
    <button class="btn btn-danger btn-sm">Remove</button>
  </form>` : ""}
</div>`
    )
  );
});

app.post("/admin/site", requireAdmin, upload.single("image"), (req, res) => {
  const site = loadSite();
  if (req.file) {
    removeImage(site.hero_image);
    site.hero_image = req.file.filename;
    saveSite(site);
  }
  res.redirect("/admin/site");
});

app.post("/admin/site/remove-hero", requireAdmin, (req, res) => {
  const site = loadSite();
  removeImage(site.hero_image);
  site.hero_image = "";
  saveSite(site);
  res.redirect("/admin/site");
});

// --- Drink CRUD ---

app.get("/admin/drinks", requireAdmin, (_req, res) => {
  const drinks = loadDrinks();
  res.send(
    adminLayout(
      "Admin — Drinks",
      `
<h1 class="page-title">Drinks</h1>
<div id="drink-admin-list">
  ${adminDrinkList(drinks)}
</div>
<div class="admin-add-form">
  <h2>Add Drink</h2>
  <form hx-post="/admin/drinks" hx-target="#drink-admin-list" hx-swap="innerHTML"
        hx-encoding="multipart/form-data" hx-on::after-request="this.reset()">
    <input name="name" placeholder="Name" class="input" required>
    <select name="category" class="input">
      <option value="cocktails">Cocktails</option>
      <option value="beer">Beer</option>
      <option value="wine">Wine</option>
    </select>
    <input name="description" placeholder="Description" class="input">
    <input name="price" type="number" step="0.5" placeholder="Price (€)" class="input" required>
    <input type="file" name="image" accept="image/*" class="input">
    <input type="hidden" name="id" value="0">
    <button class="btn">Add</button>
  </form>
</div>`
    )
  );
});

app.post("/admin/drinks", requireAdmin, upload.single("image"), (req, res) => {
  const drinks = loadDrinks();
  const { id, name, category, description, price } = req.body;

  const existing = +id > 0 ? drinks.find((d) => d.id === +id) : null;

  if (existing) {
    if (req.file) {
      removeImage(existing.image);
      existing.image = req.file.filename;
    }
    Object.assign(existing, { name, category, description, price: +price });
  } else {
    const newId = drinks.length ? Math.max(...drinks.map((d) => d.id)) + 1 : 1;
    drinks.push({
      id: newId, name, category, description, price: +price,
      image: req.file ? req.file.filename : "",
    });
  }

  saveDrinks(drinks);
  res.send(adminDrinkList(drinks));
});

app.delete("/admin/drinks/:id", requireAdmin, (req, res) => {
  let drinks = loadDrinks();
  const drink = drinks.find((d) => d.id === +req.params.id);
  if (drink) removeImage(drink.image);
  drinks = drinks.filter((d) => d.id !== +req.params.id);
  saveDrinks(drinks);
  res.send(adminDrinkList(drinks));
});

function adminDrinkList(drinks) {
  return drinks
    .map(
      (d) => `
<div class="admin-row" id="drink-${d.id}">
  <div class="admin-row-info">
    ${d.image ? `<img src="/images/${d.image}" class="admin-thumb">` : ""}
    <span class="admin-row-name">${d.name}</span>
    <span class="tag">${d.category}</span>
    <span class="muted">${d.description}</span>
    <span>€${d.price}</span>
  </div>
  <div class="admin-row-actions">
    <button class="btn btn-sm"
      hx-get="/admin/drinks/edit/${d.id}"
      hx-target="#drink-${d.id}"
      hx-swap="outerHTML">Edit</button>
    <button class="btn btn-sm btn-danger"
      hx-delete="/admin/drinks/${d.id}"
      hx-target="#drink-admin-list"
      hx-swap="innerHTML"
      hx-confirm="Delete ${d.name}?">Delete</button>
  </div>
</div>`
    )
    .join("\n");
}

app.get("/admin/drinks/edit/:id", requireAdmin, (req, res) => {
  const drinks = loadDrinks();
  const d = drinks.find((d) => d.id === +req.params.id);
  if (!d) return res.status(404).send("Not found");
  res.send(`
<div class="admin-row admin-row-edit" id="drink-${d.id}">
  <form hx-post="/admin/drinks" hx-target="#drink-admin-list" hx-swap="innerHTML"
        hx-encoding="multipart/form-data"
        style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;width:100%">
    <input type="hidden" name="id" value="${d.id}">
    <input name="name" value="${d.name}" class="input" style="flex:1;min-width:120px">
    <select name="category" class="input">
      <option value="cocktails" ${d.category === "cocktails" ? "selected" : ""}>Cocktails</option>
      <option value="beer" ${d.category === "beer" ? "selected" : ""}>Beer</option>
      <option value="wine" ${d.category === "wine" ? "selected" : ""}>Wine</option>
    </select>
    <input name="description" value="${d.description}" class="input" style="flex:2;min-width:150px">
    <input name="price" type="number" step="0.5" value="${d.price}" class="input" style="width:80px">
    <input type="file" name="image" accept="image/*" class="input">
    ${d.image ? `<span class="muted" style="font-size:0.7rem">Current: ${d.image}</span>` : ""}
    <button class="btn btn-sm">Save</button>
    <button type="button" class="btn btn-sm btn-ghost"
      hx-get="/admin/drinks/cancel/${d.id}"
      hx-target="#drink-${d.id}"
      hx-swap="outerHTML">Cancel</button>
  </form>
</div>`);
});

app.get("/admin/drinks/cancel/:id", requireAdmin, (req, res) => {
  const drinks = loadDrinks();
  const d = drinks.find((d) => d.id === +req.params.id);
  if (!d) return res.send("");
  res.send(`
<div class="admin-row" id="drink-${d.id}">
  <div class="admin-row-info">
    ${d.image ? `<img src="/images/${d.image}" class="admin-thumb">` : ""}
    <span class="admin-row-name">${d.name}</span>
    <span class="tag">${d.category}</span>
    <span class="muted">${d.description}</span>
    <span>€${d.price}</span>
  </div>
  <div class="admin-row-actions">
    <button class="btn btn-sm"
      hx-get="/admin/drinks/edit/${d.id}"
      hx-target="#drink-${d.id}"
      hx-swap="outerHTML">Edit</button>
    <button class="btn btn-sm btn-danger"
      hx-delete="/admin/drinks/${d.id}"
      hx-target="#drink-admin-list"
      hx-swap="innerHTML"
      hx-confirm="Delete ${d.name}?">Delete</button>
  </div>
</div>`);
});

// --- DJ CRUD ---

app.get("/admin/djs", requireAdmin, (_req, res) => {
  const djs = loadDJs().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.send(
    adminLayout(
      "Admin — DJs",
      `
<h1 class="page-title">DJs</h1>
<div id="dj-admin-list">
  ${adminDJList(djs)}
</div>
<div class="admin-add-form">
  <h2>Add DJ</h2>
  <form hx-post="/admin/djs" hx-target="#dj-admin-list" hx-swap="innerHTML"
        hx-encoding="multipart/form-data" hx-on::after-request="this.reset()">
    <input name="name" placeholder="Name" class="input" required>
    <input name="genre" placeholder="Genre" class="input" required>
    <input name="date" type="date" class="input" required>
    <input name="time" type="time" class="input" required>
    <input name="bio" placeholder="Short bio" class="input">
    <input type="file" name="image" accept="image/*" class="input">
    <input type="hidden" name="id" value="0">
    <button class="btn">Add</button>
  </form>
</div>`
    )
  );
});

app.post("/admin/djs", requireAdmin, upload.single("image"), (req, res) => {
  const djs = loadDJs();
  const { id, name, genre, date, time, bio } = req.body;

  const existing = +id > 0 ? djs.find((d) => d.id === +id) : null;

  if (existing) {
    if (req.file) {
      removeImage(existing.image);
      existing.image = req.file.filename;
    }
    Object.assign(existing, { name, genre, date, time, bio });
  } else {
    const newId = djs.length ? Math.max(...djs.map((d) => d.id)) + 1 : 1;
    djs.push({
      id: newId, name, genre, date, time, bio,
      image: req.file ? req.file.filename : "",
    });
  }

  saveDJs(djs);
  res.send(adminDJList(djs.sort((a, b) => new Date(b.date) - new Date(a.date))));
});

app.delete("/admin/djs/:id", requireAdmin, (req, res) => {
  let djs = loadDJs();
  const dj = djs.find((d) => d.id === +req.params.id);
  if (dj) removeImage(dj.image);
  djs = djs.filter((d) => d.id !== +req.params.id);
  saveDJs(djs);
  res.send(adminDJList(djs.sort((a, b) => new Date(b.date) - new Date(a.date))));
});

function adminDJList(djs) {
  return djs
    .map(
      (d) => `
<div class="admin-row" id="dj-${d.id}">
  <div class="admin-row-info">
    ${d.image ? `<img src="/images/${d.image}" class="admin-thumb">` : ""}
    <span class="admin-row-name">${d.name}</span>
    <span class="tag">${d.genre}</span>
    <span class="muted">${d.date} ${d.time}</span>
    <span>${d.bio}</span>
  </div>
  <div class="admin-row-actions">
    <button class="btn btn-sm"
      hx-get="/admin/djs/edit/${d.id}"
      hx-target="#dj-${d.id}"
      hx-swap="outerHTML">Edit</button>
    <button class="btn btn-sm btn-danger"
      hx-delete="/admin/djs/${d.id}"
      hx-target="#dj-admin-list"
      hx-swap="innerHTML"
      hx-confirm="Delete ${d.name}?">Delete</button>
  </div>
</div>`
    )
    .join("\n");
}

app.get("/admin/djs/edit/:id", requireAdmin, (req, res) => {
  const djs = loadDJs();
  const d = djs.find((d) => d.id === +req.params.id);
  if (!d) return res.status(404).send("Not found");
  res.send(`
<div class="admin-row admin-row-edit" id="dj-${d.id}">
  <form hx-post="/admin/djs" hx-target="#dj-admin-list" hx-swap="innerHTML"
        hx-encoding="multipart/form-data"
        style="display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;width:100%">
    <input type="hidden" name="id" value="${d.id}">
    <input name="name" value="${d.name}" class="input" style="flex:1;min-width:120px">
    <input name="genre" value="${d.genre}" class="input" style="width:140px">
    <input name="date" type="date" value="${d.date}" class="input" style="width:140px">
    <input name="time" type="time" value="${d.time}" class="input" style="width:110px">
    <input name="bio" value="${d.bio}" class="input" style="flex:2;min-width:150px">
    <input type="file" name="image" accept="image/*" class="input">
    ${d.image ? `<span class="muted" style="font-size:0.7rem">Current: ${d.image}</span>` : ""}
    <button class="btn btn-sm">Save</button>
    <button type="button" class="btn btn-sm btn-ghost"
      hx-get="/admin/djs/cancel/${d.id}"
      hx-target="#dj-${d.id}"
      hx-swap="outerHTML">Cancel</button>
  </form>
</div>`);
});

app.get("/admin/djs/cancel/:id", requireAdmin, (req, res) => {
  const djs = loadDJs();
  const d = djs.find((d) => d.id === +req.params.id);
  if (!d) return res.send("");
  res.send(`
<div class="admin-row" id="dj-${d.id}">
  <div class="admin-row-info">
    ${d.image ? `<img src="/images/${d.image}" class="admin-thumb">` : ""}
    <span class="admin-row-name">${d.name}</span>
    <span class="tag">${d.genre}</span>
    <span class="muted">${d.date} ${d.time}</span>
    <span>${d.bio}</span>
  </div>
  <div class="admin-row-actions">
    <button class="btn btn-sm"
      hx-get="/admin/djs/edit/${d.id}"
      hx-target="#dj-${d.id}"
      hx-swap="outerHTML">Edit</button>
    <button class="btn btn-sm btn-danger"
      hx-delete="/admin/djs/${d.id}"
      hx-target="#dj-admin-list"
      hx-swap="innerHTML"
      hx-confirm="Delete ${d.name}?">Delete</button>
  </div>
</div>`);
});

// --- Helpers ---

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- Start ---

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ompu running at http://localhost:${PORT}`);
  });
}

module.exports = app;
