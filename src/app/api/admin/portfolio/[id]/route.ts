import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fail, ok, readJson, withAdmin } from "@/lib/http";
import { isUuid } from "@/lib/portfolio";
import { audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

/** Hide or unhide a portfolio item on its owner's public page ({ hidden: boolean }). */
export async function PATCH(req: Request, ctx: Ctx) {
  return withAdmin(async (admin) => {
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("Not found", 404);
    const body = await readJson(req);
    if (typeof body?.hidden !== "boolean") return fail("Send { hidden: true | false }.");
    const db = await getDb();
    const [row] = await db.update(schema.portfolioItems).set({ hiddenAt: body.hidden ? new Date() : null })
      .where(eq(schema.portfolioItems.id, id)).returning({ title: schema.portfolioItems.title });
    if (!row) return fail("Not found", 404);
    await audit(admin, body.hidden ? "portfolio.hide" : "portfolio.unhide", "portfolio_item", id, row.title);
    return ok({ ok: true });
  });
}
