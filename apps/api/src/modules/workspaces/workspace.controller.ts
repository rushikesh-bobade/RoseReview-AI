import { FastifyRequest, FastifyReply } from "fastify";
import { workspaceService } from "./workspace.service";
import { CreateWorkspaceSchema } from "./workspace.schemas";
import { successResponse, errorResponse } from "../../infrastructure/api-response";

export class WorkspaceController {
  async createWorkspace(request: FastifyRequest, reply: FastifyReply) {
    const input = CreateWorkspaceSchema.parse(request.body);
    const userId = request.user.id;

    try {
      const workspace = await workspaceService.createWorkspace(userId, input);
      return reply.send(successResponse(workspace, "Workspace created successfully", undefined, request.id));
    } catch (error: any) {
      if (error.message === "Workspace with this slug already exists") {
        return reply.status(409).send(errorResponse("CONFLICT", error.message, null, request.id));
      }
      throw error;
    }
  }

  async listWorkspaces(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const workspaces = await workspaceService.getUserWorkspaces(userId);
    return reply.send(successResponse(workspaces, "Workspaces retrieved", undefined, request.id));
  }

  async getWorkspace(request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) {
    const userId = request.user.id;
    const { slug } = request.params;

    try {
      const workspace = await workspaceService.getWorkspaceBySlug(slug, userId);
      return reply.send(successResponse(workspace, "Workspace details retrieved", undefined, request.id));
    } catch (error: any) {
      if (error.message === "Workspace not found") {
        return reply.status(404).send(errorResponse("NOT_FOUND", error.message, null, request.id));
      }
      if (error.message === "Unauthorized access to workspace") {
        return reply.status(403).send(errorResponse("FORBIDDEN", error.message, null, request.id));
      }
      throw error;
    }
  }
}

export const workspaceController = new WorkspaceController();
