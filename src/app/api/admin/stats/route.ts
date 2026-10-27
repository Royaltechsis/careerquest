import { ok, withAdmin } from "@/lib/http";
import { overviewStats } from "@/lib/admin";

export async function GET() {
  return withAdmin(async () => ok(await overviewStats()));
}
