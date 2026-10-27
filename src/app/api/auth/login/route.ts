import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSession, isAdminEmail, verifyPassword } from "@/lib/auth";
import { fail, ok, readJson, str } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail("Invalid request");
  const id = str(body.email, 200).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!id || !password) return fail("Enter your email (or username) and password.");
  try {
    const db = await getDb();
    const col = id.includes("@") ? schema.users.email : schema.users.username;
    const [user] = await db.select().from(schema.users).where(eq(col, id)).limit(1);
    if (!user || !(await verifyPassword(password, user.passwordHash))) return fail("Wrong email or password.", 401);
    if (user.suspendedAt) return fail("This account is suspended. Contact the CareerQuest team if you think this is a mistake.", 403);
    if (user.role !== "admin" && isAdminEmail(user.email)) await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id));
    await createSession(user.id);
    return ok({ user: { id: user.id, username: user.username, name: user.name } });
  } catch (e) {
    console.error("[careerquest] login failed", e);
    return fail("Couldn't log you in right now. Try again.", 500);
  }
}
