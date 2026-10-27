import { getDb, schema } from "@/db";
import { fail, ok, readJson, str, withAdmin } from "@/lib/http";
import { audit, listAnnouncements } from "@/lib/admin";

export async function GET() {
  return withAdmin(async () => ok({ announcements: await listAnnouncements() }));
}

/** Post a dashboard banner: { title, body, active }. */
export async function POST(req: Request) {
  return withAdmin(async (admin) => {
    const body = await readJson(req);
    const title = str(body?.title, 120);
    if (!title) return fail("Give the announcement a title.");
    const db = await getDb();
    const [row] = await db.insert(schema.announcements)
      .values({ title, body: str(body?.body, 600), active: body?.active !== false, createdBy: admin.id }).returning();
    await audit(admin, "announcement.create", "announcement", row.id, title);
    return ok({ announcement: row }, 201);
  });
}
