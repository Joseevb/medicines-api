// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: `file:./${process.env.DB_FILE_NAME!}`,
	},
});
