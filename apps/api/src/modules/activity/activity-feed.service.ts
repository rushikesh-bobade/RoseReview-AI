import { prisma } from "../../lib/prisma";
import { ActivityEventInput, ActivityQueryInput } from "./activity.schemas";
import { logger } from "../../infrastructure/logger";

export class ActivityFeedService {
  async logEvent(input: ActivityEventInput) {
    const event = await prisma.activityEvent.create({
      data: {
        workspaceId: input.workspaceId,
        repositoryId: input.repositoryId,
        pullRequestId: input.pullRequestId,
        actorId: input.actorId,
        type: input.type,
        severity: input.severity,
        summary: input.summary,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    logger.debug({ eventId: event.id, workspaceId: input.workspaceId, type: input.type }, "Activity event logged");
    return event;
  }

  async getWorkspaceActivity(workspaceId: string, userId: string, query: ActivityQueryInput) {
    // Ensure the user has access to this workspace
    const hasAccess = await prisma.workspaceMember.count({
      where: { workspaceId, userId },
    });

    if (!hasAccess) {
      throw new Error("Unauthorized access to workspace activity");
    }

    const where: any = { workspaceId };
    
    if (query.repositoryId) {
      where.repositoryId = query.repositoryId;
    }
    
    if (query.severity) {
      where.severity = query.severity;
    }

    const events = await prisma.activityEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      include: {
        actor: {
          select: { id: true, name: true, avatarUrl: true },
        },
        repository: {
          select: { id: true, name: true, owner: true },
        },
        pullRequest: {
          select: { id: true, githubNumber: true, title: true },
        },
      },
    });

    // Parse JSON metadata
    return events.map(e => ({
      ...e,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
    }));
  }
}

export const activityFeedService = new ActivityFeedService();
