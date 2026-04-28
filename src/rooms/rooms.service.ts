import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthSession } from "../auth/types/auth-session.type";
import { REDIS_CHANNEL_ROOM_DELETED } from "../common/constants/chat.constants";
import { RedisService } from "../redis/redis.service";
import { RoomsRepository, type RoomRecord } from "./rooms.repository";

type RoomResponse = {
  id: string;
  name: string;
  createdBy: string;
  activeUsers: number;
  createdAt: Date;
};

@Injectable()
export class RoomsService {
  constructor(
    private readonly roomsRepository: RoomsRepository,
    private readonly redisService: RedisService,
  ) {}

  async listRooms(): Promise<{ rooms: RoomResponse[] }> {
    const rooms = await this.roomsRepository.findAll();

    const mapped = await Promise.all(
      rooms.map((room) => this.toRoomResponse(room)),
    );

    return { rooms: mapped };
  }

  async createRoom(
    dto: { name: string },
    currentUser: AuthSession,
  ): Promise<RoomResponse> {
    const existing = await this.roomsRepository.findByName(dto.name);

    if (existing) {
      throw new ConflictException({
        code: "ROOM_NAME_TAKEN",
        message: "A room with this name already exists",
      });
    }

    const created = await this.roomsRepository.create(
      dto.name,
      currentUser.userId,
    );
    return this.toRoomResponse(created);
  }

  async getRoomById(roomId: string): Promise<RoomResponse> {
    const room = await this.roomsRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException({
        code: "ROOM_NOT_FOUND",
        message: `Room with id ${roomId} does not exist`,
      });
    }

    return this.toRoomResponse(room);
  }

  async deleteRoom(
    roomId: string,
    currentUser: AuthSession,
  ): Promise<{ deleted: true }> {
    const room = await this.roomsRepository.findById(roomId);

    if (!room) {
      throw new NotFoundException({
        code: "ROOM_NOT_FOUND",
        message: `Room with id ${roomId} does not exist`,
      });
    }

    if (room.createdByUserId !== currentUser.userId) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Only the room creator can delete this room",
      });
    }

    await this.redisService.publish(REDIS_CHANNEL_ROOM_DELETED, { roomId });
    await this.roomsRepository.deleteRoomAndMessages(roomId);

    return { deleted: true };
  }

  private async toRoomResponse(room: RoomRecord): Promise<RoomResponse> {
    const activeUsers = await this.redisService.getActiveUserCount(room.id);

    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdBy,
      activeUsers,
      createdAt: room.createdAt,
    };
  }
}
