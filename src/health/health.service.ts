import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../database/schema";
import { RedisService } from "../redis/redis.service";

type Database = NodePgDatabase<typeof schema>;

@Injectable()
export class HealthService {
  constructor(
    @Inject("DRIZZLE_DB")
    private readonly db: Database,
    private readonly redisService: RedisService,
  ) {}

  async check() {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();

    return {
      status: database.ok && redis.ok ? "ok" : "degraded",
      database,
      redis,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase() {
    try {
      await this.db.execute(sql`select 1`);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  private async checkRedis() {
    try {
      const pong = await this.redisService.ping();
      return { ok: pong === "PONG" };
    } catch {
      return { ok: false };
    }
  }
}
