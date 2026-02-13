import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const sqlite = new Database(process.env.DB_FILE_NAME!);
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: "./drizzle" });

export { db };
