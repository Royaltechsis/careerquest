/*
 * Simulation scoring, shared by the browser (instant, optimistic result) and the API
 * (POST /api/simulations re-scores the submitted answers; the client's score is never trusted).
 * parseAnswers() validates untrusted input; scoreSim() is deterministic and pure.
 */
import {
  DECISION_STEPS, FEATS, IDEAL_ORDER, PHISH, PHISH_INDICATORS, PHISH_KEYS, PHISH_MAX_HINTS, UX, UX_KEYS,
  cleanSales, dataPickIsCorrect, dataSteps, decisionPicks, featById, growth,
  type DecisionSimId, type FeatId, type PhishDecision, type PhishKey, type SimId, type UxKey,
} from "@/content/sims";
import { SIM_IDS } from "@/content/catalog";

export interface PhishingAnswers { flagged: PhishKey[]; decision: PhishDecision; hintsUsed: number }
/** One entry per question: every pick in order (the last one is the right answer) and whether the hint was opened. */
export interface DataAnswers { steps: { picks: string[]; hinted: boolean }[] }
/** Problems found, each with the chosen fix index (null = found, no fix picked yet). */
export interface UxAnswers { found: Partial<Record<UxKey, number | null>>; misses: number; hints: number }
export interface ProductAnswers { order: FeatId[]; hint: boolean }
/** One entry per decision: every option index clicked, in order. */
export interface DecisionAnswers { picks: number[][] }

export interface SimAnswersMap {
  phishing: PhishingAnswers; data: DataAnswers; uiux: UxAnswers; product: ProductAnswers; cloud: DecisionAnswers; marketing: DecisionAnswers;
}
export type SimSubmission = { [K in SimId]: { simId: K; answers: SimAnswersMap[K] } }[SimId];

export interface SimPortfolio { title: string; problem: string; approach: string }
export interface SimScore { score: number; summary: string; portfolio: SimPortfolio }

export const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/* ---------------- scoring ---------------- */
export function scorePhishing(a: PhishingAnswers): SimScore & { found: PhishKey[]; falseFlags: PhishKey[] } {
  const flagged = new Set(a.flagged);
  const found = PHISH_INDICATORS.filter((k) => flagged.has(k));
  const falseFlags = [...flagged].filter((k) => !PHISH[k].ind);
  const n = PHISH_INDICATORS.length;
  const right = a.decision === "c";
  const score = clamp((found.length / n) * 70 - falseFlags.length * 5 + (right ? 30 : 0) - a.hintsUsed * 4);
  return {
    score, found, falseFlags,
    summary: `Found ${found.length} of ${n} phishing indicators${falseFlags.length ? `, ${falseFlags.length} false flag${falseFlags.length > 1 ? "s" : ""}` : ""}; ${right ? "chose the right response" : "response needs work"}.`,
    portfolio: {
      title: "Phishing incident investigation",
      problem: "Staff at a (simulated) microfinance bank received a payroll ‘verification’ email. I had to decide if it was phishing and how to respond.",
      approach: `Analysed sender domain, Reply-To, SPF/DKIM/DMARC results, link destinations, attachments and social-engineering cues. Identified ${found.length} of ${n} indicators and recommended reporting, blocking the domain and checking for compromised users.`,
    },
  };
}

/** First-try answers without the hint earn 2 points; answers after a hint or a retry earn 1. */
export function scoreData(a: DataAnswers): SimScore & { points: number; max: number } {
  const steps = dataSteps();
  const max = steps.length * 2;
  const points = steps.reduce((sum, s, i) => {
    const st = a.steps[i];
    if (!st || !st.picks.length || !dataPickIsCorrect(s, st.picks[st.picks.length - 1])) return sum;
    return sum + (st.picks.length === 1 && !st.hinted ? 2 : 1);
  }, 0);
  const zobo = growth(cleanSales(), 2);
  return {
    score: clamp((points / max) * 100), points, max,
    summary: `Cleaned a data error, found the top seller and fastest grower, explained the April dip and chose the right chart (${points}/${max} pts).`,
    portfolio: {
      title: "Sales analysis for a campus canteen",
      problem: "A small canteen owner had six months of sales data and wanted to know what's selling and what to do next.",
      approach: `Found and corrected a data-entry error, computed totals and growth (Zobo +${zobo}%), explained a seasonal dip using the academic calendar, chose a line chart for the trend and recommended stocking more zobo with a combo offer.`,
    },
  };
}

export function scoreUx(a: UxAnswers): SimScore & { nFound: number; nFix: number } {
  const keys = UX_KEYS.filter((k) => k in a.found);
  const nFound = keys.length;
  const nFix = keys.filter((k) => { const f = a.found[k]; return f != null && !!UX[k].fixes[f]?.[1]; }).length;
  const total = UX_KEYS.length * 2;
  return {
    score: clamp(((nFound + nFix) / total) * 100 - a.misses * 2 - a.hints * 3), nFound, nFix,
    summary: `Found ${nFound}/${UX_KEYS.length} usability problems and chose the best fix for ${nFix}.`,
    portfolio: {
      title: "Usability audit: university course registration",
      problem: "Students were making mistakes on a (simulated) course-registration screen. I audited it for usability and accessibility problems.",
      approach: `Applied usability heuristics and WCAG basics. Identified ${nFound} problems (contrast, unlabeled icons, jargon, silent errors, placeholder labels, tap targets, destructive-action styling) and proposed fixes for each.`,
    },
  };
}

export function scoreProduct(a: ProductAnswers): SimScore & { top3: number } {
  const top3 = a.order.slice(0, 3).filter((id) => IDEAL_ORDER.slice(0, 3).includes(id)).length;
  const maxDist = 18; // the largest possible total displacement for 6 items
  const dist = a.order.reduce((s, id, i) => s + Math.abs(i - IDEAL_ORDER.indexOf(id)), 0);
  return {
    score: clamp(top3 * 20 + (1 - dist / maxDist) * 40 - (a.hint ? 5 : 0)), top3,
    summary: `${top3}/3 of the highest-value features made your top 3.`,
    portfolio: {
      title: "Feature prioritisation for a food-delivery app",
      problem: "A (simulated) student food-delivery app had more feature requests than engineering capacity for the quarter.",
      approach: `Reviewed user feedback, then ranked six features using reach, impact, confidence and effort (RICE). My top 3: ${a.order.slice(0, 3).map((id) => featById(id).t).join("; ")}.`,
    },
  };
}

/** A decision scores a point when the first option clicked was the right call. */
export function scoreDecision(simId: DecisionSimId, a: DecisionAnswers): SimScore & { points: number } {
  const steps = DECISION_STEPS[simId];
  const points = steps.filter((s, i) => { const first = a.picks[i]?.[0]; return first != null && !!s.o[first]?.[1]; }).length;
  const p = decisionPicks(steps);
  const portfolio: SimPortfolio = simId === "cloud"
    ? { title: "Cloud architecture: online student election", problem: "Design infrastructure for 8,000 students voting in a 6-hour window with no downtime, no lost votes and a tight budget.", approach: "Designed a load-balanced, auto-scaling app tier, a managed relational database with backups and standby, CDN-served static assets, private networking with HTTPS, and cost controls with scaling schedules and billing alerts." }
    : { title: "Campaign brief: student drinks brand", problem: "A student-run zobo brand had ₦50,000 and 4 weeks to win first-time customers on campus.", approach: `Defined the audience (${p[0]}), a SMART goal (${p[1]}), budget-fit channels, a conversion-focused headline and weekly cost-per-customer tracking.` };
  return { score: clamp((points / steps.length) * 100), points, summary: `${points}/${steps.length} decisions right first time.`, portfolio };
}

export function scoreSim(sub: SimSubmission): SimScore {
  switch (sub.simId) {
    case "phishing": return scorePhishing(sub.answers);
    case "data": return scoreData(sub.answers);
    case "uiux": return scoreUx(sub.answers);
    case "product": return scoreProduct(sub.answers);
    case "cloud": case "marketing": return scoreDecision(sub.simId, sub.answers);
  }
}

/* ---------------- validation of untrusted answers (API input) ---------------- */
type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown, max: number) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null);
const indexList = (v: unknown, n: number, maxLen = 20) =>
  Array.isArray(v) && v.length >= 1 && v.length <= maxLen && v.every((x) => Number.isInteger(x) && x >= 0 && x < n) ? (v as number[]) : null;

function parsePhishing(a: Json): PhishingAnswers | null {
  if (!Array.isArray(a.flagged) || !a.flagged.every((k) => (PHISH_KEYS as unknown[]).includes(k))) return null;
  const decision = a.decision;
  if (decision !== "a" && decision !== "b" && decision !== "c" && decision !== "d") return null;
  const hintsUsed = count(a.hintsUsed, PHISH_MAX_HINTS);
  if (hintsUsed == null) return null;
  return { flagged: [...new Set(a.flagged as PhishKey[])], decision, hintsUsed };
}
function parseData(a: Json): DataAnswers | null {
  const steps = dataSteps();
  if (!Array.isArray(a.steps) || a.steps.length !== steps.length) return null;
  const out: DataAnswers["steps"] = [];
  for (let i = 0; i < steps.length; i++) {
    const st = a.steps[i];
    if (!isObj(st) || !Array.isArray(st.picks) || st.picks.length < 1 || st.picks.length > 40 || !st.picks.every((p) => typeof p === "string" && p.length <= 12)) return null;
    const picks = st.picks as string[];
    if (!dataPickIsCorrect(steps[i], picks[picks.length - 1])) return null; // a question is only left once it's answered right
    out.push({ picks, hinted: st.hinted === true });
  }
  return { steps: out };
}
function parseUx(a: Json): UxAnswers | null {
  if (!isObj(a.found)) return null;
  const found: UxAnswers["found"] = {};
  for (const [k, v] of Object.entries(a.found)) {
    if (!(UX_KEYS as string[]).includes(k)) return null;
    if (v !== null && !(Number.isInteger(v) && (v as number) >= 0 && (v as number) < UX[k as UxKey].fixes.length)) return null;
    found[k as UxKey] = v as number | null;
  }
  const misses = count(a.misses, 1000), hints = count(a.hints, 1000);
  if (misses == null || hints == null) return null;
  return { found, misses, hints };
}
function parseProduct(a: Json): ProductAnswers | null {
  const ids = FEATS.map((f) => f.id) as string[];
  if (!Array.isArray(a.order) || a.order.length !== ids.length || new Set(a.order).size !== ids.length || !a.order.every((x) => ids.includes(x as string))) return null;
  return { order: a.order as FeatId[], hint: a.hint === true };
}
function parseDecision(simId: DecisionSimId, a: Json): DecisionAnswers | null {
  const steps = DECISION_STEPS[simId];
  if (!Array.isArray(a.picks) || a.picks.length !== steps.length) return null;
  const picks: number[][] = [];
  for (let i = 0; i < steps.length; i++) {
    const list = indexList(a.picks[i], steps[i].o.length);
    if (!list || !steps[i].o[list[list.length - 1]][1]) return null;
    picks.push(list);
  }
  return { picks };
}

/** Validates a submission from the network. Returns null when it isn't a well-formed, finished attempt. */
export function parseSubmission(simId: unknown, answers: unknown): SimSubmission | null {
  if (typeof simId !== "string" || !(SIM_IDS as readonly string[]).includes(simId) || !isObj(answers)) return null;
  const id = simId as SimId;
  switch (id) {
    case "phishing": { const a = parsePhishing(answers); return a && { simId: id, answers: a }; }
    case "data": { const a = parseData(answers); return a && { simId: id, answers: a }; }
    case "uiux": { const a = parseUx(answers); return a && { simId: id, answers: a }; }
    case "product": { const a = parseProduct(answers); return a && { simId: id, answers: a }; }
    case "cloud": case "marketing": { const a = parseDecision(id, answers); return a && { simId: id, answers: a }; }
  }
}
