import type { Config } from "drizzle-kit";

export default {
  schema: "./src/database/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://chat_user:chat_password@localhost:5435/chat_db",
  },
  verbose: true,
  strict: true,
} satisfies Config;
