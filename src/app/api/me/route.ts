import { ok, withUser } from "@/lib/http";

export async function GET() {
  return withUser(async (user) => ok({ user }));
}
