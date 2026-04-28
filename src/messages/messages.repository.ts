import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, lt, or } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { generatePrefixedId } from "../common/utils/id.util";
import * as schema from "../database/schema";
import { messages, rooms, users } from "../database/schema";
import type { MessageRecord } from "./types/message-record.type";

type Database = NodePgDatabase<typeof schema>;

@Injectable()
export class MessagesRepository {
  constructor(
    @Inject("DRIZZLE_DB")
    private readonly db: Database,
  ) {}

  async findRoomById(roomId: string) {
    const rows = await this.db
      .select({ id: rooms.id })
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findMessageById(messageId: string) {
    const rows = await this.db
      .select({
        id: messages.id,
        roomId: messages.roomId,
        userId: messages.userId,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(
    roomId: string,
    userId: string,
    content: string,
  ): Promise<MessageRecord> {
    const rows = await this.db
      .insert(messages)
      .values({
        id: generatePrefixedId("msg"),
        roomId,
        userId,
        content,
      })
      .returning({
        id: messages.id,
        roomId: messages.roomId,
        userId: messages.userId,
        content: messages.content,
        createdAt: messages.createdAt,
      });

    const created = rows[0]!;

    const userRows = await this.db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      id: created.id,
      roomId: created.roomId,
      username: userRows[0]?.username ?? "unknown",
      content: created.content,
      createdAt: created.createdAt,
    };
  }

  async findPaginatedByRoom(
    roomId: string,
    limit: number,
    before?: string,
  ): Promise<{
    messages: MessageRecord[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    let beforeMessage: Awaited<ReturnType<typeof this.findMessageById>> | null =
      null;

    if (before) {
      beforeMessage = await this.findMessageById(before);

      if (!beforeMessage) {
        return { messages: [], hasMore: false, nextCursor: null };
      }
    }

    const whereClause = beforeMessage
      ? and(
          eq(messages.roomId, roomId),
          or(
            lt(messages.createdAt, beforeMessage.createdAt),
            and(
              eq(messages.createdAt, beforeMessage.createdAt),
              lt(messages.id, beforeMessage.id),
            ),
          ),
        )
      : eq(messages.roomId, roomId);

    const rows = await this.db
      .select({
        id: messages.id,
        roomId: messages.roomId,
        userId: messages.userId,
        content: messages.content,
        createdAt: messages.createdAt,
        username: users.username,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(whereClause)
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);
    const orderedAscending = [...pageRows].reverse();

    return {
      messages: orderedAscending.map((row) => ({
        id: row.id,
        roomId: row.roomId,
        username: row.username,
        content: row.content,
        createdAt: row.createdAt,
      })),
      hasMore,
      nextCursor:
        hasMore && orderedAscending.length > 0 ? orderedAscending[0]!.id : null,
    };
  }
}
