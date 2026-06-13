const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const TEST_PW = "test-password";

// Backup data files
const drinksPath = path.join(__dirname, "..", "data", "drinks.json");
const djsPath = path.join(__dirname, "..", "data", "djs.json");
const drinksBackup = fs.readFileSync(drinksPath, "utf-8");
const djsBackup = fs.readFileSync(djsPath, "utf-8");

process.env.ADMIN_PASSWORD = TEST_PW;
const app = require("../server");

let server, baseURL;

before(() => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      baseURL = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

after(() => {
  server.close();
  fs.writeFileSync(drinksPath, drinksBackup);
  fs.writeFileSync(djsPath, djsBackup);
  delete process.env.ADMIN_PASSWORD;
});

async function fetch(path, opts = {}) {
  const res = await globalThis.fetch(baseURL + path, {
    redirect: "manual",
    ...opts,
  });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

// Find the nearest id="...-N" before a given name in HTML
function findRowId(html, prefix, name) {
  const idx = html.indexOf(name);
  if (idx === -1) return null;
  const before = html.slice(0, idx);
  const matches = [...before.matchAll(new RegExp(`id="${prefix}-(\\d+)"`, "g"))];
  return matches.length ? matches[matches.length - 1][1] : null;
}

// --- Public pages ---

describe("Public pages", () => {
  it("GET / returns home page", async () => {
    const { status, text } = await fetch("/");
    assert.equal(status, 200);
    assert.match(text, /ompu/);
    assert.match(text, /The Room/);
    assert.match(text, /42 Vinyl Lane/);
  });

  it("GET /drinks returns full drinks page", async () => {
    const { status, text } = await fetch("/drinks");
    assert.equal(status, 200);
    assert.match(text, /Ompu Old Fashioned/);
    assert.match(text, /Cocktails/);
    assert.match(text, /drink-item/);
  });

  it("GET /drinks?cat=cocktails returns filtered fragment", async () => {
    const { status, text } = await fetch("/drinks?cat=cocktails");
    assert.equal(status, 200);
    assert.match(text, /Ompu Old Fashioned/);
    assert.match(text, /Espresso Martini/);
    assert.match(text, /Ember Sour/);
    assert.match(text, /Black Margarita/);
    // Should NOT contain full page layout
    assert.doesNotMatch(text, /<!DOCTYPE html>/);
  });

  it("GET /drinks?cat=beer returns beer-only fragment", async () => {
    const { status, text } = await fetch("/drinks?cat=beer");
    assert.equal(status, 200);
    assert.match(text, /Draft IPA/);
    assert.match(text, /Dark Lager/);
    assert.doesNotMatch(text, /Ompu Old Fashioned/);
    assert.doesNotMatch(text, /<!DOCTYPE html>/);
  });

  it("GET /djs returns DJs page with upcoming and past", async () => {
    const { status, text } = await fetch("/djs");
    assert.equal(status, 200);
    assert.match(text, /Upcoming/);
    assert.match(text, /Past Sets/);
    assert.match(text, /DJ Solstice/);
    assert.match(text, /MIRA/);
    assert.match(text, /dj-item/);
  });
});

// --- Admin auth ---

describe("Admin auth", () => {
  let adminCookie;

  it("GET /admin returns login form", async () => {
    const { status, text } = await fetch("/admin");
    assert.equal(status, 200);
    assert.match(text, /password/i);
  });

  it("POST /admin/login with wrong password stays on login", async () => {
    const { status } = await fetch("/admin/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=wrong",
    });
    assert.equal(status, 200);
  });

  it("POST /admin/login with correct password redirects to admin/drinks", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=" + TEST_PW,
      redirect: "manual",
    });
    assert.equal(res.status, 302);
    adminCookie = res.headers.get("set-cookie");
    assert.ok(adminCookie);
  });

  it("GET /admin/drinks is guarded (denied without session)", async () => {
    const { status } = await fetch("/admin/drinks");
    assert.equal(status, 302);
  });

  it("GET /admin/drinks works with session cookie", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/drinks", {
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /Manage Drinks/);
  });

  it("GET /admin/djs works with session cookie", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/djs", {
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.equal(res.status, 200);
    assert.match(text, /Manage DJs/);
  });
});

// --- Admin Drink CRUD ---

describe("Admin drink CRUD", () => {
  let adminCookie;

  before(async () => {
    const res = await globalThis.fetch(baseURL + "/admin/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=" + TEST_PW,
      redirect: "manual",
    });
    adminCookie = res.headers.get("set-cookie");
  });

  it("drink list shows all drinks", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/drinks", {
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.match(text, /Ompu Old Fashioned/);
    assert.match(text, /Espresso Martini/);
  });

  it("adds a new drink", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/drinks", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: adminCookie,
      },
      body: "id=0&name=Test+Gin&category=cocktails&description=Test+desc&price=10",
    });
    const text = await res.text();
    assert.match(text, /Test Gin/);
    assert.match(text, /€10/);
  });

  it("edits an existing drink", async () => {
    // First find the id of the drink we just added
    const listRes = await globalThis.fetch(baseURL + "/admin/drinks", {
      headers: { cookie: adminCookie },
    });
    const listText = await listRes.text();
    const match = listText.match(/Test Gin/);
    assert.ok(match);

    const id = findRowId(listText, "drink", "Test Gin");
    assert.ok(id, "Could not find Test Gin's id");

    const res = await globalThis.fetch(baseURL + "/admin/drinks", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: adminCookie,
      },
      body: `id=${id}&name=Test+Gin+Edited&category=cocktails&description=Updated&price=11`,
    });
    const text = await res.text();
    assert.match(text, /Test Gin Edited/);
    assert.match(text, /€11/);
  });

  it("deletes a drink", async () => {
    const listRes = await globalThis.fetch(baseURL + "/admin/drinks", {
      headers: { cookie: adminCookie },
    });
    const listText = await listRes.text();
    const id = findRowId(listText, "drink", "Test Gin Edited");
    assert.ok(id, "Could not find Test Gin Edited's id");

    const res = await globalThis.fetch(baseURL + "/admin/drinks/" + id, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.doesNotMatch(text, /Test Gin Edited/);
  });

  it("edit endpoint returns edit form", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/drinks/edit/1", {
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.match(text, /Ompu Old Fashioned/);
    assert.match(text, /Save/);
    assert.match(text, /Cancel/);
    assert.match(text, /admin-row-edit/);
  });

  it("cancel endpoint returns display row", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/drinks/cancel/1", {
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.match(text, /Ompu Old Fashioned/);
    assert.match(text, /Edit/);
    assert.match(text, /Delete/);
  });
});

// --- Admin DJ CRUD ---

describe("Admin DJ CRUD", () => {
  let adminCookie;

  before(async () => {
    const res = await globalThis.fetch(baseURL + "/admin/login", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "password=" + TEST_PW,
      redirect: "manual",
    });
    adminCookie = res.headers.get("set-cookie");
  });

  it("DJ list shows DJs", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/djs", {
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.match(text, /DJ Solstice/);
    assert.match(text, /MIRA/);
  });

  it("adds a new DJ", async () => {
    const res = await globalThis.fetch(baseURL + "/admin/djs", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: adminCookie,
      },
      body: "id=0&name=Test+DJ&genre=Test+Genre&date=2026-12-25&time=23:00&bio=Test+bio",
    });
    const text = await res.text();
    assert.match(text, /Test DJ/);
    assert.match(text, /Test Genre/);
  });

  it("deletes the test DJ", async () => {
    const listRes = await globalThis.fetch(baseURL + "/admin/djs", {
      headers: { cookie: adminCookie },
    });
    const listText = await listRes.text();
    const id = findRowId(listText, "dj", "Test DJ");
    assert.ok(id, "Could not find Test DJ's id");

    const res = await globalThis.fetch(baseURL + "/admin/djs/" + id, {
      method: "DELETE",
      headers: { cookie: adminCookie },
    });
    const text = await res.text();
    assert.doesNotMatch(text, /Test DJ/);
  });
});
