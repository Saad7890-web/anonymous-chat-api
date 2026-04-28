import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const rooms = pgTable(
  "rooms",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameUnique: uniqueIndex("rooms_name_unique").on(table.name),
  }),
);
