import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createHmac, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "@/db";

export const SESSION_COOKIE = "cq_session";
const SESSION_DAYS = 30;

import type { AppUser } from "./models";

export type SessionUser = AppUser;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    console.warn("[careerquest] SESSION_SECRET is missing or shorter than 16 chars. Set it in your environment.");
  }
  return "careerquest-dev-secret-change-me";
}
const hashToken = (token: string) => createHmac("sha256", secret()).update(token).digest("hex");

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db.insert(schema.sessions).values({ id: hashToken(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)));
  }
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for this request, or null. */
export async function getUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const rows = await db
    .select({ id: schema.users.id, email: schema.users.email, username: schema.users.username, name: schema.users.name, role: schema.users.role, lastActiveAt: schema.users.lastActiveAt })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, hashToken(token)), gt(schema.sessions.expiresAt, new Date()), isNull(schema.users.suspendedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const { lastActiveAt, ...user } = row;
  // "Last active" for the admin panel, written at most every few minutes.
  if (!lastActiveAt || Date.now() - lastActiveAt.getTime() > ACTIVE_WRITE_MS) {
    await db.update(schema.users).set({ lastActiveAt: new Date() }).where(eq(schema.users.id, user.id));
  }
  return user;
}

const ACTIVE_WRITE_MS = 5 * 60 * 1000;

/** Emails listed in ADMIN_EMAILS (comma-separated) become admins when they sign up or log in. */
export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/** getUser, memoised for one server render (the layout and the page share one lookup). */
export const currentUser = cache(getUser);

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,28})[a-z0-9]$/;
export const RESERVED_USERNAMES = new Set(["admin", "api", "login", "signup", "logout", "me", "p", "careerquest", "support", "help", "settings", "dashboard"]);
