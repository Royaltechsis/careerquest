import "server-only";
import { str } from "./http";

const SOURCE_RE = /^(manual|sim:[a-z]+)$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s: unknown): s is string => typeof s === "string" && UUID_RE.test(s);

/** Validates portfolio fields from a request body. Only fields present are returned (for PATCH). */
export function portfolioFields(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, max] of [["title", 160], ["problem", 2000], ["approach", 4000], ["skills", 400], ["evidence", 300], ["career", 80]] as const) {
    if (k in b) out[k] = str(b[k], max);
  }
  if ("link" in b) {
    const link = str(b.link, 500);
    if (link && !/^https?:\/\/\S+\.\S+/.test(link)) throw new Error("Evidence link should start with https://");
    out.link = link;
  }
  if ("public" in b) out.isPublic = !!b.public;
  if ("source" in b) { const s = str(b.source, 40); out.source = SOURCE_RE.test(s) ? s : "manual"; }
  return out;
}
