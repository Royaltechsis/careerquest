import "server-only";
import { NextResponse } from "next/server";
import { getUser, type SessionUser } from "./auth";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try { return (await req.json()) as T; } catch { return null; }
}

/** Runs the handler with the signed-in user, or answers 401. */
export async function withUser(fn: (user: SessionUser) => Promise<Response>): Promise<Response> {
  try {
    const user = await getUser();
    if (!user) return fail("Not signed in", 401);
    return await fn(user);
  } catch (e) {
    console.error("[careerquest] API error", e);
    return fail("Something went wrong on our side. Try again.", 500);
  }
}

export const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const strList = (v: unknown, allowed?: Set<string> | readonly string[], max = 30) => {
  if (!Array.isArray(v)) return [] as string[];
  const allow = allowed ? new Set(allowed) : null;
  return [...new Set(v.filter((x): x is string => typeof x === "string" && x.length <= 120 && (!allow || allow.has(x))))].slice(0, max);
};
