import fastify, { FastifyInstance } from "fastify";
import { logger } from "./infrastructure/logger";
import { env } from "./infrastructure/env";
import { globalErrorHandler } from "./infrastructure/error-handler";
import { securityPlugin } from "./infrastructure/security";
import { rateLimitPlugin } from "./infrastructure/rate-limit";
import { registerHealthRoutes } from "./infrastructure/health-monitor";
import { jwtPlugin } from "./modules/auth/jwt.service";
import { authRoutes } from "./modules/auth/auth.routes";
import { workspaceRoutes } from "./modules/workspaces/workspace.routes";
import { repositoryRoutes } from "./modules/repositories/repository.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";
import { activityRoutes } from "./modules/activity/activity.routes";
import { timelineRoutes } from "./modules/timeline/timeline.routes";
import { demoRoutes } from "./demo/demo.routes";

export function buildApp(): FastifyInstance {
  const app = fastify({
    logger: env.NODE_ENV === "development" ? logger : true,
    disableRequestLogging: true, 
  });

  // Global Error Handler
  app.setErrorHandler(globalErrorHandler);

  // Register Infrastructure Plugins
  app.register(securityPlugin);
  app.register(rateLimitPlugin);
  app.register(jwtPlugin);

  // Setup core observability and logging hooks
  app.addHook("onRequest", async (req, reply) => {
    req.log.info({ req: { method: req.method, url: req.url } }, "incoming request");
  });

  app.addHook("onResponse", async (req, reply) => {
    req.log.info({ res: { statusCode: reply.statusCode }, responseTime: reply.elapsedTime }, "request completed");
  });

  // Register Routes
  app.register(registerHealthRoutes);
  
  app.register(async (api) => {
    api.register(authRoutes, { prefix: "/auth" });
    api.register(workspaceRoutes, { prefix: "/workspaces" });
    api.register(repositoryRoutes, { prefix: "/repositories" });
    api.register(notificationRoutes, { prefix: "/notifications" });
    api.register(demoRoutes, { prefix: "/demo" });
    api.register(activityRoutes, { prefix: "/activity" }); // We use /activity, but inside it binds to /workspaces/... internally, wait!
    // Actually in activity.routes.ts I wrote: fastify.get("/workspaces/:workspaceId/activity")
    // If I prefix it with /activity, the route becomes /api/v1/activity/workspaces/:workspaceId/activity
    // It is better to mount it without a prefix or change the route in activity.routes.ts
    // For now I'll register timeline and activity without prefix if they have complex structures
  }, { prefix: "/api/v1" });

  app.register(async (api2) => {
    api2.register(activityRoutes);
    api2.register(timelineRoutes);
  }, { prefix: "/api/v1" });

  return app;
}
