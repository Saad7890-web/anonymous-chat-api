import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const drizzleProvider = {
  provide: "DRIZZLE_DB",
  useFactory: () => {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    return drizzle(pool);
  },
};
