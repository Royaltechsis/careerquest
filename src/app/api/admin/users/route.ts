import { ok, withAdmin } from "@/lib/http";
import { listUsers } from "@/lib/admin";

/** GET /api/admin/users?q=&page= — searchable, paginated user list. */
export async function GET(req: Request) {
  return withAdmin(async () => {
    const url = new URL(req.url);
    const page = Math.max(1, Math.min(10000, Number(url.searchParams.get("page")) || 1));
    return ok(await listUsers((url.searchParams.get("q") || "").slice(0, 100), page));
  });
}
