// @ts-nocheck
import { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors";
import { workflowInputSchema } from "./workflow.schemas";
import { WorkflowInput, WorkflowResult } from "./workflow.types";
import { ReviewCommentMapperService } from "./review-comment-mapper.service";
import { GitHubReviewPublisherService } from "./github-review-publisher.service";
import { ReviewLifecycleService } from "./review-lifecycle.service";
import { ReviewSyncService } from "./review-sync.service";

export class ReviewWorkflowService {
  private mapper = new ReviewCommentMapperService();
  private lifecycle: ReviewLifecycleService;
  private sync: ReviewSyncService;
  private publisher: GitHubReviewPublisherService;

  constructor(private app: FastifyInstance) {
    this.lifecycle = new ReviewLifecycleService(app);
    this.sync = new ReviewSyncService(app);
    this.publisher = new GitHubReviewPublisherService(app.log);
  }

  async publish(input: WorkflowInput): Promise<WorkflowResult> {
    const parsed = workflowInputSchema.parse(input);
    const startedAt = Date.now();
    await this.lifecycle.setState(parsed.reviewId, "pending", "Publishing workflow started");

    const review = await this.app.prisma.review.findUnique({
      where: { id: parsed.reviewId },
      include: {
        findings: true,
        generatedPatch: true,
        generatedTests: true,
        pullRequest: { include: { deploymentRisks: true, mergeReadinessReports: true, benchmarkReports: true } },
        comments: true
      }
    });
    if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");

    try {
      const summary = this.mapper.mapSummaryMarkdown({
        summary: review.summary,
        deploymentConfidence: review.pullRequest.deploymentRisks[0]
          ? 100 - review.pullRequest.deploymentRisks[0].score
          : undefined,
        mergeReadiness: review.pullRequest.mergeReadinessReports[0]?.status,
        benchmarkNotes: (review.pullRequest.benchmarkReports[0]?.violatedStandards as string | undefined) ?? [],
        patchPreview: review.generatedPatch?.patch ?? null,
        testsPreview: review.generatedTests.map((t) => t.testName)
      });

      const inlineComments = this.mapper.mapInlineComments(review.comments);
      const published = await this.publisher.publish({
        owner: parsed.githubOwner,
        repo: parsed.githubRepo,
        pullNumber: parsed.githubPrNumber,
        summaryBody: summary,
        inlineComments
      });

      await this.app.prisma.publishedReview.create({
        data: {
          reviewId: parsed.reviewId,
          githubOwner: parsed.githubOwner,
          githubRepo: parsed.githubRepo,
          githubPrNumber: parsed.githubPrNumber,
          githubReviewId: published.reviewId,
          githubReviewUrl: published.reviewUrl,
          summaryBody: summary
        }
      });

      await this.lifecycle.markPublication(parsed.reviewId, "published");
      await this.lifecycle.setState(parsed.reviewId, "completed", "GitHub review published");
      await this.sync.syncDashboard(parsed.reviewId, "ok", {
        durationMs: Date.now() - startedAt,
        publishedComments: inlineComments.length
      });

      return {
        reviewId: parsed.reviewId,
        status: "completed",
        githubReviewUrl: published.reviewUrl ?? undefined,
        publishedComments: inlineComments.length,
        deploymentConfidence: review.pullRequest.deploymentRisks[0]
          ? 100 - review.pullRequest.deploymentRisks[0].score
          : undefined,
        mergeReadiness: review.pullRequest.mergeReadinessReports[0]?.status
      };
    } catch (error: any) {
      await this.lifecycle.markPublication(parsed.reviewId, "failed", error?.message ?? "unknown publish error");
      await this.lifecycle.setState(parsed.reviewId, "failed", "Publishing workflow failed", {
        message: error?.message ?? "unknown"
      });
      await this.sync.syncDashboard(parsed.reviewId, "failed", { message: error?.message ?? "unknown" });
      throw error;
    }
  }
}
