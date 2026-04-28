import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { AuthSession } from "../auth/types/auth-session.type";
import { REDIS_CHANNEL_MESSAGE_NEW } from "../common/constants/chat.constants";
import { RedisService } from "../redis/redis.service";
import { MessagesRepository } from "./messages.repository";

@Injectable()
export class MessagesService {
  constructor(
    private readonly messagesRepository: MessagesRepository,
    private readonly redisService: RedisService,
  ) {}

  async listMessages(roomId: string, limit = 50, before?: string) {
    const room = await this.messagesRepository.findRoomById(roomId);

    if (!room) {
      throw new NotFoundException({
        code: "ROOM_NOT_FOUND",
        message: `Room with id ${roomId} does not exist`,
      });
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.messagesRepository.findPaginatedByRoom(
      roomId,
      safeLimit,
      before,
    );
  }

  async sendMessage(roomId: string, content: string, currentUser: AuthSession) {
    const room = await this.messagesRepository.findRoomById(roomId);

    if (!room) {
      throw new NotFoundException({
        code: "ROOM_NOT_FOUND",
        message: `Room with id ${roomId} does not exist`,
      });
    }

    const trimmed = content.trim();

    if (!trimmed) {
      throw new UnprocessableEntityException({
        code: "MESSAGE_TOO_LONG",
        message: "Message content must not exceed 1000 characters",
      });
    }

    if (trimmed.length > 1000) {
      throw new UnprocessableEntityException({
        code: "MESSAGE_TOO_LONG",
        message: "Message content must not exceed 1000 characters",
      });
    }

    const created = await this.messagesRepository.create(
      roomId,
      currentUser.userId,
      trimmed,
    );

    await this.redisService.publish(REDIS_CHANNEL_MESSAGE_NEW, {
      roomId: created.roomId,
      message: {
        id: created.id,
        username: created.username,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
      },
    });

    return {
      id: created.id,
      roomId: created.roomId,
      username: created.username,
      content: created.content,
      createdAt: created.createdAt,
    };
  }
}
