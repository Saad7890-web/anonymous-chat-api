import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import { validateEnvironment } from "./config/env.validation";
import redisConfig from "./config/redis.config";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig],
      validate: validateEnvironment,
    }),
    DatabaseModule,
  ],
})
export class AppModule {}
