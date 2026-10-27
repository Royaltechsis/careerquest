import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fail, ok, readJson, withUser } from "@/lib/http";
import { isUuid, portfolioFields } from "@/lib/portfolio";
import { toPortfolioDTO } from "@/lib/state";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  return withUser(async (user) => {
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("Not found", 404);
    const body = await readJson(req);
    if (!body) return fail("Invalid request");
    let fields;
    try { fields = portfolioFields(body); } catch (e) { return fail((e as Error).message); }
    const db = await getDb();
    const [row] = await db.update(schema.portfolioItems).set({ ...(fields as object), updatedAt: new Date() })
      .where(and(eq(schema.portfolioItems.id, id), eq(schema.portfolioItems.userId, user.id))).returning();
    if (!row) return fail("Not found", 404);
    return ok({ item: toPortfolioDTO(row) });
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  return withUser(async (user) => {
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("Not found", 404);
    const db = await getDb();
    await db.delete(schema.portfolioItems).where(and(eq(schema.portfolioItems.id, id), eq(schema.portfolioItems.userId, user.id)));
    return ok({ ok: true });
  });
}
