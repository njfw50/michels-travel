import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// DOGMA 6: Detect database type automatically from DATABASE_URL
const isSQLite = connectionString.startsWith("sqlite:") || connectionString.startsWith("file:");

export default defineConfig({
  schema: isSQLite ? "./drizzle/schema.sqlite.ts" : "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: isSQLite ? "sqlite" : "mysql",
  dbCredentials: isSQLite
    ? {
        url: connectionString.replace(/^(sqlite|file):/, "").trim(),
      }
    : {
        url: connectionString,
      },
});
