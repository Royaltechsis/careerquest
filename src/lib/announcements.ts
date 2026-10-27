import "server-only";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Announcement } from "@/components/views/Dashboard";

/** Active admin announcements for the student dashboard, newest first. */
export async function activeAnnouncements(): Promise<Announcement[]> {
  const db = await getDb();
  const rows = await db.select({ id: schema.announcements.id, title: schema.announcements.title, body: schema.announcements.body })
    .from(schema.announcements).where(eq(schema.announcements.active, true)).orderBy(desc(schema.announcements.createdAt)).limit(3);
  return rows;
}
