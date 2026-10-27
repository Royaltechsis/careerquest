import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fail, ok, readJson, withAdmin } from "@/lib/http";
import { isUuid } from "@/lib/portfolio";
import { audit, userDetail } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  return withAdmin(async () => {
    const { id } = await ctx.params;
    const d = isUuid(id) ? await userDetail(id) : null;
    return d ? ok(d) : fail("Not found", 404);
  });
}

/** Change a user's role ({ role: "admin" | "user" }) or suspension ({ suspended: boolean }). */
export async function PATCH(req: Request, ctx: Ctx) {
  return withAdmin(async (admin) => {
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("Not found", 404);
    const body = await readJson(req);
    const db = await getDb();
    const [target] = await db.select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, suspendedAt: schema.users.suspendedAt })
      .from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (!target) return fail("Not found", 404);
    if (target.id === admin.id) return fail("You can't change your own role or suspend yourself.");

    if (body?.role === "admin" || body?.role === "user") {
      if (body.role !== target.role) {
        await db.update(schema.users).set({ role: body.role }).where(eq(schema.users.id, id));
        await audit(admin, body.role === "admin" ? "user.make_admin" : "user.remove_admin", "user", id, target.email);
      }
    } else if (typeof body?.suspended === "boolean") {
      if (body.suspended && !target.suspendedAt) {
        await db.transaction(async (tx) => {
          await tx.update(schema.users).set({ suspendedAt: new Date() }).where(eq(schema.users.id, id));
          await tx.delete(schema.sessions).where(eq(schema.sessions.userId, id)); // signs them out everywhere
        });
        await audit(admin, "user.suspend", "user", id, target.email);
      } else if (!body.suspended && target.suspendedAt) {
        await db.update(schema.users).set({ suspendedAt: null }).where(eq(schema.users.id, id));
        await audit(admin, "user.unsuspend", "user", id, target.email);
      }
    } else {
      return fail("Send { role } or { suspended }.");
    }
    return ok({ ok: true });
  });
}

/** Permanently delete a user and everything they own. */
export async function DELETE(_req: Request, ctx: Ctx) {
  return withAdmin(async (admin) => {
    const { id } = await ctx.params;
    if (!isUuid(id)) return fail("Not found", 404);
    if (id === admin.id) return fail("You can't delete your own account here.");
    const db = await getDb();
    const [gone] = await db.delete(schema.users).where(eq(schema.users.id, id)).returning({ email: schema.users.email, username: schema.users.username });
    if (!gone) return fail("Not found", 404);
    await audit(admin, "user.delete", "user", id, `${gone.email} (@${gone.username})`);
    return ok({ ok: true });
  });
}
