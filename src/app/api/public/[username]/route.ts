import { fail, ok } from "@/lib/http";
import { getPublicPortfolio } from "@/lib/public-portfolio";

/** Public portfolio JSON (public items only). No auth. */
export async function GET(_req: Request, ctx: { params: Promise<{ username: string }> }) {
  const { username } = await ctx.params;
  try {
    const data = await getPublicPortfolio(username);
    if (!data) return fail("Not found", 404);
    return ok(data);
  } catch (e) {
    console.error("[careerquest] public portfolio failed", e);
    return fail("Something went wrong", 500);
  }
}
