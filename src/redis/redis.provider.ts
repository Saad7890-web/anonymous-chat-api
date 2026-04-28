import { createClient } from "redis";
import { REDIS_CLIENT } from "./redis.constants";

export const redisClientProvider = {
  provide: REDIS_CLIENT,
  useFactory: async () => {
    const client = createClient({
      url: process.env.REDIS_URL ?? "redis://localhost:6379",
    });

    client.on("error", (error) => {
      console.error("Redis client error:", error);
    });

    await client.connect();
    return client;
  },
};
