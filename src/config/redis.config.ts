export default () => ({
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  sessionTtlSeconds: parseInt(process.env.SESSION_TTL_SECONDS ?? "86400", 10),
});
