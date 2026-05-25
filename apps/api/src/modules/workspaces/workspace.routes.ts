import { FastifyInstance } from "fastify";
import { workspaceController } from "./workspace.controller";

export async function workspaceRoutes(fastify: FastifyInstance) {
  // All workspace routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post("/", workspaceController.createWorkspace.bind(workspaceController));
  fastify.get("/", workspaceController.listWorkspaces.bind(workspaceController));
  fastify.get("/:slug", workspaceController.getWorkspace.bind(workspaceController));
}
