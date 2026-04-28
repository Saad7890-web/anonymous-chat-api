import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import { validateEnvironment } from "./config/env.validation";
import redisConfig from "./config/redis.config";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { RoomsModule } from "./rooms/rooms.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
      validate: validateEnvironment,
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    RoomsModule,
  ],
})
export class AppModule {}
