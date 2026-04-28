import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id").notNull(),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    roomCreatedAtIdx: index("messages_room_created_at_idx").on(
      table.roomId,
      table.createdAt,
    ),
    roomIdIdx: index("messages_room_id_idx").on(table.roomId),
  }),
);
