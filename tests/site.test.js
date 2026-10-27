const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const SITE = path.join(__dirname, "..");
const SITE_FILES = ["index.html", "styles.css", "app.js", "data.js", "sims.js", "favicon.svg"];
const read = (f) => fs.readFileSync(path.join(SITE, f), "utf8");

test("index has title, viewport, local assets only", () => {
  const html = read("index.html");
  assert.match(html, /<title>CareerQuest/);
  assert.match(html, /name="viewport" content="width=device-width, initial-scale=1/);
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    assert.ok(!/^https?:/.test(m[1]), "remote asset: " + m[1]);
    assert.ok(fs.existsSync(path.join(SITE, m[1])), "missing asset: " + m[1]);
  }
  assert.ok(!/lorem|TODO|placeholder text/i.test(html));
});

test("content meets MVP scope", () => {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(read("data.js"), ctx);
  const D = ctx.window.CQ_DATA;
  assert.ok(D.careers.length >= 8, "careers");
  for (const c of D.careers) for (const k of ["what", "day", "skills", "tools", "entry", "path", "routes", "projects", "certs"]) assert.ok(c[k] && c[k].length, c.id + " missing " + k);
  assert.ok(Object.keys(D.roadmaps).length >= 3);
  for (const id of ["cybersecurity", "data-analysis", "ui-ux"]) assert.ok(D.roadmaps[id].stages.length >= 4, id);
  assert.equal(D.quiz.length, 10);
  const js = read("sims.js");
  for (const s of ["phishing", "data", "uiux", "product"]) assert.match(js, new RegExp('id: "' + s + '"'));
  const app = read("app.js");
  for (const r of ["dashboard", "careers", "quiz", "roadmap", "sim", "portfolio", "\"p\""]) assert.ok(app.includes(r), "route " + r);
});

test("each asset is small for slow connections", () => {
  for (const f of SITE_FILES) assert.ok(fs.statSync(path.join(SITE, f)).size < 120000, f + " too big");
});
