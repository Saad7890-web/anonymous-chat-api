import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { generatePrefixedId } from "../common/utils/id.util";
import * as schema from "../database/schema";
import { users } from "../database/schema";

type Database = NodePgDatabase<typeof schema>;

@Injectable()
export class UsersRepository {
  constructor(
    @Inject("DRIZZLE_DB")
    private readonly db: Database,
  ) {}

  async findByUsername(username: string) {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return rows[0] ?? null;
  }

  async findById(id: string) {
    const rows = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async create(username: string) {
    const id = generatePrefixedId("usr");

    const rows = await this.db
      .insert(users)
      .values({
        id,
        username,
      })
      .returning();

    return rows[0];
  }
}
