import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { careerIds, GOAL_IDS, LEVELS } from "@/content/catalog";
import { fail, ok, readJson, str, strList, withUser } from "@/lib/http";
import { ensureProfile } from "@/lib/state";

/** Onboarding answers and explored careers. Send either or both. */
export async function PUT(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    if (!body) return fail("Invalid request");
    const db = await getDb();
    await ensureProfile(user.id);
    const patch: Partial<typeof schema.profiles.$inferInsert> = { updatedAt: new Date() };
    const p = body.profile as Record<string, unknown> | undefined;
    if (p && typeof p === "object") {
      const name = str(p.name, 60);
      if (!name) return fail("Add your first name.");
      const level = str(p.level, 20);
      Object.assign(patch, {
        university: str(p.uni, 120), course: str(p.course, 120),
        level: (LEVELS as readonly string[]).includes(level) ? level : "100",
        goals: strList(p.goals, GOAL_IDS), interests: strList(p.interests, careerIds),
      });
      const [cur] = await db.select({ onboardedAt: schema.profiles.onboardedAt }).from(schema.profiles).where(eq(schema.profiles.userId, user.id));
      if (!cur?.onboardedAt) patch.onboardedAt = new Date();
      if (name !== user.name) await db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id));
    }
    if (Array.isArray(body.explored)) patch.explored = strList(body.explored, careerIds);
    await db.update(schema.profiles).set(patch).where(eq(schema.profiles.userId, user.id));
    return ok({ ok: true });
  });
}
