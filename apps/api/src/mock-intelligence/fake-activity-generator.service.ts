import { prisma } from "../lib/prisma";

export class FakeActivityGeneratorService {
  /**
   * Seeds realistic activity logs into the database for the given workspace.
   */
  async seedActivityFeed(workspaceId: string, repositoryId: string, pullRequestId: string) {
    const activities = [
      {
        workspaceId,
        repositoryId,
        pullRequestId,
        type: "review_started",
        severity: "info",
        summary: "RoseReview AI began analyzing the pull request architecture.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        workspaceId,
        repositoryId,
        pullRequestId,
        type: "deployment_risk_calculated",
        severity: "warning",
        summary: "Deployment confidence dropped after authentication middleware modifications were detected.",
        createdAt: new Date(Date.now() - 1000 * 60 * 55), // 55 mins ago
      },
      {
        workspaceId,
        repositoryId,
        pullRequestId,
        type: "benchmark_violation",
        severity: "critical",
        summary: "Detected a critical timing attack vulnerability in token verification.",
        createdAt: new Date(Date.now() - 1000 * 60 * 50), // 50 mins ago
      },
      {
        workspaceId,
        repositoryId,
        pullRequestId,
        type: "patch_generated",
        severity: "info",
        summary: "AI generated a constant-time comparison patch to resolve the timing attack vulnerability.",
        createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
      },
      {
        workspaceId,
        repositoryId,
        pullRequestId,
        type: "review_completed",
        severity: "warning",
        summary: "Review published to GitHub. Merge readiness requires addressing 2 blockers.",
        createdAt: new Date(Date.now() - 1000 * 60 * 10), // 10 mins ago
      }
    ];

    await prisma.activityEvent.createMany({
      data: activities,
    });
  }

  async seedTimelineEvents(pullRequestId: string, reviewId: string) {
    const events = [
      {
        pullRequestId,
        reviewId,
        type: "webhook_received",
        status: "success",
        description: "Received pull_request.opened event from GitHub.",
        createdAt: new Date(Date.now() - 1000 * 60 * 120),
      },
      {
        pullRequestId,
        reviewId,
        type: "repository_analyzed",
        status: "success",
        description: "Cloned and analyzed repository AST context.",
        createdAt: new Date(Date.now() - 1000 * 60 * 119),
      },
      {
        pullRequestId,
        reviewId,
        type: "ai_review_generated",
        status: "success",
        description: "Generated findings, patches, and deployment risk scoring using Llama-3.",
        createdAt: new Date(Date.now() - 1000 * 60 * 115),
      },
      {
        pullRequestId,
        reviewId,
        type: "github_sync",
        status: "success",
        description: "Successfully published review comments to GitHub PR.",
        createdAt: new Date(Date.now() - 1000 * 60 * 114),
      }
    ];

    await prisma.timelineEvent.createMany({
      data: events,
    });
  }
}

export const fakeActivityGenerator = new FakeActivityGeneratorService();
