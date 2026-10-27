/*
 * Optimistic sync: the UI updates its state instantly, then flush(next) diffs the new state
 * against the last synced snapshot and sends only what changed to the API, in order.
 */
import type { SimSubmission } from "./scoring";
import type { ClientState, PortfolioFields, PortfolioItem } from "./models";

type Method = "PUT" | "POST" | "PATCH" | "DELETE";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const pick = (p: PortfolioItem): PortfolioFields => ({
  id: p.id, source: p.source ?? "", title: p.title ?? "", problem: p.problem ?? "", approach: p.approach ?? "",
  skills: p.skills ?? "", link: p.link ?? "", evidence: p.evidence ?? "", career: p.career ?? "", public: !!p.public,
});

export interface Sync {
  flush(next: ClientState): void;
  /** One completed simulation attempt. The server re-scores the answers and keeps the history. */
  simAttempt(sub: SimSubmission): void;
  settled(): Promise<void>;
  pending(): number;
}

export function createSync(initial: ClientState, onError: (msg: string) => void, enabled: boolean): Sync {
  let snap: ClientState = initial;
  let chain: Promise<void> = Promise.resolve();
  let pending = 0;

  async function request(method: Method, url: string, body?: unknown, attempt = 0): Promise<void> {
    try {
      const res = await fetch(url, {
        method, credentials: "same-origin",
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) return;
      if (res.status === 401) { onError("You've been logged out. Log in again to keep saving."); return; }
      if (res.status >= 500 && attempt < 2) { await sleep(700 * (attempt + 1)); return request(method, url, body, attempt + 1); }
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      onError(j.error || "Couldn't save that change.");
    } catch {
      if (attempt < 2) { await sleep(900 * (attempt + 1)); return request(method, url, body, attempt + 1); }
      onError("You're offline, so that change didn't save. Check your connection.");
    }
  }
  function send(method: Method, url: string, body?: unknown) {
    pending++;
    chain = chain.then(() => request(method, url, body)).finally(() => { pending--; });
  }

  function flush(S: ClientState) {
    if (!enabled) return;
    const prev = snap;
    if (S.profile && !same(S.profile, prev.profile)) send("PUT", "/api/profile", { profile: S.profile, explored: S.explored });
    else if (!same(S.explored, prev.explored)) send("PUT", "/api/profile", { explored: S.explored });
    if (S.quiz && !same(S.quiz, prev.quiz)) send("PUT", "/api/quiz", { quiz: S.quiz });

    const cids = new Set([...Object.keys(S.roadmap), ...Object.keys(prev.roadmap)]);
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
    snap = S;
  }

  function simAttempt(sub: SimSubmission) { if (enabled) send("POST", "/api/simulations", sub); }

  return { flush, simAttempt, settled: () => chain, pending: () => pending };
}
