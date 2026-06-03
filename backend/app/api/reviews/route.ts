import { desc } from "drizzle-orm";
import db from "@/app/utils/db";
import { reviews } from "@/app/utils/db/schema";

export async function GET() {
  const rows = await db
    .select({
      id: reviews.id,
      title: reviews.title,
      status: reviews.status,
      createdAt: reviews.createdAt,
    })
    .from(reviews)
    .orderBy(desc(reviews.createdAt));

  return Response.json(rows);
}
