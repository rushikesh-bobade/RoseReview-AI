import { buildApp } from "./app";
import { env } from "./infrastructure/env";
import { logger } from "./infrastructure/logger";

const start = async () => {
  try {
    const app = buildApp();
    
    // Listen on all interfaces so Docker/Vercel handles it correctly
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      `🚀 RoseReview API Server listening at http://localhost:${env.PORT}`
    );
  } catch (err) {
    logger.fatal({ err }, "Failed to start API server");
    process.exit(1);
  }
};

start();
