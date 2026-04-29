import { Global, Module } from "@nestjs/common";
import {
  redisClientProvider,
  redisPubClientProvider,
  redisSubClientProvider,
} from "./redis.provider";
import { RedisService } from "./redis.service";

@Global()
@Module({
  providers: [
    redisClientProvider,
    redisPubClientProvider,
    redisSubClientProvider,
    RedisService,
  ],
  exports: [
    redisClientProvider,
    redisPubClientProvider,
    redisSubClientProvider,
    RedisService,
  ],
})
export class RedisModule {}
