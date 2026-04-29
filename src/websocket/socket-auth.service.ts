import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { RoomsService } from "../rooms/rooms.service";
import type { SocketContext } from "./types/socket-context.type";

@Injectable()
export class SocketAuthService {
  constructor(
    private readonly authService: AuthService,
    private readonly roomsService: RoomsService,
  ) {}

  async validateConnection(
    token: unknown,
    roomId: unknown,
  ): Promise<SocketContext> {
    const sessionToken = this.extractString(token, "token");
    const targetRoomId = this.extractString(roomId, "roomId");

    const session = await this.authService.validateToken(sessionToken);

    try {
      await this.roomsService.getRoomById(targetRoomId);
    } catch {
      throw new NotFoundException({
        code: "ROOM_NOT_FOUND",
        message: `Room with id ${targetRoomId} does not exist`,
      });
    }

    return {
      userId: session.userId,
      username: session.username,
      roomId: targetRoomId,
    };
  }

  private extractString(value: unknown, fieldName: "token" | "roomId"): string {
    if (typeof value !== "string" || !value.trim()) {
      if (fieldName === "token") {
        throw new UnauthorizedException({
          code: "UNAUTHORIZED",
          message: "Missing or expired session token",
        });
      }

      throw new NotFoundException({
        code: "ROOM_NOT_FOUND",
        message: "Room with the provided id does not exist",
      });
    }

    return value.trim();
  }
}
