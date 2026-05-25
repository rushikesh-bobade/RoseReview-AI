import { FastifyInstance } from "fastify";
import { repositoryController } from "./repository.controller";

export async function repositoryRoutes(fastify: FastifyInstance) {
  // All repository routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.post("/", repositoryController.connect.bind(repositoryController));
  fastify.get("/", repositoryController.list.bind(repositoryController));
  fastify.patch("/:id/settings", repositoryController.updateSettings.bind(repositoryController));
}
