import { createClient } from "redis";
import {
  REDIS_CLIENT,
  REDIS_PUB_CLIENT,
  REDIS_SUB_CLIENT,
} from "./redis.constants";

function buildClient() {
  return createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
  });
}

async function connectClient(client: ReturnType<typeof buildClient>) {
  client.on("error", (error) => {
    console.error("Redis client error:", error);
  });

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export const redisClientProvider = {
  provide: REDIS_CLIENT,
  useFactory: async () => {
    const client = buildClient();
    return connectClient(client);
  },
};

export const redisPubClientProvider = {
  provide: REDIS_PUB_CLIENT,
  useFactory: async () => {
    const client = buildClient();
    return connectClient(client);
  },
};

export const redisSubClientProvider = {
  provide: REDIS_SUB_CLIENT,
  useFactory: async () => {
    const client = buildClient();
    return connectClient(client);
  },
};
