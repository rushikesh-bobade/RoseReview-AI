import { FastifyRequest, FastifyReply } from "fastify";
import { reviewTimelineService } from "./review-timeline.service";
import { TimelineQuerySchema } from "./timeline.schemas";
import { successResponse, errorResponse } from "../../infrastructure/api-response";

export class TimelineController {
  async getPullRequestTimeline(request: FastifyRequest<{ Params: { prId: string } }>, reply: FastifyReply) {
    const { prId } = request.params;
    const query = TimelineQuerySchema.parse(request.query);

    try {
      // In a fully robust system, we would verify the user has access to this PR's workspace first.
      // For MVP, we proceed to fetch the timeline.
      const timeline = await reviewTimelineService.getPullRequestTimeline(prId, query);
      return reply.send(successResponse(timeline, "Pull request timeline retrieved", undefined, request.id));
    } catch (error: any) {
      throw error;
    }
  }
}

export const timelineController = new TimelineController();
