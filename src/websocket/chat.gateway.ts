import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
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
import { Server, Socket } from "socket.io";
import {
  REDIS_CHANNEL_MESSAGE_NEW,
  REDIS_CHANNEL_ROOM_DELETED,
} from "../common/constants/chat.constants";
import { REDIS_PUB_CLIENT, REDIS_SUB_CLIENT } from "../redis/redis.constants";
import { RoomPresenceService } from "./room-presence.service";
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
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit
{
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly roomPresenceService: RoomPresenceService,
    @Inject(REDIS_PUB_CLIENT)
    private readonly pubClient: any,
    @Inject(REDIS_SUB_CLIENT)
    private readonly subClient: any,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.subClient.isOpen) {
      await this.subClient.connect();
    }
  }

  afterInit(server: Server): void {
    const adapterHost =
      typeof (server as any).adapter === "function"
        ? server
        : (server as any).server;

    adapterHost.adapter(createAdapter(this.pubClient, this.subClient));

    this.server = server;
    void this.subscribeToRedisChannels();
  }

  async handleConnection(client: Socket): Promise<void> {
    const context = client.data.context as SocketContext | undefined;

    if (!context) {
      client.disconnect(true);
      return;
    }

    const { roomId, username } = context;

    await client.join(roomId);

    const { isFirstSocket, activeUsers } =
      await this.roomPresenceService.addSocket(roomId, username, client.id);

    client.emit("room:joined", { activeUsers });

    if (isFirstSocket) {
      client.to(roomId).emit("room:user_joined", {
        username,
        activeUsers,
      });
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.cleanupSocket(client, false);
  }

  @SubscribeMessage("room:leave")
  async handleRoomLeave(@ConnectedSocket() client: Socket): Promise<void> {
    await this.cleanupSocket(client, true);
    client.disconnect(true);
  }

  private async cleanupSocket(
    client: Socket,
    initiatedByLeaveEvent: boolean,
  ): Promise<void> {
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
    client.data.leaveInitiated = initiatedByLeaveEvent;
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
