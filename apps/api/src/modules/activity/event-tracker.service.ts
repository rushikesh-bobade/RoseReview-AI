import { activityFeedService } from "./activity-feed.service";
import { reviewTimelineService } from "../timeline/review-timeline.service";
import { notificationService } from "../notifications/notification.service";
import { ActivitySeverity } from "./activity.schemas";
import { NotificationCategory } from "../notifications/notification.schemas";
import { TimelineEventStatus } from "../timeline/timeline.schemas";
import { logger } from "../../infrastructure/logger";

/**
 * EventTrackerService coordinates event broadcasting across Activity Feeds,
 * Review Timelines, and User Notifications in a single centralized action.
 */
export class EventTrackerService {
  /**
   * Tracks an engineering event that should appear on the timeline, activity feed,
   * and optionally notify developers.
   */
  async trackReviewLifecycleEvent(params: {
    workspaceId: string;
    repositoryId: string;
    pullRequestId: string;
    reviewId?: string;
    actorId?: string;
    eventType: string; // e.g. "ai_review_completed"
    status: "pending" | "success" | "failed";
    summary: string;
    severity: "info" | "warning" | "critical";
    notifyUserId?: string; // If set, sends a direct notification
    notificationCategory?: "critical_alert" | "deployment_warning" | "review_complete" | "repository_insight" | "benchmark_notification" | "engineering_recommendation";
    metadata?: Record<string, any>;
  }) {
    try {
      // 1. Record in Timeline (Chronological steps for a specific PR)
      await reviewTimelineService.recordEvent({
        pullRequestId: params.pullRequestId,
        reviewId: params.reviewId,
        type: params.eventType,
        status: params.status,
        description: params.summary,
        metadata: params.metadata,
      });

      // 2. Record in Activity Feed (Repository/Workspace engineering log)
      await activityFeedService.logEvent({
        workspaceId: params.workspaceId,
        repositoryId: params.repositoryId,
        pullRequestId: params.pullRequestId,
        actorId: params.actorId,
        type: params.eventType,
        severity: params.severity,
        summary: params.summary,
        metadata: params.metadata,
      });

      // 3. Dispatch Notification if a specific user needs alerting
      if (params.notifyUserId && params.notificationCategory) {
        await notificationService.createNotification({
          userId: params.notifyUserId,
          category: params.notificationCategory,
          title: params.eventType,
          message: params.summary,
          referenceId: params.pullRequestId,
          referenceType: "PullRequest",
          metadata: params.metadata,
        });
      }
    } catch (error) {
      logger.error({ err: error, eventType: params.eventType }, "Failed to track engineering event comprehensively");
      // Intentionally not throwing to avoid breaking the main business flow
    }
  }
}

export const eventTrackerService = new EventTrackerService();
