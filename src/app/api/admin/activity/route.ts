import { ok, withAdmin } from "@/lib/http";
import { listActivity } from "@/lib/admin";

export async function GET() {
  return withAdmin(async () => ok({ activity: await listActivity() }));
}
