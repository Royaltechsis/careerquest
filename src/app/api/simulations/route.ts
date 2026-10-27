import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { SIM_IDS } from "@/content/catalog";
import { fail, ok, readJson, str, strList, withUser } from "@/lib/http";

export async function GET() {
  return withUser(async (user) => {
    const db = await getDb();
    const rows = await db.select().from(schema.simulationAttempts).where(eq(schema.simulationAttempts.userId, user.id)).orderBy(desc(schema.simulationAttempts.createdAt)).limit(200);
    return ok({ attempts: rows });
  });
}

/** Record one completed simulation attempt (score 0–100, summary, skills practised). */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    const simId = str(body?.simId, 40);
    if (!(SIM_IDS as readonly string[]).includes(simId)) return fail("Unknown simulation");
    const score = Math.round(Number(body?.score));
    if (!Number.isFinite(score) || score < 0 || score > 100) return fail("Score must be 0–100");
    const answers = body?.answers ?? null;
    if (answers && JSON.stringify(answers).length > 20000) return fail("Answers too large");
    const db = await getDb();
    const [row] = await db.insert(schema.simulationAttempts)
      .values({ userId: user.id, simId, score, summary: str(body?.summary, 1000), skills: strList(body?.skills, undefined, 12), answers })
      .returning();
    return ok({ attempt: row }, 201);
  });
}
