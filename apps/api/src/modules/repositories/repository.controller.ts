import { FastifyRequest, FastifyReply } from "fastify";
import { repositoryService } from "./repository.service";
import { ConnectRepositorySchema, UpdateRepositorySettingsSchema } from "./repository.schemas";
import { successResponse, errorResponse } from "../../infrastructure/api-response";

export class RepositoryController {
  async connect(request: FastifyRequest, reply: FastifyReply) {
    const input = ConnectRepositorySchema.parse(request.body);
    const userId = request.user.id;

    try {
      const repository = await repositoryService.connectRepository(userId, input);
      return reply.send(successResponse(repository, "Repository connected successfully", undefined, request.id));
    } catch (error: any) {
      if (error.message === "Unauthorized to add repositories to this workspace") {
        return reply.status(403).send(errorResponse("FORBIDDEN", error.message, null, request.id));
      }
      throw error;
    }
  }

  async list(request: FastifyRequest<{ Querystring: { workspaceId: string } }>, reply: FastifyReply) {
    const userId = request.user.id;
    const { workspaceId } = request.query;

    if (!workspaceId) {
      return reply.status(400).send(errorResponse("BAD_REQUEST", "workspaceId query parameter is required", null, request.id));
    }

    try {
      const repositories = await repositoryService.listWorkspaceRepositories(workspaceId, userId);
      return reply.send(successResponse(repositories, "Repositories retrieved", undefined, request.id));
    } catch (error: any) {
      if (error.message === "Unauthorized access to workspace") {
        return reply.status(403).send(errorResponse("FORBIDDEN", error.message, null, request.id));
      }
      throw error;
    }
  }

  async updateSettings(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = request.user.id;
    const { id } = request.params;
    const input = UpdateRepositorySettingsSchema.parse(request.body);

    try {
      const repository = await repositoryService.updateSettings(id, userId, input);
      return reply.send(successResponse(repository, "Repository settings updated", undefined, request.id));
    } catch (error: any) {
      if (error.message === "Repository not found") {
        return reply.status(404).send(errorResponse("NOT_FOUND", error.message, null, request.id));
      }
      if (error.message === "Unauthorized to modify repository settings") {
        return reply.status(403).send(errorResponse("FORBIDDEN", error.message, null, request.id));
      }
      throw error;
    }
  }
}

export const repositoryController = new RepositoryController();
