import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { isRoadmapItem } from "@/content/catalog";
import { fail, ok, readJson, str, withUser } from "@/lib/http";

export async function GET() {
  return withUser(async (user) => {
    const db = await getDb();
    const rows = await db.select().from(schema.roadmapProgress).where(eq(schema.roadmapProgress.userId, user.id));
    return ok({ progress: rows.map((r) => ({ careerId: r.careerId, itemId: r.itemId, completedAt: r.completedAt })) });
  });
}

/** Tick or untick one roadmap item. */
export async function PUT(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const careerId = str(body?.careerId, 60), itemId = str(body?.itemId, 60);
    if (!isRoadmapItem(careerId, itemId)) return fail("Unknown roadmap item");
    const db = await getDb();
    if (body?.done) {
      await db.insert(schema.roadmapProgress).values({ userId: user.id, careerId, itemId }).onConflictDoNothing();
    } else {
      await db.delete(schema.roadmapProgress).where(and(eq(schema.roadmapProgress.userId, user.id), eq(schema.roadmapProgress.careerId, careerId), eq(schema.roadmapProgress.itemId, itemId)));
    }
    return ok({ ok: true });
  });
}
