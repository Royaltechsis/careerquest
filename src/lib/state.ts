import "server-only";
import { cache } from "react";
import { asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { SessionUser } from "./auth";

import type { ClientState, PortfolioItem } from "./models";

export type { ClientState, PortfolioItem } from "./models";

export function toPortfolioDTO(r: typeof schema.portfolioItems.$inferSelect): PortfolioItem {
  return {
    id: r.id, source: r.source, title: r.title, problem: r.problem, approach: r.approach, skills: r.skills, link: r.link,
    evidence: r.evidence, career: r.career, public: r.isPublic, created: r.createdAt.getTime(), updated: r.updatedAt.getTime(),
    ...(r.hiddenAt ? { hidden: true } : {}),
  };
}

export const loadState = cache(async function loadState(user: SessionUser): Promise<ClientState> {
  const db = await getDb();
  const uid = user.id;
  const [prof, progress, sims, items, earned] = await Promise.all([
    db.select().from(schema.profiles).where(eq(schema.profiles.userId, uid)).limit(1),
    db.select({ careerId: schema.roadmapProgress.careerId, itemId: schema.roadmapProgress.itemId }).from(schema.roadmapProgress).where(eq(schema.roadmapProgress.userId, uid)),
    db.select({
      simId: schema.simulationAttempts.simId,
      best: sql<number>`max(${schema.simulationAttempts.score})`.mapWith(Number),
      attempts: sql<number>`count(*)`.mapWith(Number),
      last: sql<number>`(array_agg(${schema.simulationAttempts.score} order by ${schema.simulationAttempts.createdAt} desc))[1]`.mapWith(Number),
      at: sql<string>`max(${schema.simulationAttempts.createdAt})`,
    }).from(schema.simulationAttempts).where(eq(schema.simulationAttempts.userId, uid)).groupBy(schema.simulationAttempts.simId),
    db.select().from(schema.portfolioItems).where(eq(schema.portfolioItems.userId, uid)).orderBy(desc(schema.portfolioItems.createdAt)),
    db.select({ id: schema.badges.badgeId }).from(schema.badges).where(eq(schema.badges.userId, uid)).orderBy(asc(schema.badges.earnedAt)),
  ]);
  const p = prof[0];
  const roadmap: ClientState["roadmap"] = {};
  for (const r of progress) (roadmap[r.careerId] ||= {})[r.itemId] = true;
  const simMap: ClientState["sims"] = {};
  for (const s of sims) simMap[s.simId] = { best: s.best, last: s.last, attempts: s.attempts, at: new Date(s.at).getTime() };
  return {
    profile: p && p.onboardedAt
      ? { name: user.name, uni: p.university, course: p.course, level: p.level, goals: p.goals, interests: p.interests, created: p.onboardedAt.getTime() }
      : null,
    explored: p?.explored ?? [],
    quiz: p?.quiz ?? null,
    roadmap,
    sims: simMap,
    portfolio: items.map(toPortfolioDTO),
    seenBadges: earned.map((b) => b.id),
  };
});

/** Make sure a profile row exists (created lazily, e.g. when exploring before onboarding). */
export async function ensureProfile(userId: string) {
  const db = await getDb();
  await db.insert(schema.profiles).values({ userId }).onConflictDoNothing();
}
