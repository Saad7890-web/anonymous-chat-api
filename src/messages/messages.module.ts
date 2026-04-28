import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { RedisModule } from "../redis/redis.module";
import { MessagesController } from "./messages.controller";
import { MessagesRepository } from "./messages.repository";
import { MessagesService } from "./messages.service";

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesRepository],
})
export class MessagesModule {}
