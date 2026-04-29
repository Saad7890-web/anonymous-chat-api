import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { createAdapter } from "@socket.io/redis-adapter";
import { Namespace, Socket } from "socket.io";
import {
  REDIS_CHANNEL_MESSAGE_NEW,
  REDIS_CHANNEL_ROOM_DELETED,
} from "../common/constants/chat.constants";
import { REDIS_PUB_CLIENT, REDIS_SUB_CLIENT } from "../redis/redis.constants";
import { RoomPresenceService } from "./room-presence.service";
import { SocketAuthService } from "./socket-auth.service";
import type { SocketContext } from "./types/socket-context.type";

type MessageNewPayload = {
  roomId: string;
  message: {
    id: string;
    username: string;
    content: string;
    createdAt: string;
  };
};

type RoomDeletedPayload = {
  roomId: string;
};

@WebSocketGateway({
  namespace: "/chat",
  cors: {
    origin: true,
    credentials: true,
  },
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private server!: Namespace;

  constructor(
    private readonly socketAuthService: SocketAuthService,
    private readonly roomPresenceService: RoomPresenceService,
    @Inject(REDIS_PUB_CLIENT)
    private readonly pubClient: any,
    @Inject(REDIS_SUB_CLIENT)
    private readonly subClient: any,
  ) {}

  afterInit(server: Namespace): void {
    const io = ((server as any).server ?? server) as any;
    io.adapter(createAdapter(this.pubClient, this.subClient));

    this.server = server;
    void this.subscribeToRedisChannels();
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ?? client.handshake.query.token;
      const roomId =
        client.handshake.auth?.roomId ?? client.handshake.query.roomId;

      const context = await this.socketAuthService.validateConnection(
        token,
        roomId,
      );
      client.data.context = context;

      const { roomId: resolvedRoomId, username } = context;

      await client.join(resolvedRoomId);

      const { isFirstSocket, activeUsers } =
        await this.roomPresenceService.addSocket(
          resolvedRoomId,
          username,
          client.id,
        );

      client.emit("room:joined", { activeUsers });

      if (isFirstSocket) {
        client.to(resolvedRoomId).emit("room:user_joined", {
          username,
          activeUsers,
        });
      }
    } catch (error: any) {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.cleanupSocket(client);
  }

  @SubscribeMessage("room:leave")
  async handleRoomLeave(@ConnectedSocket() client: Socket): Promise<void> {
    await this.cleanupSocket(client);
    client.disconnect(true);
  }

  private async cleanupSocket(client: Socket): Promise<void> {
    const context = client.data.context as SocketContext | undefined;

    if (!context || client.data.cleanedUp === true) {
      return;
    }

    const { roomId, username } = context;

    const { isLastSocket, activeUsers } =
      await this.roomPresenceService.removeSocket(roomId, username, client.id);

    if (isLastSocket) {
      client.to(roomId).emit("room:user_left", {
        username,
        activeUsers,
      });
    }

    client.data.cleanedUp = true;
  }

  private async subscribeToRedisChannels(): Promise<void> {
    await this.subClient.subscribe(
      REDIS_CHANNEL_MESSAGE_NEW,
      async (rawMessage: string) => {
        try {
          const payload = JSON.parse(rawMessage) as MessageNewPayload;

          this.server.local
            .to(payload.roomId)
            .emit("message:new", payload.message);
        } catch (error) {
          this.logger.error(
            "Failed to handle message:new event from Redis",
            error as Error,
          );
        }
      },
    );

    await this.subClient.subscribe(
      REDIS_CHANNEL_ROOM_DELETED,
      async (rawMessage: string) => {
        try {
          const payload = JSON.parse(rawMessage) as RoomDeletedPayload;

          await this.roomPresenceService.clearRoom(payload.roomId);

          this.server.local.to(payload.roomId).emit("room:deleted", {
            roomId: payload.roomId,
          });
        } catch (error) {
          this.logger.error(
            "Failed to handle room:deleted event from Redis",
            error as Error,
          );
        }
      },
    );
  }
}
