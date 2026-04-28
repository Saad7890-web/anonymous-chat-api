import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { generatePrefixedId } from "../common/utils/id.util";
import * as schema from "../database/schema";
import { messages, rooms, users } from "../database/schema";

type Database = NodePgDatabase<typeof schema>;

export type RoomRecord = {
  id: string;
  name: string;
  createdBy: string;
  createdByUserId: string;
  createdAt: Date;
};

@Injectable()
export class RoomsRepository {
  constructor(
    @Inject("DRIZZLE_DB")
    private readonly db: Database,
  ) {}

  async findAll(): Promise<RoomRecord[]> {
    return this.db
      .select({
        id: rooms.id,
        name: rooms.name,
        createdBy: users.username,
        createdByUserId: rooms.createdByUserId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(users, eq(rooms.createdByUserId, users.id))
      .orderBy(desc(rooms.createdAt));
  }

  async findById(roomId: string): Promise<RoomRecord | null> {
    const rows = await this.db
      .select({
        id: rooms.id,
        name: rooms.name,
        createdBy: users.username,
        createdByUserId: rooms.createdByUserId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(users, eq(rooms.createdByUserId, users.id))
      .where(eq(rooms.id, roomId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByName(name: string): Promise<RoomRecord | null> {
    const rows = await this.db
      .select({
        id: rooms.id,
        name: rooms.name,
        createdBy: users.username,
        createdByUserId: rooms.createdByUserId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(users, eq(rooms.createdByUserId, users.id))
      .where(eq(rooms.name, name))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(name: string, createdByUserId: string): Promise<RoomRecord> {
    const rows = await this.db
      .insert(rooms)
      .values({
        id: generatePrefixedId("room"),
        name,
        createdByUserId,
      })
      .returning({
        id: rooms.id,
        name: rooms.name,
        createdByUserId: rooms.createdByUserId,
        createdAt: rooms.createdAt,
      });

    const created = rows[0]!;

    const userRows = await this.db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, createdByUserId))
      .limit(1);

    return {
      ...created,
      createdBy: userRows[0]?.username ?? "unknown",
    };
  }

  async deleteRoomAndMessages(roomId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(messages).where(eq(messages.roomId, roomId));
      await tx.delete(rooms).where(eq(rooms.id, roomId));
    });
  }
}
