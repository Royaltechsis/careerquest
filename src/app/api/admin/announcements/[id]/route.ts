import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fail, ok, readJson, str, withAdmin } from "@/lib/http";
import { isUuid } from "@/lib/portfolio";
import { audit } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

/** Edit an announcement or switch it on/off: { title?, body?, active? }. */
export async function PATCH(req: Request, ctx: Ctx) {
  return withAdmin(async (admin) => {
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("Not found", 404);
    const body = await readJson(req);
    const patch: Partial<typeof schema.announcements.$inferInsert> = {};
    if (typeof body?.active === "boolean") patch.active = body.active;
    if (typeof body?.title === "string") { const t = str(body.title, 120); if (!t) return fail("Give the announcement a title."); patch.title = t; }
    if (typeof body?.body === "string") patch.body = str(body.body, 600);
    if (!Object.keys(patch).length) return fail("Nothing to change.");
    const db = await getDb();
    const [row] = await db.update(schema.announcements).set(patch).where(eq(schema.announcements.id, id)).returning();
    if (!row) return fail("Not found", 404);
    const action = Object.keys(patch).length === 1 && "active" in patch ? (patch.active ? "announcement.activate" : "announcement.deactivate") : "announcement.edit";
    await audit(admin, action, "announcement", id, row.title);
    return ok({ announcement: row });
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  return withAdmin(async (admin) => {
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("Not found", 404);
    const db = await getDb();
    const [row] = await db.delete(schema.announcements).where(eq(schema.announcements.id, id)).returning({ title: schema.announcements.title });
    if (!row) return fail("Not found", 404);
    await audit(admin, "announcement.delete", "announcement", id, row.title);
    return ok({ ok: true });
  });
}
