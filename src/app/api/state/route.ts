import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { ok, withUser } from "@/lib/http";
import { loadState } from "@/lib/state";

/** Everything the app needs for the signed-in student, in one call. */
export async function GET() {
  return withUser(async (user) => ok({ user, state: await loadState(user) }));
}

/** "Start over": wipes progress, quiz, portfolio and badges. The account itself stays. */
export async function DELETE() {
  return withUser(async (user) => {
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.delete(schema.roadmapProgress).where(eq(schema.roadmapProgress.userId, user.id));
      await tx.delete(schema.simulationAttempts).where(eq(schema.simulationAttempts.userId, user.id));
      await tx.delete(schema.portfolioItems).where(eq(schema.portfolioItems.userId, user.id));
      await tx.delete(schema.badges).where(eq(schema.badges.userId, user.id));
      await tx.update(schema.profiles).set({ university: "", course: "", level: "100", goals: [], interests: [], explored: [], quiz: null, onboardedAt: null, updatedAt: new Date() })
        .where(eq(schema.profiles.userId, user.id));
    });
    return ok({ ok: true });
  });
}
