export default () => ({
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  appPrefix: process.env.APP_PREFIX ?? "api/v1",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
});
