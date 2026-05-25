import { env } from "./env";

export const appConfig = {
  env: env.NODE_ENV,
  host: '0.0.0.0',
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  apiVersion: env.API_VERSION,
  appUrl: env.APP_URL,
  featureFlags: {
    autoPublishReviews: true
  }
} as const;
