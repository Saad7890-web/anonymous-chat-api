import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../redis/redis.service";
import type { AuthSession } from "./types/auth-session.type";

@Injectable()
export class SessionStore {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private sessionKey(token: string): string {
    return `session:${token}`;
  }

  private ttlSeconds(): number {
    return this.configService.get<number>("sessionTtlSeconds", 86400);
  }

  async create(token: string, session: AuthSession): Promise<void> {
    await this.redisService.setJson(
      this.sessionKey(token),
      session,
      this.ttlSeconds(),
    );
  }

  async get(token: string): Promise<AuthSession | null> {
    return this.redisService.getJson<AuthSession>(this.sessionKey(token));
  }

  async delete(token: string): Promise<void> {
    await this.redisService.del(this.sessionKey(token));
  }
}
