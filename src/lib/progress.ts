/*
 * Everything derived from a student's state: roadmap progress, skills, badges and the
 * rule-based recommendations. Pure functions over ClientState, usable on server and client.
 */
import { CQ_DATA } from "@/content/data";
import { SIMS, simById } from "@/content/sims";
import type { Career, RoadmapItem, RoadmapStage } from "@/content/types";
import type { ClientState } from "./models";

const D = CQ_DATA;
export const careerById = (id: string): Career | undefined => D.careers.find((c) => c.id === id);
export const categoryById = (id: string) => D.categories.find((c) => c.id === id)!;
export const ROADMAP_IDS = Object.keys(D.roadmaps);

export function roadmapItems(cid: string): RoadmapItem[] {
  const r = D.roadmaps[cid];
  return r ? r.stages.flatMap((s) => s.items) : [];
}
export function itemDone(S: ClientState, cid: string, it: RoadmapItem): boolean {
  return !!(S.roadmap[cid] || {})[it.id] || (!!it.sim && !!S.sims[it.sim]);
}
export function roadmapPct(S: ClientState, cid: string): number {
  const its = roadmapItems(cid);
  if (!its.length) return 0;
  return Math.round((its.filter((it) => itemDone(S, cid, it)).length / its.length) * 100);
}
export const stageDone = (S: ClientState, cid: string, st: RoadmapStage) => st.items.every((it) => itemDone(S, cid, it));

/** Skills practised in completed simulations, most practised first. */
export function skillCounts(S: ClientState): [string, number][] {
  const m: Record<string, number> = {};
  for (const id of Object.keys(S.sims)) simById(id)?.skills.forEach((k) => { m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

/** Careers the student is focused on: stated interests, then quiz picks, then explored. */
export function focusCareers(S: ClientState): string[] {
  const f: string[] = [];
  const add = (id: string) => { if (id && careerById(id) && !f.includes(id)) f.push(id); };
  (S.profile?.interests || []).forEach(add);
  (S.quiz?.top || []).forEach(add);
  S.explored.forEach(add);
  return f;
}

/* ---------- badges ---------- */
export type IconName = "home" | "compass" | "flask" | "map" | "folder" | "shield" | "chart" | "pen" | "code" | "mega" | "user" | "check" | "star" | "arrow" | "lock" | "share";
export interface Badge { id: string; name: string; desc: string; icon: IconName; test: (S: ClientState) => boolean }

export const BADGES: Badge[] = [
  { id: "welcome", name: "Quest begun", desc: "Created your profile", icon: "star", test: (S) => !!S.profile },
  { id: "quiz", name: "Know thyself", desc: "Finished the interest quiz", icon: "compass", test: (S) => !!S.quiz },
  { id: "explorer", name: "Explorer", desc: "Explored 3 career profiles", icon: "map", test: (S) => S.explored.length >= 3 },
  { id: "first-sim", name: "First mission", desc: "Completed a simulation", icon: "flask", test: (S) => Object.keys(S.sims).length >= 1 },
  { id: "phish", name: "Phish hunter", desc: "80%+ on Phishing Investigation", icon: "shield", test: (S) => (S.sims.phishing?.best ?? 0) >= 80 },
  { id: "data", name: "Data detective", desc: "80%+ on Canteen Sales Analysis", icon: "chart", test: (S) => (S.sims.data?.best ?? 0) >= 80 },
  { id: "ux", name: "Eagle eye", desc: "80%+ on Usability Audit", icon: "pen", test: (S) => (S.sims.uiux?.best ?? 0) >= 80 },
  { id: "poly", name: "Range", desc: "Simulations in 3 different careers", icon: "compass", test: (S) => new Set(Object.keys(S.sims).map((id) => simById(id)?.career)).size >= 3 },
  { id: "stage", name: "Milestone", desc: "Completed a full roadmap stage", icon: "check", test: (S) => ROADMAP_IDS.some((cid) => D.roadmaps[cid].stages.some((st) => stageDone(S, cid, st))) },
  { id: "half", name: "Halfway there", desc: "50% of any roadmap", icon: "map", test: (S) => ROADMAP_IDS.some((cid) => roadmapPct(S, cid) >= 50) },
  { id: "folio", name: "Builder", desc: "Added your own project to the portfolio", icon: "folder", test: (S) => S.portfolio.some((p) => p.source === "manual") },
  { id: "public", name: "Going public", desc: "Made a portfolio item public", icon: "share", test: (S) => S.portfolio.some((p) => p.public) },
];
export const earnedBadges = (S: ClientState) => BADGES.filter((b) => b.test(S));

/* ---------- recommendation engine (rule-based) ---------- */
export interface Recommendation { t: string; d: string; href: string; cta: string; icon: IconName }

export function recommendations(S: ClientState): Recommendation[] {
  const out: Recommendation[] = [];
  const goals = S.profile?.goals || [];
  const focus = focusCareers(S);
  if (!S.quiz && focus.length < 2) out.push({ t: "Take the interest quiz", d: "10 quick questions to find careers worth exploring. Two minutes.", href: "/quiz", cta: "Start quiz", icon: "compass" });
  for (const cid of focus) {
    const c = careerById(cid)!;
    if (!S.explored.includes(cid)) { out.push({ t: `Read the ${c.name} profile`, d: "See what the job really involves before going deeper.", href: `/career/${cid}`, cta: "Open profile", icon: "map" }); continue; }
    const s = c.sim ? simById(c.sim) : undefined;
    if (s && !S.sims[s.id]) { out.push({ t: `Try it: ${s.title}`, d: `A ${s.mins}-minute taste of real ${c.name.toLowerCase()} work.`, href: `/sim/${s.id}`, cta: "Start simulation", icon: "flask" }); continue; }
    if (D.roadmaps[cid] && roadmapPct(S, cid) < 100) {
      const items = roadmapItems(cid);
      const next = items.find((it) => !itemDone(S, cid, it))!;
      const prefer = goals.includes("internship") ? items.slice(-3).find((it) => !itemDone(S, cid, it)) : undefined;
      const it = roadmapPct(S, cid) >= 40 && prefer ? prefer : next;
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

/* ---------- interest quiz ---------- */
export const TRAIT_WORDS: Record<string, string> = { investigate: "investigating problems", systems: "how systems work", detail: "details", numbers: "numbers and data", create: "creating and designing", people: "understanding people", build: "building things", lead: "organising and leading" };

export function scoreQuiz(answers: number[]) {
  const t: Record<string, number> = {};
  answers.forEach((a, i) => { const w = D.quiz[i].o[a].w; Object.keys(w).forEach((k) => (t[k] = (t[k] || 0) + w[k])); });
  const res = D.careers.map((c) => ({ id: c.id, s: c.traits.reduce((n, k) => n + (t[k] || 0), 0) })).sort((a, b) => b.s - a.s);
  const traits = Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return { res, traits };
}

export { SIMS };
