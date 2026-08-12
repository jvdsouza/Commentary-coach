import { eq } from "drizzle-orm";
import db from "@/app/utils/db";
import { users } from "./schema";

export interface User {
  id: string;
  name: string;
  accessCodeHash: string;
}

export async function findUserByName(name: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.name, name)).limit(1);
  return row ?? null;
}

export async function createUser(name: string, accessCodeHash: string): Promise<string> {
  const [row] = await db
    .insert(users)
    .values({ name, accessCodeHash })
    .returning({ id: users.id });
  return row.id;
}
