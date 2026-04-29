import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RedisModule } from "../redis/redis.module";
import { RoomsModule } from "../rooms/rooms.module";
import { ChatGateway } from "./chat.gateway";
import { RoomPresenceService } from "./room-presence.service";
import { SocketAuthService } from "./socket-auth.service";

@Module({
  imports: [AuthModule, RoomsModule, RedisModule],
  providers: [ChatGateway, SocketAuthService, RoomPresenceService],
})
export class WebSocketModule {}
