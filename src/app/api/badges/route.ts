import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { BADGE_IDS } from "@/content/catalog";
import { fail, ok, readJson, strList, withUser } from "@/lib/http";

export async function GET() {
  return withUser(async (user) => {
    const db = await getDb();
    const rows = await db.select().from(schema.badges).where(eq(schema.badges.userId, user.id)).orderBy(asc(schema.badges.earnedAt));
    return ok({ badges: rows.map((b) => ({ id: b.badgeId, earnedAt: b.earnedAt })) });
  });
}

/** Record newly earned badges (ids from the known list). */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const ids = strList(body?.ids, BADGE_IDS);
    if (!ids.length) return fail("No valid badge ids");
    const db = await getDb();
    await db.insert(schema.badges).values(ids.map((badgeId) => ({ userId: user.id, badgeId }))).onConflictDoNothing();
    return ok({ ok: true, ids });
  });
}
