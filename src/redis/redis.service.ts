import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import type { RedisClientType } from "redis";
import { ROOM_ACTIVE_USERS_KEY_PREFIX } from "../common/constants/chat.constants";
import { REDIS_CLIENT } from "./redis.constants";

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly client: RedisClientType,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);

    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, payload, { EX: ttlSeconds });
      return;
    }

    await this.client.set(key, payload);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return count > 0;
  }

  async publish(channel: string, payload: unknown): Promise<number> {
    return this.client.publish(channel, JSON.stringify(payload));
  }

  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.client.sAdd(key, members);
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    return this.client.sRem(key, members);
  }

  async sMembers(key: string): Promise<string[]> {
    return this.client.sMembers(key);
  }

  async sCard(key: string): Promise<number> {
    return this.client.sCard(key);
  }

  async getActiveUserCount(roomId: string): Promise<number> {
    return this.sCard(this.activeUsersKey(roomId));
  }

  async getActiveUsers(roomId: string): Promise<string[]> {
    return this.sMembers(this.activeUsersKey(roomId));
  }

  async addActiveUser(roomId: string, username: string): Promise<number> {
    return this.sAdd(this.activeUsersKey(roomId), username);
  }

  async removeActiveUser(roomId: string, username: string): Promise<number> {
    return this.sRem(this.activeUsersKey(roomId), username);
  }

  private activeUsersKey(roomId: string): string {
    return `${ROOM_ACTIVE_USERS_KEY_PREFIX}${roomId}`;
  }
}
