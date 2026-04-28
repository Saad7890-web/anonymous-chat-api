import { Global, Module } from "@nestjs/common";
import { redisClientProvider } from "./redis.provider";
import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [redisClientProvider, RedisService],
  exports: [redisClientProvider, RedisService],
})
export class RedisModule {}
