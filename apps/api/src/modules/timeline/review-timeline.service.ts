import { prisma } from "../../lib/prisma";
import { CreateTimelineEventInput, TimelineQueryInput } from "./timeline.schemas";
import { logger } from "../../infrastructure/logger";

export class ReviewTimelineService {
  async recordEvent(input: CreateTimelineEventInput) {
    const event = await prisma.timelineEvent.create({
      data: {
        pullRequestId: input.pullRequestId,
        reviewId: input.reviewId,
        type: input.type,
        status: input.status,
        description: input.description,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    logger.debug({ eventId: event.id, pullRequestId: input.pullRequestId, type: input.type }, "Timeline event recorded");
    return event;
  }

  async getPullRequestTimeline(pullRequestId: string, query: TimelineQueryInput) {
    const events = await prisma.timelineEvent.findMany({
      where: { pullRequestId },
      orderBy: { createdAt: "asc" }, // Timeline goes from oldest to newest usually
      take: query.limit,
    });

    return events.map(e => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    }));
  }
}

export const reviewTimelineService = new ReviewTimelineService();
