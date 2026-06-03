import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const client = postgres(process.env.DATABASE_URL, {
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

const db = drizzle(client, { schema });

export default db;
