import { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../lib/response";
import { AppError } from "../../lib/errors";
import { AIReviewService } from "../../services/ai-review.service";
import { publishBodySchema, regenerateSchema, reviewAnalyzeSchema, reviewIdParamSchema } from "./review.schemas";
import { mapPatchPreview, mapSeverityBreakdown, mapTestsPreview } from "../../services/dashboard/review-response.mapper";
import { ReviewFeedbackOrchestratorService } from "../../services/review-feedback/orchestrator.service";
import { ReviewWorkflowService } from "../../services/review-publishing/review-workflow.service";
import { ReviewLifecycleService } from "../../services/review-publishing/review-lifecycle.service";
import { ReviewSyncService } from "../../services/review-publishing/review-sync.service";

export async function analyzeReviewController(request: FastifyRequest, reply: FastifyReply) {
  const body = reviewAnalyzeSchema.parse(request.body);
  const service = new AIReviewService(request.server);
  const review = await service.analyzePullRequest(body);

  return sendSuccess(reply, {
    reviewId: review.id,
    summary: review.summary,
    findings: review.findings,
    severityBreakdown: mapSeverityBreakdown(review.findings),
    deploymentRisk: review.deploymentRisk,
    reviewMeta: review.reviewMeta
  });
}

export async function getReviewController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const review = await request.server.prisma.review.findUnique({
    where: { id },
    include: {
      pullRequest: { include: { deploymentRisks: true } },
      findings: true,
      generatedPatch: true,
      generatedTests: true
    }
  });
  if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");

  return sendSuccess(reply, {
    id: review.id,
    summary: review.summary,
    status: review.status,
    createdAt: review.createdAt,
    pullRequest: review.pullRequest,
    severityBreakdown: mapSeverityBreakdown(review.findings),
    findings: review.findings,
    patch: mapPatchPreview(review.generatedPatch),
    tests: mapTestsPreview(review.generatedTests),
    deploymentRisk: review.pullRequest.deploymentRisks[0] ?? null
  });
}

export async function getReviewFindingsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const review = await request.server.prisma.review.findUnique({
    where: { id },
    include: { findings: true }
  });
  if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");
  return sendSuccess(reply, { items: review.findings, severityBreakdown: mapSeverityBreakdown(review.findings) });
}

export async function getReviewPatchesController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const patch = await request.server.prisma.generatedPatch.findUnique({ where: { reviewId: id } });
  return sendSuccess(reply, mapPatchPreview(patch));
}

export async function getReviewTestsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const tests = await request.server.prisma.generatedTest.findMany({ where: { reviewId: id }, orderBy: { createdAt: "desc" } });
  return sendSuccess(reply, mapTestsPreview(tests));
}

export async function getReviewDeploymentRiskController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const review = await request.server.prisma.review.findUnique({
    where: { id },
    include: { pullRequest: { include: { deploymentRisks: true } } }
  });
  if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");
  return sendSuccess(reply, review.pullRequest.deploymentRisks[0] ?? null);
}

export async function getReviewCommentsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const comments = await request.server.prisma.reviewComment.findMany({
    where: { reviewId: id },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }]
  });
  return sendSuccess(reply, comments);
}

export async function getReviewExplanationSummaryController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const summary = await request.server.prisma.explanationMetadata.findUnique({ where: { reviewId: id } });
  return sendSuccess(reply, summary);
}

export async function getReviewGroupedFindingsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const feedback = new ReviewFeedbackOrchestratorService(request.server);
  return sendSuccess(reply, await feedback.groupedFindings(id));
}

export async function regenerateReviewArtifactsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const body = regenerateSchema.parse(request.body);
  const review = await request.server.prisma.review.findUnique({
    where: { id },
    include: { findings: true }
  });
  if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");

  if (body.target === "patch") {
    const feedback = new ReviewFeedbackOrchestratorService(request.server);
    const patch = await feedback.generatePatch(id, body.context ?? review.summary);
    return sendSuccess(reply, { target: "patch", result: patch });
  }

  if (body.target === "tests") {
    const feedback = new ReviewFeedbackOrchestratorService(request.server);
    const tests = await feedback.generateTests(id, body.context ?? review.summary, body.framework ?? "vitest");
    return sendSuccess(reply, { target: "tests", result: tests });
  }

  if (body.target === "comments") {
    const feedback = new ReviewFeedbackOrchestratorService(request.server);
    const comments = await feedback.generateComments(id);
    return sendSuccess(reply, { target: "comments", result: comments });
  }

  if (body.target === "explanations") {
    const feedback = new ReviewFeedbackOrchestratorService(request.server);
    const explanations = await feedback.generateExplanations(id);
    return sendSuccess(reply, { target: "explanations", result: explanations });
  }

  if (body.target === "deployment-risk") {
    const latest = await request.server.prisma.deploymentRisk.findFirst({
      where: { pullRequestId: review.pullRequestId },
      orderBy: { createdAt: "desc" }
    });
    return sendSuccess(reply, { target: "deployment-risk", result: latest });
  }

  return sendSuccess(reply, {
    target: "review",
    result: {
      summary: review.summary,
      severityBreakdown: mapSeverityBreakdown(review.findings)
    }
  });
}

export async function publishReviewController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const body = publishBodySchema.parse(request.body);
  const workflow = new ReviewWorkflowService(request.server);
  const result = await workflow.publish({
    reviewId: id,
    githubOwner: body.githubOwner,
    githubRepo: body.githubRepo,
    githubPrNumber: body.githubPrNumber
  });
  return sendSuccess(reply, result);
}

export async function getPublishingHistoryController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const rows = await request.server.prisma.publishedReview.findMany({
    where: { reviewId: id },
    orderBy: { publishedAt: "desc" }
  });
  return sendSuccess(reply, rows);
}

export async function getGitHubReviewLinksController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const rows = await request.server.prisma.publishedReview.findMany({
    where: { reviewId: id },
    orderBy: { publishedAt: "desc" },
    select: { githubReviewId: true, githubReviewUrl: true, publishedAt: true }
  });
  return sendSuccess(reply, rows);
}

export async function getLifecycleStatusController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const lifecycle = new ReviewLifecycleService(request.server);
  const status = await request.server.prisma.reviewPublicationStatus.findUnique({ where: { reviewId: id } });
  const history = await lifecycle.history(id);
  return sendSuccess(reply, { status, history });
}

export async function refreshPublishedReviewController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewIdParamSchema.parse(request.params);
  const sync = new ReviewSyncService(request.server);
  await sync.syncDashboard(id, "ok", { action: "manual-refresh" });
  return sendSuccess(reply, { refreshed: true });
}
