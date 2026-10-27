/* CareerQuest client app: path router + views. State is loaded on the server and synced back through the API. */
import { CQ_DATA } from "../content/data";
import { SIMS } from "./sims";
import { createSync } from "./sync";

let started = false;
export function startApp({ state, user }) {
  if (started) return;
  started = true;
  const D = CQ_DATA;
  const USER = user || null;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const career = (id) => D.careers.find((c) => c.id === id);
  const sim = (id) => SIMS.find((s) => s.id === id);
  const cat = (id) => D.categories.find((c) => c.id === id);
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (c ^ (Math.random() * 16) >> (c / 4)).toString(16)));

  /* ---------- state ---------- */
  const blank = () => ({ profile: null, explored: [], quiz: null, roadmap: {}, sims: {}, portfolio: [], seenBadges: [] });
  let S = Object.assign(blank(), state || {});
  const sync = createSync(() => S, (msg) => toast(esc(msg)), !!USER);
  const save = () => { sync.flush(); checkBadges(); };

  /* ---------- icons ---------- */
  const I = {
    home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.5 9.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 15h9"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    folder: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 6l3 3"/>',
    code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
    mega: '<path d="M3 10v4h3l7 4V6L6 10z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'
  };
  const ic = (n, cls) => `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ""}</svg>`;

  /* ---------- derived progress ---------- */
  function roadmapItems(cid) { const r = D.roadmaps[cid]; return r ? r.stages.flatMap((s) => s.items) : []; }
  function itemDone(cid, it) { return !!((S.roadmap[cid] || {})[it.id]) || (it.sim && S.sims[it.sim]); }
  function roadmapPct(cid) { const its = roadmapItems(cid); if (!its.length) return 0; return Math.round((its.filter((it) => itemDone(cid, it)).length / its.length) * 100); }
  function stageDone(cid, st) { return st.items.every((it) => itemDone(cid, it)); }
  function skills() {
    const m = {};
    Object.keys(S.sims).forEach((id) => { const s = sim(id); if (s) s.skills.forEach((k) => { m[k] = (m[k] || 0) + 1; }); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }
  function focusCareers() {
    const f = [];
    const add = (id) => { if (id && career(id) && !f.includes(id)) f.push(id); };
    ((S.profile && S.profile.interests) || []).forEach(add);
    ((S.quiz && S.quiz.top) || []).forEach(add);
    S.explored.forEach(add);
    return f;
  }

  const BADGES = [
    { id: "welcome", name: "Quest begun", desc: "Created your profile", icon: "star", test: () => !!S.profile },
    { id: "quiz", name: "Know thyself", desc: "Finished the interest quiz", icon: "compass", test: () => !!S.quiz },
    { id: "explorer", name: "Explorer", desc: "Explored 3 career profiles", icon: "map", test: () => S.explored.length >= 3 },
    { id: "first-sim", name: "First mission", desc: "Completed a simulation", icon: "flask", test: () => Object.keys(S.sims).length >= 1 },
    { id: "phish", name: "Phish hunter", desc: "80%+ on Phishing Investigation", icon: "shield", test: () => (S.sims.phishing || {}).best >= 80 },
    { id: "data", name: "Data detective", desc: "80%+ on Canteen Sales Analysis", icon: "chart", test: () => (S.sims.data || {}).best >= 80 },
    { id: "ux", name: "Eagle eye", desc: "80%+ on Usability Audit", icon: "pen", test: () => (S.sims.uiux || {}).best >= 80 },
    { id: "poly", name: "Range", desc: "Simulations in 3 different careers", icon: "compass", test: () => new Set(Object.keys(S.sims).map((id) => (sim(id) || {}).career)).size >= 3 },
    { id: "stage", name: "Milestone", desc: "Completed a full roadmap stage", icon: "check", test: () => Object.keys(D.roadmaps).some((cid) => D.roadmaps[cid].stages.some((st) => stageDone(cid, st))) },
    { id: "half", name: "Halfway there", desc: "50% of any roadmap", icon: "map", test: () => Object.keys(D.roadmaps).some((cid) => roadmapPct(cid) >= 50) },
    { id: "folio", name: "Builder", desc: "Added your own project to the portfolio", icon: "folder", test: () => S.portfolio.some((p) => p.source === "manual") },
    { id: "public", name: "Going public", desc: "Made a portfolio item public", icon: "share", test: () => S.portfolio.some((p) => p.public) }
  ];
  function checkBadges() {
    const now = BADGES.filter((b) => b.test()).map((b) => b.id);
    const fresh = now.filter((id) => !S.seenBadges.includes(id));
    if (fresh.length) {
      S.seenBadges = S.seenBadges.concat(fresh);
      sync.flush();
      if (S.profile && fresh.some((id) => id !== "welcome")) { const b = BADGES.find((x) => x.id === fresh[fresh.length - 1]); toast(`🏅 Badge unlocked: <b>${b.name}</b>`); }
    }
  }

  /* ---------- recommendation engine (rule-based) ---------- */
  function recommendations() {
    const out = [];
    const goals = (S.profile && S.profile.goals) || [];
    const focus = focusCareers();
    if (!S.quiz && focus.length < 2) out.push({ t: "Take the interest quiz", d: "10 quick questions to find careers worth exploring. Two minutes.", href: "/quiz", cta: "Start quiz", icon: "compass" });
    for (const cid of focus) {
      const c = career(cid);
      if (!S.explored.includes(cid)) { out.push({ t: `Read the ${c.name} profile`, d: "See what the job really involves before going deeper.", href: `/career/${cid}`, cta: "Open profile", icon: "map" }); continue; }
      if (c.sim && !S.sims[c.sim]) { out.push({ t: `Try it: ${sim(c.sim).title}`, d: `A ${sim(c.sim).mins}-minute taste of real ${c.name.toLowerCase()} work.`, href: `/sim/${c.sim}`, cta: "Start simulation", icon: "flask" }); continue; }
      if (D.roadmaps[cid] && roadmapPct(cid) < 100) {
        const items = roadmapItems(cid); const next = items.find((it) => !itemDone(cid, it));
        const prefer = goals.includes("internship") ? items.slice(-3).find((it) => !itemDone(cid, it)) : null;
        const it = roadmapPct(cid) >= 40 && prefer ? prefer : next;
        out.push({ t: `Next on your ${c.name} roadmap`, d: it.t, href: `/roadmap/${cid}`, cta: "Open roadmap", icon: "map" });
      }
    }
    const simDone = Object.keys(S.sims).length;
    if (simDone && !S.portfolio.some((p) => p.public)) out.push({ t: "Make one project public", d: "Pick your best simulation write-up and share your portfolio link.", href: "/portfolio", cta: "Open portfolio", icon: "share" });
    if (simDone && !S.portfolio.some((p) => p.source === "manual")) out.push({ t: "Add a real project", d: "Something you built, designed or analysed outside CareerQuest counts too.", href: "/portfolio?add=1", cta: "Add project", icon: "folder" });
    const unexplored = D.careers.find((c) => !S.explored.includes(c.id) && c.sim && !focus.includes(c.id)) || D.careers.find((c) => !S.explored.includes(c.id));
    if (unexplored) out.push({ t: `Explore something different: ${unexplored.name}`, d: "Trying a few paths before committing is the smart move.", href: `/career/${unexplored.id}`, cta: "Take a look", icon: "compass" });
    if (!out.length) out.push({ t: "You've done it all", d: "Polish your portfolio and start applying. You've got evidence now.", href: "/portfolio", cta: "Portfolio", icon: "star" });
    return out;
  }

  /* ---------- UI helpers ---------- */
  let toastT;
  function toast(html) {
    const t = $("#toast"); t.innerHTML = html; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3200);
  }
  const bar = (pct, color) => `<div class="meter" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%;${color ? `background:${color}` : ""}"></span></div>`;
  const ring = (pct, label) => `<div class="ring" style="--p:${pct}" role="img" aria-label="${label || pct + "%"}"><span>${pct}<small>%</small></span></div>`;
  const pill = (t, cls) => `<span class="pill ${cls || ""}">${t}</span>`;
  function careerCard(c) {
    const s = c.sim && sim(c.sim);
    return `<a class="ccard" href="/career/${c.id}" style="--c:${c.color}">
      <span class="ccard-ic">${ic(cat(c.cat).icon)}</span>
      <span class="ccard-cat">${cat(c.cat).name}</span>
      <b class="ccard-n">${c.name}</b>
      <span class="ccard-t">${c.tagline}</span>
      <span class="ccard-tags">${c.roadmap ? pill("Roadmap") : ""}${s ? pill("Simulation") : ""}${S.explored.includes(c.id) ? pill("✓ Explored", "ok") : ""}</span>
    </a>`;
  }

  /* ---------- views ---------- */
  function vLanding() {
    return `<section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">For university students</p>
        <h1>Try a career <span class="hl">before</span> you choose it.</h1>
        <p class="lead">Explore real careers, do hands-on workplace simulations, follow step-by-step roadmaps and build a portfolio that proves what you can do.</p>
        <div class="cta-row"><a class="btn big" href="${USER ? "/start" : "/signup"}">Start exploring, it's free ${ic("arrow")}</a><a class="btn ghost big" href="/careers">Browse careers</a></div>
        <p class="muted small">Free account. Your progress syncs across your devices.</p>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="mock m1"><span class="mk-eyebrow">Mission · Cybersecurity</span><b>Spot the phishing email</b><span class="mk-line"><i class="flag">kora-mfb-support.com</i></span><span class="mk-line">Reply-To: <i class="flag">…@gmail.com</i></span><span class="mk-line"><i class="flag">URGENT: 2 hours</i></span></div>
        <div class="mock m2"><span class="mk-eyebrow">Roadmap · Data Analyst</span><div class="mk-steps"><span class="on">✓</span><span class="on">✓</span><span class="now">3</span><span>4</span><span>5</span></div><div class="meter"><span style="width:46%"></span></div></div>
        <div class="mock m3">🏅 <b>Phish hunter</b><span>Badge unlocked</span></div>
      </div>
    </section>
    <section class="feat-grid">
      ${[["compass", "Discover", "10 careers explained simply: what they do, skills, tools and how to start."], ["flask", "Practise", "Browser simulations of real tasks, with hints and instant feedback."], ["map", "Follow a roadmap", "Stage-by-stage plans you can tick off, from first steps to job-ready."], ["folder", "Prove it", "Turn completed work into a portfolio you can share with employers."]]
        .map(([i, t, d]) => `<div class="feat"><span class="feat-ic">${ic(i)}</span><h3>${t}</h3><p>${d}</p></div>`).join("")}
    </section>
    <section class="how card">
      <h2>How it works</h2>
      <ol class="how-steps"><li><b>Tell us a little</b><span>Your course and goals. 30 seconds.</span></li><li><b>Explore or take the quiz</b><span>Find careers worth a closer look.</span></li><li><b>Do a mission</b><span>Experience the real work, learn from mistakes.</span></li><li><b>Build your proof</b><span>Roadmap progress and a portfolio you can share.</span></li></ol>
      <p class="muted">Changing your mind is part of it. Explore as many paths as you like.</p>
      <a class="btn" href="${USER ? "/start" : "/signup"}">Create my profile ${ic("arrow")}</a>
    </section>`;
  }

  const GOALS = [["discover", "Find a career that fits me"], ["start", "Get started in a career I chose"], ["practice", "Get hands-on experience"], ["internship", "Prepare for internships / SIWES"], ["portfolio", "Build a portfolio"]];
  function vStart() {
    const p = S.profile || { name: USER ? USER.name : "" };
    return `<section class="narrow">
      <h1>Let's set up your quest</h1>
      <p class="muted">Just the basics. Saved to your account, so it follows you to any device.</p>
      <form id="onb" class="card form" novalidate>
        <fieldset><legend>About you</legend>
          <label>First name <input name="name" required autocomplete="given-name" value="${esc(p.name)}" placeholder="e.g. Bunmi"></label>
          <label>University <input name="uni" autocomplete="organization" value="${esc(p.uni)}" placeholder="e.g. FUTA"></label>
          <div class="two"><label>Course <input name="course" value="${esc(p.course)}" placeholder="e.g. Software Engineering"></label>
          <label>Level <select name="level">${["100", "200", "300", "400", "500", "Graduate"].map((l) => `<option ${p.level === l ? "selected" : ""}>${l}</option>`).join("")}</select></label></div>
        </fieldset>
        <fieldset><legend>What do you want from CareerQuest?</legend><div class="chips">
          ${GOALS.map(([v, t]) => `<label class="chip"><input type="checkbox" name="goals" value="${v}" ${(p.goals || []).includes(v) ? "checked" : ""}><span>${t}</span></label>`).join("")}</div></fieldset>
        <fieldset><legend>Any careers you're curious about? <span class="muted">(optional)</span></legend><div class="chips">
          ${D.careers.map((c) => `<label class="chip"><input type="checkbox" name="interests" value="${c.id}" ${(p.interests || []).includes(c.id) ? "checked" : ""}><span>${c.name}</span></label>`).join("")}</div>
          <p class="muted small">Not sure yet? Leave it blank and take the quiz next.</p></fieldset>
        <p class="form-err" id="onbErr" role="alert"></p>
        <button class="btn big" type="submit">${S.profile ? "Save profile" : "Start my quest"} ${ic("arrow")}</button>
      </form></section>`;
  }
  function bindStart() {
    $("#onb").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = String(f.get("name") || "").trim();
      if (!name) { $("#onbErr").textContent = "Add your first name so we know what to call you."; e.target.name.focus(); return; }
      const first = !S.profile;
      S.profile = { name, uni: String(f.get("uni") || "").trim(), course: String(f.get("course") || "").trim(), level: f.get("level"), goals: f.getAll("goals"), interests: f.getAll("interests"), created: (S.profile && S.profile.created) || Date.now() };
      save();
      if (first) toast(`Welcome, <b>${esc(name)}</b>! 🎉`);
      go(first && !S.profile.interests.length ? "/quiz" : "/dashboard");
    });
  }

  function vDashboard() {
    if (!S.profile) { setTimeout(() => go("/start", true)); return ""; }
    const recs = recommendations(); const r0 = recs[0];
    const sk = skills(); const simIds = Object.keys(S.sims);
    const roadIds = Object.keys(D.roadmaps);
    const started = roadIds.filter((cid) => roadmapPct(cid) > 0 || focusCareers().includes(cid));
    const shown = started.length ? started : roadIds.slice(0, 3);
    const earned = BADGES.filter((b) => b.test());
    const doneItems = roadIds.reduce((n, cid) => n + roadmapItems(cid).filter((it) => itemDone(cid, it)).length, 0);
    return `<section class="dash-head">
        <div><p class="eyebrow">${esc(S.profile.course || "Student")}${S.profile.uni ? " · " + esc(S.profile.uni) : ""}</p><h1>Hey ${esc(S.profile.name)} 👋</h1></div>
      </section>
      <a class="next-card" href="${r0.href}"><span class="next-ic">${ic(r0.icon)}</span><span class="next-body"><span class="eyebrow">Recommended next step</span><b>${r0.t}</b><span>${esc(r0.d)}</span></span><span class="btn">${r0.cta} ${ic("arrow")}</span></a>
      ${recs.length > 1 ? `<div class="also"><span class="muted small">Also good:</span> ${recs.slice(1, 3).map((r) => `<a href="${r.href}">${r.t}</a>`).join(" · ")}</div>` : ""}
      <section class="stats">
        <div class="stat"><b>${S.explored.length}<small>/${D.careers.length}</small></b><span>Careers explored</span></div>
        <div class="stat"><b>${simIds.length}<small>/${SIMS.length}</small></b><span>Simulations done</span></div>
        <div class="stat"><b>${doneItems}</b><span>Roadmap steps</span></div>
        <div class="stat"><b>${S.portfolio.length}</b><span>Portfolio items</span></div>
      </section>
      <div class="dash-grid">
        <section class="card"><div class="sec-h"><h2>Your roadmaps</h2><a href="/roadmaps">All</a></div>
          ${shown.map((cid) => { const c = career(cid); const p = roadmapPct(cid); return `<a class="rm-row" href="/roadmap/${cid}"><span class="rm-n"><b>${c.name}</b><span>${p}%</span></span>${bar(p, c.color)}</a>`; }).join("")}
        </section>
        <section class="card"><div class="sec-h"><h2>Completed challenges</h2><a href="/challenges">All</a></div>
          ${simIds.length ? `<ul class="done-list">${simIds.map((id) => { const s = sim(id); const r = S.sims[id]; return s ? `<li><a href="/sim/${id}"><b>${s.title}</b><span>${career(s.career).name}</span></a>${pill(r.best + "%", r.best >= 80 ? "ok" : "")}</li>` : ""; }).join("")}</ul>` : `<p class="empty">No simulations yet. <a href="/challenges">Try your first one</a>; they take about 5 minutes.</p>`}
        </section>
        <section class="card"><div class="sec-h"><h2>Skills practised</h2></div>
          ${sk.length ? `<div class="skill-cloud">${sk.map(([k, n]) => `<span class="skill">${esc(k)}${n > 1 ? ` <b>×${n}</b>` : ""}</span>`).join("")}</div><p class="muted small">Based on simulations you've completed here, not a claim of professional competence.</p>` : `<p class="empty">Skills appear here as you complete simulations.</p>`}
        </section>
        <section class="card"><div class="sec-h"><h2>Badges</h2><span class="muted small">${earned.length}/${BADGES.length}</span></div>
          <div class="badges">${BADGES.map((b) => { const on = b.test(); return `<div class="badge ${on ? "on" : ""}" title="${b.desc}"><span>${ic(on ? b.icon : "lock")}</span><b>${b.name}</b><small>${b.desc}</small></div>`; }).join("")}</div>
        </section>
      </div>`;
  }

  let catFilter = "all", query = "";
  function vCareers() {
    return `<section class="page-head"><h1>Explore careers</h1><p class="muted">Ten paths, explained plainly. Tap one to see what the work is really like.</p></section>
      <div class="filters">
        <label class="search">${ic("compass")}<span class="sr">Search careers</span><input id="q" type="search" placeholder="Search: ‘design’, ‘SQL’, ‘security’…" value="${esc(query)}"></label>
        <div class="chips scroll" role="group" aria-label="Filter by category">
          <button type="button" class="chip-btn ${catFilter === "all" ? "on" : ""}" data-cat="all" aria-pressed="${catFilter === "all"}">All</button>
          ${D.categories.map((c) => `<button type="button" class="chip-btn ${catFilter === c.id ? "on" : ""}" data-cat="${c.id}" aria-pressed="${catFilter === c.id}">${c.name}</button>`).join("")}
        </div>
      </div>
      <p class="muted small" id="count" aria-live="polite"></p>
      <div class="cgrid" id="cgrid"></div>
      <a class="quiz-banner" href="/quiz"><b>Not sure where to start?</b><span>Take the 2-minute interest quiz →</span></a>`;
  }
  function bindCareers() {
    const draw = () => {
      const q = query.trim().toLowerCase();
      const list = D.careers.filter((c) => (catFilter === "all" || c.cat === catFilter) && (!q || [c.name, c.tagline, c.what, cat(c.cat).name, ...c.skills, ...c.tools, ...c.entry].join(" ").toLowerCase().includes(q)));
      $("#cgrid").innerHTML = list.map(careerCard).join("") || `<p class="empty">No careers match “${esc(query)}”. Try another word.</p>`;
      $("#count").textContent = `${list.length} career${list.length === 1 ? "" : "s"}`;
    };
    $("#q").addEventListener("input", (e) => { query = e.target.value; draw(); });
    $$("[data-cat]").forEach((b) => b.addEventListener("click", () => { catFilter = b.dataset.cat; $$("[data-cat]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b); }); draw(); }));
    draw();
  }

  function vCareer(id) {
    const c = career(id); if (!c) return vNotFound();
    if (!S.explored.includes(id)) { S.explored.push(id); save(); }
    const s = c.sim && sim(c.sim);
    const inFocus = S.profile && (S.profile.interests || []).includes(id);
    const list = (arr) => `<ul class="ticks">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
    return `<section class="c-hero" style="--c:${c.color}">
        <a class="back" href="/careers">‹ All careers</a>
        <span class="ccard-cat">${cat(c.cat).name}</span>
        <h1>${c.name}</h1><p class="lead">${c.tagline}</p>
        <div class="cta-row">
          ${c.roadmap ? `<a class="btn" href="/roadmap/${c.id}">${ic("map")} Roadmap · ${roadmapPct(c.id)}%</a>` : ""}
          ${s ? `<a class="btn ${c.roadmap ? "alt" : ""}" href="/sim/${s.id}">${ic("flask")} Try: ${s.title}</a>` : ""}
          ${S.profile ? `<button type="button" class="btn ghost" id="focusBtn" aria-pressed="${!!inFocus}">${inFocus ? "★ In my focus" : "☆ Add to my focus"}</button>` : ""}
        </div>
      </section>
      <div class="c-grid">
        <section class="card span2"><h2>What they do</h2><p>${esc(c.what)}</p></section>
        <section class="card"><h2>A typical week might include</h2>${list(c.day)}</section>
        <section class="card"><h2>Skills to build</h2>${list(c.skills)}</section>
        <section class="card"><h2>Tools</h2><div class="skill-cloud">${c.tools.map((t) => `<span class="skill">${esc(t)}</span>`).join("")}</div></section>
        <section class="card"><h2>Entry-level roles</h2>${list(c.entry)}</section>
        <section class="card span2"><h2>Where it can lead</h2><ol class="ladder">${c.path.map((p) => `<li>${esc(p)}</li>`).join("")}</ol></section>
        <section class="card"><h2>How to learn it</h2>${list(c.routes)}</section>
        <section class="card"><h2>Portfolio project ideas</h2>${list(c.projects)}</section>
        <section class="card span2"><h2>Certifications</h2>${list(c.certs)}<p class="muted small">Optional for most entry roles. Projects you can show usually matter more.</p></section>
      </div>
      <p class="muted center">Not feeling it? That's useful to know too. <a href="/careers">Explore another path</a>.</p>`;
  }
  function bindCareer(id) {
    const b = $("#focusBtn"); if (!b) return;
    b.addEventListener("click", () => {
      const arr = S.profile.interests || (S.profile.interests = []);
      const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id);
      save(); b.setAttribute("aria-pressed", i < 0); b.textContent = i < 0 ? "★ In my focus" : "☆ Add to my focus";
      toast(i < 0 ? "Added to your focus. Recommendations will follow it." : "Removed from your focus.");
    });
  }

  /* quiz */
  let qi = 0, answers = [];
  function vQuiz() {
    if (qi >= D.quiz.length) return vQuizResult();
    const q = D.quiz[qi];
    return `<section class="narrow quiz">
      <div class="quiz-top"><span class="muted small">Question ${qi + 1} of ${D.quiz.length}</span>${bar(Math.round((qi / D.quiz.length) * 100))}</div>
      <h1 class="q">${q.q}</h1>
      <div class="qopts">${q.o.map((o, i) => `<button type="button" class="qopt ${answers[qi] === i ? "sel" : ""}" data-i="${i}">${o.t}</button>`).join("")}</div>
      <div class="quiz-nav">${qi > 0 ? `<button type="button" class="btn ghost" id="qBack">‹ Back</button>` : `<span></span>`}<span class="muted small">There are no wrong answers.</span></div>
    </section>`;
  }
  function scoreQuiz() {
    const t = {};
    answers.forEach((a, i) => { const w = D.quiz[i].o[a].w; Object.keys(w).forEach((k) => (t[k] = (t[k] || 0) + w[k])); });
    const res = D.careers.map((c) => ({ id: c.id, s: c.traits.reduce((n, k) => n + (t[k] || 0), 0) })).sort((a, b) => b.s - a.s);
    const traits = Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return { res, traits };
  }
  const TRAIT_WORDS = { investigate: "investigating problems", systems: "how systems work", detail: "details", numbers: "numbers and data", create: "creating and designing", people: "understanding people", build: "building things", lead: "organising and leading" };
  function vQuizResult() {
    const { res, traits } = scoreQuiz();
    const top = res.slice(0, 3); const max = top[0].s || 1;
    if (!S.quiz || S.quiz.ts !== answers.join("")) { S.quiz = { top: top.map((r) => r.id), traits: traits.slice(0, 3), ts: answers.join(""), at: Date.now() }; save(); }
    return `<section class="narrow">
      <p class="eyebrow">Your results</p><h1>Careers worth exploring</h1>
      <p class="lead">You leaned toward <b>${traits.slice(0, 3).map((k) => TRAIT_WORDS[k]).join("</b>, <b>")}</b>.</p>
      <p class="note">This is a starting point, not a verdict. Interests change, and skills grow with practice. Try a simulation to see how the work actually feels.</p>
      <div class="results">${top.map((r, i) => { const c = career(r.id); const shared = c.traits.filter((k) => traits.slice(0, 4).includes(k)); return `<div class="result card" style="--c:${c.color}"><span class="rank-badge">${i + 1}</span><div><b>${c.name}</b><p class="small">${c.tagline}${shared.length ? ` Fits your interest in ${shared.map((k) => TRAIT_WORDS[k]).join(" and ")}.` : ""}</p>${bar(Math.round((r.s / max) * 100), c.color)}
        <div class="cta-row sm"><a class="btn sm" href="/career/${c.id}">Explore</a>${c.sim ? `<a class="btn ghost sm" href="/sim/${c.sim}">Try the simulation</a>` : ""}</div></div></div>`; }).join("")}</div>
      <div class="cta-row"><a class="btn" href="${S.profile ? "/dashboard" : "/start"}">${S.profile ? "Go to my dashboard" : "Save results: create profile"}</a><button type="button" class="btn ghost" id="retake">Retake quiz</button></div>
    </section>`;
  }
  function bindQuiz() {
    $$(".qopt").forEach((b) => b.addEventListener("click", () => { answers[qi] = +b.dataset.i; qi++; render(); }));
    const back = $("#qBack"); if (back) back.addEventListener("click", () => { qi--; render(); });
    const rt = $("#retake"); if (rt) rt.addEventListener("click", () => { qi = 0; answers = []; render(); });
  }

  /* roadmaps */
  function vRoadmaps() {
    return `<section class="page-head"><h1>Roadmaps</h1><p class="muted">Step-by-step plans from first steps to job-ready. Tick things off as you go.</p></section>
      <div class="cgrid">${Object.keys(D.roadmaps).map((cid) => { const c = career(cid); const p = roadmapPct(cid); const n = roadmapItems(cid).length; return `<a class="ccard" href="/roadmap/${cid}" style="--c:${c.color}"><span class="ccard-ic">${ic(cat(c.cat).icon)}</span><span class="ccard-cat">${D.roadmaps[cid].stages.length} stages · ${n} steps</span><b class="ccard-n">${c.name}</b><span class="ccard-t">${D.roadmaps[cid].intro}</span>${bar(p, c.color)}<span class="small muted">${p}% complete</span></a>`; }).join("")}</div>`;
  }
  const TYPE = { learn: "Learn", tool: "Tool", challenge: "Challenge", project: "Project", milestone: "Milestone" };
  function vRoadmap(cid) {
    const c = career(cid), r = D.roadmaps[cid]; if (!c || !r) return vNotFound();
    const p = roadmapPct(cid);
    const nextIdx = r.stages.findIndex((st) => !stageDone(cid, st));
    return `<section class="c-hero slim" style="--c:${c.color}">
        <a class="back" href="/roadmaps">‹ All roadmaps</a>
        <div class="rm-head"><div><span class="ccard-cat">Roadmap</span><h1>${c.name}</h1><p class="lead">${r.intro}</p></div>${ring(p, p + "% complete")}</div>
        <div class="cta-row"><a class="btn ghost sm" href="/career/${cid}">Career profile</a></div>
      </section>
      <ol class="timeline" style="--c:${c.color}">
        ${r.stages.map((st, si) => { const done = st.items.filter((it) => itemDone(cid, it)).length; const full = done === st.items.length; return `<li class="stage ${full ? "full" : ""} ${si === nextIdx ? "current" : ""}">
          <span class="stage-dot">${full ? ic("check") : si + 1}</span>
          <div class="stage-card card">
            <div class="stage-h"><div><b>${st.title}</b><span class="muted small"> · ${st.sub}</span></div><span class="small ${full ? "good" : "muted"}">${done}/${st.items.length}${si === nextIdx ? " · you are here" : ""}</span></div>
            <ul class="items">${st.items.map((it) => { const d = itemDone(cid, it); const auto = it.sim && S.sims[it.sim]; return `<li class="item ${d ? "done" : ""}">
              <label><input type="checkbox" data-it="${it.id}" ${d ? "checked" : ""} ${auto ? "disabled" : ""}><span class="box">${ic("check")}</span><span class="it-t">${esc(it.t)}</span></label>
              <span class="type t-${it.type}">${TYPE[it.type]}</span>
              ${it.sim ? `<a class="btn sm ${auto ? "ghost" : ""}" href="/sim/${it.sim}">${auto ? `Done · ${S.sims[it.sim].best}%` : "Start ›"}</a>` : ""}</li>`; }).join("")}</ul>
          </div></li>`; }).join("")}
      </ol>
      <p class="muted small center">Simulation steps tick themselves when you complete them. Other steps are yours to tick honestly.</p>`;
  }
  function bindRoadmap(cid) {
    $$("input[data-it]").forEach((cb) => cb.addEventListener("change", () => {
      const m = S.roadmap[cid] || (S.roadmap[cid] = {});
      const st = D.roadmaps[cid].stages.find((s) => s.items.some((i) => i.id === cb.dataset.it));
      const wasFull = stageDone(cid, st);
      if (cb.checked) m[cb.dataset.it] = Date.now(); else delete m[cb.dataset.it];
      save();
      const y = window.scrollY; render(); window.scrollTo(0, y);
      if (!wasFull && stageDone(cid, st)) toast(`Stage complete: <b>${esc(st.title)}</b> ✓`);
      const again = $(`input[data-it="${cb.dataset.it}"]`); again && again.focus();
    }));
  }

  /* simulations */
  function vChallenges() {
    return `<section class="page-head"><h1>Challenges</h1><p class="muted">Hands-on simulations of real workplace tasks. Mistakes are part of it; every one comes with feedback.</p></section>
      <div class="sgrid">${SIMS.map((s) => { const c = career(s.career); const r = S.sims[s.id]; return `<a class="scard" href="/sim/${s.id}" style="--c:${c.color}">
        <span class="scard-top"><span class="ccard-cat">${c.name}</span>${r ? pill(`Best ${r.best}%`, r.best >= 80 ? "ok" : "") : pill(`${s.mins} min`)}</span>
        <b>${s.title}</b><span class="small">${s.desc}</span>
        <span class="skill-cloud sm">${s.skills.map((k) => `<span class="skill">${k}</span>`).join("")}</span>
        <span class="scard-go">${r ? "Play again" : "Start"} ${ic("arrow")}</span></a>`; }).join("")}</div>`;
  }
  function vSim(id) {
    const s = sim(id); if (!s) return vNotFound();
    const c = career(s.career);
    return `<section class="c-hero slim" style="--c:${c.color}"><a class="back" href="/challenges">‹ Challenges</a>
      <span class="ccard-cat">${c.name} · ${s.level} · ~${s.mins} min</span><h1>${s.title}</h1><p class="lead">${s.desc}</p></section>
      <div id="simRoot" class="sim"></div><div id="simResult"></div>`;
  }
  function bindSim(id) {
    const s = sim(id);
    s.run($("#simRoot"), (res) => {
      const prev = S.sims[id];
      S.sims[id] = { best: Math.max(res.score, prev ? prev.best : 0), last: res.score, attempts: (prev ? prev.attempts : 0) + 1, at: Date.now() };
      sync.simAttempt({ simId: id, score: res.score, summary: res.summary, skills: s.skills });
      let item = S.portfolio.find((p) => p.source === "sim:" + id);
      const c = career(s.career);
      if (!item) { item = { id: uid(), source: "sim:" + id, public: false, created: Date.now() }; S.portfolio.unshift(item); }
      Object.assign(item, res.portfolio, { skills: s.skills.join(", "), link: "", evidence: `Completed in CareerQuest · score ${S.sims[id].best}%`, career: c.name, updated: Date.now() });
      save();
      const pass = res.score >= 60;
      $("#simRoot").hidden = true;
      $("#simResult").innerHTML = `<section class="result-card card" tabindex="-1" id="resCard">
        <div class="res-top">${ring(res.score, "Score " + res.score + "%")}<div><p class="eyebrow">${pass ? "Mission complete" : "Mission complete: room to grow"}</p><h2>${res.score >= 80 ? "Excellent work! 🎉" : pass ? "Solid effort 💪" : "Good first try"}</h2><p>${esc(res.summary)}</p></div></div>
        <div class="res-skills"><span class="eyebrow">Skills practised</span><div class="skill-cloud">${s.skills.map((k) => `<span class="skill">${k}</span>`).join("")}</div></div>
        <div class="res-details">${res.details}</div>
        <div class="folio-added"><b>${ic("folder")} Added to your portfolio</b><span class="small">Saved as a private draft. Edit the write-up or make it public anytime.</span>
          <label class="switch"><input type="checkbox" id="pubNow" ${item.public ? "checked" : ""}><span class="sw"></span><span>Show on my public portfolio</span></label></div>
        <div class="cta-row"><button type="button" class="btn" id="again">Try again</button><a class="btn ghost" href="/portfolio">Edit in portfolio</a><a class="btn ghost" href="${S.profile ? "/dashboard" : "/start"}">${S.profile ? "Dashboard" : "Save progress: create profile"}</a></div>
      </section>`;
      $("#pubNow").addEventListener("change", (e) => { item.public = e.target.checked; save(); toast(item.public ? "Now public on your portfolio" : "Now private"); });
      $("#again").addEventListener("click", () => render());
      const rc = $("#resCard"); rc.scrollIntoView({ behavior: "smooth", block: "start" }); rc.focus({ preventScroll: true });
    });
  }

  /* portfolio */
  function shareLink() { return location.origin + "/p/" + (USER ? USER.username : ""); }
  let editing = null;
  function vPortfolio(params) {
    if (params.get("add") === "1" && editing === null) editing = "new";
    const pub = S.portfolio.filter((p) => p.public).length;
    const form = (it) => `<form class="card form pf-form" id="pfForm" novalidate>
      <h2>${it.id ? "Edit project" : "Add a project"}</h2>
      <label>Title <input name="title" required value="${esc(it.title)}" placeholder="e.g. Hostel laundry booking app"></label>
      <label>The problem <textarea name="problem" rows="2" placeholder="What needed solving, and for whom?">${esc(it.problem)}</textarea></label>
      <label>Your approach <textarea name="approach" rows="3" placeholder="What you did, the tools you used, what you learned">${esc(it.approach)}</textarea></label>
      <label>Skills shown <input name="skills" value="${esc(it.skills)}" placeholder="Comma separated: Figma, user research"></label>
      <label>Evidence link <input name="link" type="url" inputmode="url" value="${esc(it.link)}" placeholder="https://github.com/… or a Figma / Drive link"></label>
      <label class="switch"><input type="checkbox" name="public" ${it.public ? "checked" : ""}><span class="sw"></span><span>Public</span></label>
      <p class="form-err" id="pfErr" role="alert"></p>
      <div class="cta-row"><button class="btn" type="submit">Save project</button><button class="btn ghost" type="button" id="pfCancel">Cancel</button></div></form>`;
    const editItem = editing === "new" ? { public: false } : S.portfolio.find((p) => p.id === editing);
    return `<section class="page-head row"><div><h1>Portfolio</h1><p class="muted">Your evidence. Choose what the world sees.</p></div>${editing ? "" : `<button type="button" class="btn" id="addBtn">+ Add project</button>`}</section>
      ${editItem ? form(editItem) : ""}
      <section class="card share">
        <div><b>${ic("share")} Public portfolio</b><span class="small muted">${pub} public item${pub === 1 ? "" : "s"}. Anyone with your link sees your public items, always up to date.</span></div>
        ${S.profile ? `<div class="cta-row sm"><button type="button" class="btn sm" id="copyLink" ${pub ? "" : "disabled"}>Copy share link</button><a class="btn ghost sm" id="viewPub" href="/p/${USER ? USER.username : ""}" target="_blank" rel="noopener">View public page ↗</a></div>` : `<a class="btn sm" href="/start">Create profile to share</a>`}
      </section>
      ${S.portfolio.length ? `<div class="pf-list">${S.portfolio.map((p) => `<article class="pf card ${p.public ? "is-pub" : ""}">
          <div class="pf-h"><div>${p.career ? `<span class="ccard-cat">${esc(p.career)}</span>` : ""}<h3>${esc(p.title || "Untitled")}</h3></div>
          <label class="switch sm"><input type="checkbox" data-pub="${p.id}" ${p.public ? "checked" : ""}><span class="sw"></span><span>${p.public ? "Public" : "Private"}</span></label></div>
          ${p.problem ? `<p><b>Problem.</b> ${esc(p.problem)}</p>` : ""}${p.approach ? `<p><b>Approach.</b> ${esc(p.approach)}</p>` : ""}
          ${p.skills ? `<div class="skill-cloud sm">${String(p.skills).split(",").map((k) => k.trim()).filter(Boolean).map((k) => `<span class="skill">${esc(k)}</span>`).join("")}</div>` : ""}
          <div class="pf-f">${p.evidence ? `<span class="small muted">${esc(p.evidence)}</span>` : ""}${p.link ? `<a class="small" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">Evidence ↗</a>` : ""}
          <span class="pf-act"><button type="button" class="link" data-edit="${p.id}">Edit</button><button type="button" class="link danger" data-del="${p.id}">Delete</button></span></div>
        </article>`).join("")}</div>`
        : `<div class="empty card"><p><b>Nothing here yet.</b></p><p class="small">Complete a <a href="/challenges">simulation</a> and it lands here automatically, or add your own project.</p></div>`}`;
  }
  function bindPortfolio() {
    const add = $("#addBtn"); if (add) add.addEventListener("click", () => { editing = "new"; render(); $("#pfForm input").focus(); });
    const f = $("#pfForm");
    if (f) {
      $("#pfCancel").addEventListener("click", () => { editing = null; if (location.search.includes("add=1")) go("/portfolio", true); else render(); });
      f.addEventListener("submit", (e) => {
        e.preventDefault(); const d = new FormData(f);
        const title = String(d.get("title") || "").trim(); const link = String(d.get("link") || "").trim();
        if (!title) { $("#pfErr").textContent = "Give your project a title."; f.title.focus(); return; }
        if (link && !/^https?:\/\/\S+\.\S+/.test(link)) { $("#pfErr").textContent = "Evidence link should start with https://"; f.link.focus(); return; }
        let it = editing === "new" ? null : S.portfolio.find((p) => p.id === editing);
        if (!it) { it = { id: uid(), source: "manual", created: Date.now() }; S.portfolio.unshift(it); }
        Object.assign(it, { title, problem: String(d.get("problem") || "").trim(), approach: String(d.get("approach") || "").trim(), skills: String(d.get("skills") || "").trim(), link, public: !!d.get("public"), updated: Date.now() });
        editing = null; save(); toast("Project saved");
        if (location.search.includes("add=1")) go("/portfolio", true); else render();
      });
    }
    $$("[data-pub]").forEach((cb) => cb.addEventListener("change", () => { const it = S.portfolio.find((p) => p.id === cb.dataset.pub); it.public = cb.checked; save(); render(); }));
    $$("[data-edit]").forEach((b) => b.addEventListener("click", () => { editing = b.dataset.edit; render(); window.scrollTo(0, 0); }));
    $$("[data-del]").forEach((b) => b.addEventListener("click", () => { if (confirm("Delete this project? This can't be undone.")) { S.portfolio = S.portfolio.filter((p) => p.id !== b.dataset.del); save(); render(); } }));
    const cp = $("#copyLink");
    if (cp) cp.addEventListener("click", async () => {
      const url = shareLink();
      try { await navigator.clipboard.writeText(url); toast("Share link copied ✓"); }
      catch (e) { prompt("Copy your share link:", url); }
    });
  }
  function vProfile() {
    if (!S.profile) { setTimeout(() => go("/start", true)); return ""; }
    return vStart() + `<section class="narrow"><div class="card"><h2>Account</h2><p class="small muted">Signed in as <b>${esc(USER.email)}</b> · public page <a href="/p/${esc(USER.username)}" target="_blank" rel="noopener">/p/${esc(USER.username)}</a></p><button type="button" class="btn ghost" id="logout">Log out</button></div><div class="card danger-zone"><h2>Start over</h2><p class="small muted">Deletes your profile answers, quiz, roadmap progress, simulation history, badges and portfolio. Your account stays.</p><button type="button" class="btn danger" id="reset">Reset everything</button></div></section>`;
  }
  function bindProfile() { bindStart(); const r = $("#reset"); r && r.addEventListener("click", async () => {
      if (!confirm("Delete all your CareerQuest progress? Your account stays.")) return;
      await sync.settled();
      const res = await fetch("/api/state", { method: "DELETE" });
      if (res.ok) location.assign("/start"); else toast("Couldn't reset right now. Try again.");
    });
    const lo = $("#logout");
    lo && lo.addEventListener("click", async () => { await sync.settled(); await fetch("/api/auth/logout", { method: "POST" }); location.assign("/"); });
  }

  function vNotFound() { return `<section class="narrow center"><h1>Lost the trail</h1><p class="muted">That page doesn't exist.</p><a class="btn" href="/">Go home</a></section>`; }

  /* ---------- router ---------- */
  const TABS = [["dashboard", "Home", "home"], ["careers", "Careers", "compass"], ["challenges", "Challenges", "flask"], ["roadmaps", "Roadmaps", "map"], ["portfolio", "Portfolio", "folder"]];
  function chrome(active, isPublic) {
    const tabs = TABS.map(([r, t, i]) => `<a href="/${r}" class="${active === r ? "on" : ""}" ${active === r ? 'aria-current="page"' : ""}>${ic(i)}<span>${t}</span></a>`).join("");
    $("#topnav").innerHTML = isPublic ? "" : tabs;
    $("#tabbar").innerHTML = isPublic ? "" : tabs;
    $("#tabbar").hidden = isPublic;
    $("#me").innerHTML = USER
      ? `<a class="avatar" href="/me" aria-label="Your profile">${esc(((S.profile && S.profile.name) || USER.name || "?")[0].toUpperCase())}</a>`
      : `<a class="btn ghost sm" href="/login">Log in</a> <a class="btn sm" href="/signup">Sign up</a>`;
  }
  const SPA_ROUTES = new Set(["", "dashboard", "start", "me", "careers", "career", "quiz", "roadmaps", "roadmap", "challenges", "sim", "portfolio"]);
  const PROTECTED = new Set(["dashboard", "start", "me", "quiz", "roadmaps", "roadmap", "challenges", "sim", "portfolio"]);
  let lastRoute = "";
  function render() {
    const path = location.pathname.replace(/^\/+|\/+$/g, "");
    const params = new URLSearchParams(location.search);
    const [r, arg] = path.split("/");
    if (!USER && PROTECTED.has(r)) { location.assign("/login?next=" + encodeURIComponent(location.pathname + location.search)); return; }
    const main = $("#main");
    let html = "", bind = null, active = r || "dashboard";
    if (r !== "portfolio") editing = null;
    if (r !== "quiz" && lastRoute === "quiz" && qi >= D.quiz.length) { qi = 0; answers = []; }
    switch (r || "") {
      case "": if (USER && !S.profile) { setTimeout(() => go("/start", true)); html = ""; } else html = S.profile ? vDashboard() : vLanding(); active = S.profile ? "dashboard" : ""; break;
      case "dashboard": html = vDashboard(); if (!S.profile) active = ""; break;
      case "start": html = vStart(); bind = bindStart; active = ""; break;
      case "me": html = vProfile(); bind = bindProfile; active = ""; break;
      case "careers": html = vCareers(); bind = bindCareers; break;
      case "career": html = vCareer(arg); bind = () => bindCareer(arg); active = "careers"; break;
      case "quiz": html = vQuiz(); bind = bindQuiz; active = "careers"; break;
      case "roadmaps": html = vRoadmaps(); break;
      case "roadmap": html = vRoadmap(arg); bind = () => bindRoadmap(arg); active = "roadmaps"; break;
      case "challenges": html = vChallenges(); break;
      case "sim": html = vSim(arg); bind = () => bindSim(arg); active = "challenges"; break;
      case "portfolio": html = vPortfolio(params); bind = bindPortfolio; break;
      default: html = vNotFound();
    }
    chrome(active, false);
    main.innerHTML = html;
    if (bind && main.firstElementChild) bind();
    const routeKey = r + "/" + (arg || "");
    if (routeKey !== lastRoute) {
      window.scrollTo(0, 0);
      const h = $("h1", main); if (h && lastRoute) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
      document.title = (h ? h.textContent.replace(/\s+/g, " ").trim() + " · " : "") + "CareerQuest";
    }
    lastRoute = r === "quiz" ? "quiz" : routeKey;
  }
  /* ---------- client-side navigation ---------- */
  function go(href, replace) { history[replace ? "replaceState" : "pushState"](history.state, "", href); render(); }
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !SPA_ROUTES.has(url.pathname.split("/")[1] || "")) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    e.preventDefault();
    go(url.pathname + url.search);
  });
  window.addEventListener("popstate", render);
  window.CareerQuest = { pendingSaves: () => sync.pending(), saved: () => sync.settled() }; // handy for debugging and e2e tests
  render();
  checkBadges();
}
