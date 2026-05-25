import { FastifyInstance } from "fastify";
import { timelineController } from "./timeline.controller";

export async function timelineRoutes(fastify: FastifyInstance) {
  // All timeline routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/pull-requests/:prId/timeline", timelineController.getPullRequestTimeline.bind(timelineController));
}
