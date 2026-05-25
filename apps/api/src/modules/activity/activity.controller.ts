import { FastifyRequest, FastifyReply } from "fastify";
import { activityFeedService } from "./activity-feed.service";
import { ActivityQuerySchema } from "./activity.schemas";
import { successResponse, errorResponse } from "../../infrastructure/api-response";

export class ActivityController {
  async getWorkspaceActivity(request: FastifyRequest<{ Params: { workspaceId: string } }>, reply: FastifyReply) {
    const userId = request.user.id;
    const { workspaceId } = request.params;
    const query = ActivityQuerySchema.parse(request.query);

    try {
      const activities = await activityFeedService.getWorkspaceActivity(workspaceId, userId, query);
      return reply.send(successResponse(activities, "Workspace activity retrieved", undefined, request.id));
    } catch (error: any) {
      if (error.message === "Unauthorized access to workspace activity") {
        return reply.status(403).send(errorResponse("FORBIDDEN", error.message, null, request.id));
      }
      throw error;
    }
  }
}

export const activityController = new ActivityController();
