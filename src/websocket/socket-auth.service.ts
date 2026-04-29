import { Injectable } from "@nestjs/common";
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
    const sessionToken = this.extractSingleString(token, "token");
    const targetRoomId = this.extractSingleString(roomId, "roomId");

    const session = await this.authService.validateToken(sessionToken);

    await this.roomsService.getRoomById(targetRoomId);

    return {
      userId: session.userId,
      username: session.username,
      roomId: targetRoomId,
    };
  }

  private extractSingleString(value: unknown, fieldName: string): string {
    if (typeof value !== "string") {
      throw new Error(
        JSON.stringify({
          code: fieldName === "token" ? "UNAUTHORIZED" : "ROOM_NOT_FOUND",
          message:
            fieldName === "token"
              ? "Missing or expired session token"
              : "Room with the provided id does not exist",
        }),
      );
    }

    const trimmed = value.trim();

    if (!trimmed) {
      throw new Error(
        JSON.stringify({
          code: fieldName === "token" ? "UNAUTHORIZED" : "ROOM_NOT_FOUND",
          message:
            fieldName === "token"
              ? "Missing or expired session token"
              : "Room with the provided id does not exist",
        }),
      );
    }

    return trimmed;
  }
}
