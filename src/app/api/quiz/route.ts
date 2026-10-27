import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { careerIds } from "@/content/catalog";
import { fail, ok, readJson, str, strList, withUser } from "@/lib/http";
import { ensureProfile } from "@/lib/state";

/** Save the latest interest-quiz result: top careers + strongest traits. */
export async function PUT(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const q = body?.quiz as Record<string, unknown> | undefined;
    if (!q || typeof q !== "object") return fail("Missing quiz result");
    const quiz = { top: strList(q.top, careerIds, 5), traits: strList(q.traits, undefined, 5), ts: str(q.ts, 40), at: Date.now() };
    if (!quiz.top.length) return fail("Quiz result has no careers");
    const db = await getDb();
    await ensureProfile(user.id);
    await db.update(schema.profiles).set({ quiz, updatedAt: new Date() }).where(eq(schema.profiles.userId, user.id));
    return ok({ quiz });
  });
}
