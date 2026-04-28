import { Module } from "@nestjs/common";
import { RedisModule } from "../redis/redis.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionStore } from "./session.store";
import { UsersRepository } from "./users.repository";

@Module({
  imports: [RedisModule],
  controllers: [AuthController],
  providers: [AuthService, SessionStore, UsersRepository],
  exports: [AuthService, SessionStore],
})
export class AuthModule {}
