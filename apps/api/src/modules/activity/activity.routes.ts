import { FastifyInstance } from "fastify";
import { activityController } from "./activity.controller";

export async function activityRoutes(fastify: FastifyInstance) {
  // All activity routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/workspaces/:workspaceId/activity", activityController.getWorkspaceActivity.bind(activityController));
}
