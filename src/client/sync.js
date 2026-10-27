/*
 * Optimistic sync: the UI mutates the in-memory state instantly, then flush() diffs it
 * against the last synced snapshot and sends only what changed to the API, in order.
 */
const clone = (o) => JSON.parse(JSON.stringify(o));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const PF_FIELDS = ["id", "source", "title", "problem", "approach", "skills", "link", "evidence", "career", "public"];
const pick = (p) => Object.fromEntries(PF_FIELDS.map((k) => [k, k === "public" ? !!p[k] : p[k] == null ? "" : p[k]]));

export function createSync(getState, onError, enabled) {
  let snap = clone(getState());
  let chain = Promise.resolve();
  let pending = 0;

  async function request(method, url, body, attempt = 0) {
    try {
      const res = await fetch(url, {
        method, credentials: "same-origin",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) return;
      if (res.status === 401) { onError("You've been logged out. Log in again to keep saving."); return; }
      if (res.status >= 500 && attempt < 2) { await sleep(700 * (attempt + 1)); return request(method, url, body, attempt + 1); }
      const j = await res.json().catch(() => ({}));
      onError(j.error || "Couldn't save that change.");
    } catch (e) {
      if (attempt < 2) { await sleep(900 * (attempt + 1)); return request(method, url, body, attempt + 1); }
      onError("You're offline, so that change didn't save. Check your connection.");
    }
  }
  function send(method, url, body) {
    pending++;
    chain = chain.then(() => request(method, url, body)).finally(() => { pending--; });
  }

  function flush() {
    if (!enabled) return;
    const S = getState(), prev = snap;
    if (S.profile && !same(S.profile, prev.profile)) send("PUT", "/api/profile", { profile: S.profile, explored: S.explored });
    else if (!same(S.explored, prev.explored)) send("PUT", "/api/profile", { explored: S.explored });
    if (S.quiz && !same(S.quiz, prev.quiz)) send("PUT", "/api/quiz", { quiz: S.quiz });

    const cids = new Set([...Object.keys(S.roadmap || {}), ...Object.keys(prev.roadmap || {})]);
    for (const careerId of cids) {
      const now = S.roadmap[careerId] || {}, before = prev.roadmap[careerId] || {};
      for (const itemId of new Set([...Object.keys(now), ...Object.keys(before)])) {
        if (!!now[itemId] !== !!before[itemId]) send("PUT", "/api/progress", { careerId, itemId, done: !!now[itemId] });
      }
    }

    const before = new Map(prev.portfolio.map((p) => [p.id, p]));
    for (const p of S.portfolio) {
      const b = before.get(p.id);
      if (!b) send("POST", "/api/portfolio", pick(p));
      else if (!same(pick(p), pick(b))) send("PATCH", "/api/portfolio/" + p.id, pick(p));
    }
    for (const b of prev.portfolio) if (!S.portfolio.some((p) => p.id === b.id)) send("DELETE", "/api/portfolio/" + b.id);

    const fresh = S.seenBadges.filter((x) => !prev.seenBadges.includes(x));
    if (fresh.length) send("POST", "/api/badges", { ids: fresh });
    snap = clone(S);
  }

  /** One completed simulation attempt (kept as history; best/last are derived on the server). */
  function simAttempt(body) { if (enabled) send("POST", "/api/simulations", body); }

  window.addEventListener("beforeunload", (e) => { if (pending > 0) { e.preventDefault(); e.returnValue = ""; } });
  return { flush, simAttempt, settled: () => chain, pending: () => pending };
}
