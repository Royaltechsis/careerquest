import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, schema } from "@/db";
import { fail, ok, readJson, withUser } from "@/lib/http";
import { isUuid, portfolioFields } from "@/lib/portfolio";
import { toPortfolioDTO } from "@/lib/state";

export async function GET() {
  return withUser(async (user) => {
    const db = await getDb();
    const rows = await db.select().from(schema.portfolioItems).where(eq(schema.portfolioItems.userId, user.id)).orderBy(desc(schema.portfolioItems.createdAt));
    return ok({ items: rows.map(toPortfolioDTO) });
  });
}

/** Create a portfolio item. The client may supply its own UUID (optimistic UI). */
export async function POST(req: Request) {
  return withUser(async (user) => {
    const body = await readJson(req);
    if (!body) return fail("Invalid request");
    let fields;
    try { fields = portfolioFields(body); } catch (e) { return fail((e as Error).message); }
    const id = isUuid(body.id) ? body.id : randomUUID();
    const db = await getDb();
    const [row] = await db.insert(schema.portfolioItems)
      .values({ ...(fields as object), id, userId: user.id })
      .onConflictDoNothing()
      .returning();
    if (!row) return fail("An item with this id already exists", 409);
    return ok({ item: toPortfolioDTO(row) }, 201);
  });
}
