import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db";

/** Public view of a student's portfolio: profile basics + public items only (not hidden by moderators; none for suspended accounts). */
export async function getPublicPortfolio(username: string) {
  const db = await getDb();
  const [u] = await db
    .select({ id: schema.users.id, name: schema.users.name, username: schema.users.username, uni: schema.profiles.university, course: schema.profiles.course })
    .from(schema.users).leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
    .where(and(eq(schema.users.username, username.toLowerCase()), isNull(schema.users.suspendedAt))).limit(1);
  if (!u) return null;
  const items = await db
    .select({ id: schema.portfolioItems.id, title: schema.portfolioItems.title, problem: schema.portfolioItems.problem, approach: schema.portfolioItems.approach,
      skills: schema.portfolioItems.skills, link: schema.portfolioItems.link, evidence: schema.portfolioItems.evidence, career: schema.portfolioItems.career, updatedAt: schema.portfolioItems.updatedAt })
    .from(schema.portfolioItems)
    .where(and(eq(schema.portfolioItems.userId, u.id), eq(schema.portfolioItems.isPublic, true), isNull(schema.portfolioItems.hiddenAt)))
    .orderBy(desc(schema.portfolioItems.createdAt));
  return { name: u.name, username: u.username, uni: u.uni ?? "", course: u.course ?? "", items };
}
