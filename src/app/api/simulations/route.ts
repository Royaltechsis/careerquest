import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { simById } from "@/content/sims";
import { fail, ok, readJson, withUser } from "@/lib/http";
import { parseSubmission, scoreSim } from "@/lib/scoring";

export async function GET() {
  return withUser(async (user) => {
    const db = await getDb();
    const rows = await db.select().from(schema.simulationAttempts).where(eq(schema.simulationAttempts.userId, user.id)).orderBy(desc(schema.simulationAttempts.createdAt)).limit(200);
    return ok({ attempts: rows });
  });
}

/**
 * Record one completed simulation attempt. The client sends its answers ({ simId, answers });
 * the server validates them and computes the score itself with the same scoring module the UI uses.
 */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    if (body && JSON.stringify(body).length > 20000) return fail("Answers too large");
    const sub = parseSubmission(body?.simId, body?.answers);
    if (!sub) return fail(typeof body?.simId === "string" && simById(body.simId) ? "Those answers don't look like a finished attempt." : "Unknown simulation");
    const { score, summary } = scoreSim(sub);
    const db = await getDb();
    const [row] = await db.insert(schema.simulationAttempts)
      .values({ userId: user.id, simId: sub.simId, score, summary, skills: simById(sub.simId)!.skills, answers: sub.answers })
      .returning();
    return ok({ attempt: row }, 201);
  });
}
