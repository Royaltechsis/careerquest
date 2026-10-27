import "server-only";
import { and, count, desc, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AppUser } from "./models";
import { loadState } from "./state";

const { users, profiles, simulationAttempts: attempts, portfolioItems: items, auditLog, announcements } = schema;
/** Calendar days for the admin panel are counted in Nigerian time. */
const TZ = "Africa/Lagos";
export const PAGE_SIZE = 20;

/** Records one admin action in the audit log. */
export async function audit(actor: AppUser, action: string, targetType: string, targetId: string, detail = "") {
  const db = await getDb();
  await db.insert(auditLog).values({ actorId: actor.id, actorEmail: actor.email, action, targetType, targetId, detail: detail.slice(0, 500) });
}

export async function overviewStats() {
  const db = await getDb();
  const startOfToday = sql`(date_trunc('day', now() at time zone ${TZ}) at time zone ${TZ})`;
  const [[u], [q], [a], [pf], signups, explored, sims] = await Promise.all([
    db.select({
      total: count(),
      today: sql<number>`count(*) filter (where ${users.createdAt} >= ${startOfToday})`.mapWith(Number),
      week: sql<number>`count(*) filter (where ${users.createdAt} >= now() - interval '7 days')`.mapWith(Number),
      suspended: sql<number>`count(*) filter (where ${users.suspendedAt} is not null)`.mapWith(Number),
    }).from(users),
    db.select({ n: count() }).from(profiles).where(and(isNotNull(profiles.quiz), sql`${profiles.quiz} <> 'null'::jsonb`)),
    db.select({ n: count() }).from(attempts),
    db.select({
      total: count(),
      publicOwners: sql<number>`count(distinct ${items.userId}) filter (where ${items.isPublic} and ${items.hiddenAt} is null)`.mapWith(Number),
    }).from(items),
    db.execute<{ day: string; n: number }>(sql`
      select to_char(d, 'YYYY-MM-DD') as day, count(${users.id})::int as n
      from generate_series(date_trunc('day', now() at time zone ${TZ}) - interval '13 days', date_trunc('day', now() at time zone ${TZ}), interval '1 day') as d
      left join ${users} on (${users.createdAt} at time zone ${TZ})::date = d::date
      group by d order by d`),
    db.execute<{ career: string; n: number }>(sql`
      select e as career, count(*)::int as n from ${profiles}, jsonb_array_elements_text(${profiles.explored}) as e
      group by e order by n desc, e limit 6`),
    db.select({
      simId: attempts.simId, attempts: count(),
      students: sql<number>`count(distinct ${attempts.userId})`.mapWith(Number),
      avg: sql<number>`round(avg(${attempts.score}))`.mapWith(Number),
    }).from(attempts).groupBy(attempts.simId),
  ]);
  return {
    users: u.total, signupsToday: u.today, signupsWeek: u.week, suspended: u.suspended,
    quizCompletions: q.n, simAttempts: a.n, portfolioItems: pf.total, publicPortfolios: pf.publicOwners,
    signups: [...signups].map((r) => ({ day: r.day, n: Number(r.n) })),
    explored: [...explored].map((r) => ({ career: r.career, n: Number(r.n) })),
    sims,
  };
}
export type OverviewStats = Awaited<ReturnType<typeof overviewStats>>;

export async function listUsers(q: string, page: number) {
  const db = await getDb();
  const term = q.trim();
  const where = term
    ? or(ilike(users.name, `%${term}%`), ilike(users.username, `%${term}%`), ilike(users.email, `%${term}%`), ilike(profiles.university, `%${term}%`))
    : undefined;
  const simsDone = sql<number>`(select count(distinct ${attempts.simId}) from ${attempts} where ${attempts.userId} = ${users.id})`.mapWith(Number);
  const [rows, [{ total }]] = await Promise.all([
    db.select({
      id: users.id, name: users.name, username: users.username, email: users.email, role: users.role, suspendedAt: users.suspendedAt,
      createdAt: users.createdAt, lastActiveAt: users.lastActiveAt, university: profiles.university, simsDone,
    }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(where)
      .orderBy(desc(users.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(where),
  ]);
  return { rows, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function userDetail(id: string) {
  const db = await getDb();
  const [u] = await db.select({
    id: users.id, name: users.name, username: users.username, email: users.email, role: users.role,
    suspendedAt: users.suspendedAt, createdAt: users.createdAt, lastActiveAt: users.lastActiveAt,
  }).from(users).where(eq(users.id, id)).limit(1);
  if (!u) return null;
  const [state, [profile], history, portfolio] = await Promise.all([
    loadState({ id: u.id, email: u.email, username: u.username, name: u.name, role: u.role }),
    db.select().from(profiles).where(eq(profiles.userId, id)).limit(1),
    db.select({ id: attempts.id, simId: attempts.simId, score: attempts.score, summary: attempts.summary, createdAt: attempts.createdAt })
      .from(attempts).where(eq(attempts.userId, id)).orderBy(desc(attempts.createdAt)).limit(50),
    db.select().from(items).where(eq(items.userId, id)).orderBy(desc(items.createdAt)),
  ]);
  return { user: u, profile: profile ?? null, state, attempts: history, portfolio };
}

export async function moderationList(show: "visible" | "hidden") {
  const db = await getDb();
  return db.select({
    id: items.id, title: items.title, problem: items.problem, career: items.career, link: items.link, hiddenAt: items.hiddenAt,
    updatedAt: items.updatedAt, ownerId: users.id, ownerName: users.name, ownerUsername: users.username,
  }).from(items).innerJoin(users, eq(users.id, items.userId))
    .where(and(eq(items.isPublic, true), show === "hidden" ? isNotNull(items.hiddenAt) : isNull(items.hiddenAt)))
    .orderBy(desc(items.updatedAt)).limit(100);
}

export async function listAnnouncements() {
  const db = await getDb();
  return db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(50);
}

export async function listActivity(limit = 100) {
  const db = await getDb();
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}
