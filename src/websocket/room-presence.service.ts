import { Injectable } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class RoomPresenceService {
  constructor(private readonly redisService: RedisService) {}

  private activeUsersKey(roomId: string): string {
    return `room:active_users:${roomId}`;
  }

  private userSocketsKey(roomId: string, username: string): string {
    return `room:user_sockets:${roomId}:${username}`;
  }

  async getActiveUsers(roomId: string): Promise<string[]> {
    return this.redisService.sMembers(this.activeUsersKey(roomId));
  }

  async addSocket(
    roomId: string,
    username: string,
    socketId: string,
  ): Promise<{ isFirstSocket: boolean; activeUsers: string[] }> {
    const userSocketsKey = this.userSocketsKey(roomId, username);
    const addedCount = await this.redisService.sAdd(userSocketsKey, socketId);

    if (addedCount === 1) {
      await this.redisService.sAdd(this.activeUsersKey(roomId), username);
    }

    return {
      isFirstSocket: addedCount === 1,
      activeUsers: await this.getActiveUsers(roomId),
    };
  }

  async removeSocket(
    roomId: string,
    username: string,
    socketId: string,
  ): Promise<{ isLastSocket: boolean; activeUsers: string[] }> {
    const userSocketsKey = this.userSocketsKey(roomId, username);

    await this.redisService.sRem(userSocketsKey, socketId);

    const remaining = await this.redisService.sCard(userSocketsKey);

    if (remaining === 0) {
      await this.redisService.del(userSocketsKey);
      await this.redisService.sRem(this.activeUsersKey(roomId), username);

      return {
        isLastSocket: true,
        activeUsers: await this.getActiveUsers(roomId),
      };
    }

    return {
      isLastSocket: false,
      activeUsers: await this.getActiveUsers(roomId),
    };
  }

  async clearRoom(roomId: string): Promise<void> {
    const usernames = await this.getActiveUsers(roomId);

    await Promise.all(
      usernames.map((username) =>
        this.redisService.del(this.userSocketsKey(roomId, username)),
      ),
    );

    await this.redisService.del(this.activeUsersKey(roomId));
  }
}
