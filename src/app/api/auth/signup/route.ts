import { eq, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { createSession, hashPassword, RESERVED_USERNAMES, USERNAME_RE } from "@/lib/auth";
import { fail, ok, readJson, str } from "@/lib/http";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return fail("Invalid request");
  const name = str(body.name, 60);
  const username = str(body.username, 30).toLowerCase();
  const email = str(body.email, 200).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!name) return fail("Add your first name.");
  if (!USERNAME_RE.test(username) || RESERVED_USERNAMES.has(username)) return fail("Username: 3–30 characters, lowercase letters, numbers, - or _.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  if (password.length < 8) return fail("Password must be at least 8 characters.");
  if (password.length > 200) return fail("Password is too long.");
  try {
    const db = await getDb();
    const taken = await db.select({ email: schema.users.email, username: schema.users.username }).from(schema.users)
      .where(or(eq(schema.users.email, email), eq(schema.users.username, username))).limit(2);
    if (taken.some((t) => t.email === email)) return fail("An account with this email already exists. Log in instead.", 409);
    if (taken.some((t) => t.username === username)) return fail("That username is taken. Try another.", 409);
    const [user] = await db.insert(schema.users).values({ name, username, email, passwordHash: await hashPassword(password) })
      .returning({ id: schema.users.id, username: schema.users.username, name: schema.users.name });
    await db.insert(schema.profiles).values({ userId: user.id }).onConflictDoNothing();
    await createSession(user.id);
    return ok({ user }, 201);
  } catch (e) {
    console.error("[careerquest] signup failed", e);
    return fail("Couldn't create your account right now. Try again.", 500);
  }
}
