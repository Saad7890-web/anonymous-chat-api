import { Module } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { AuthModule } from "../auth/auth.module";
import { RedisModule } from "../redis/redis.module";
import { RoomsController } from "./rooms.controller";
import { RoomsRepository } from "./rooms.repository";
import { RoomsService } from "./rooms.service";

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsRepository, AuthGuard],
})
export class RoomsModule {}
