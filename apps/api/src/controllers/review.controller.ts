import { FastifyReply, FastifyRequest } from "fastify";
import {
  analyzeReviewSchema,
  generatePatchSchema,
  generateTestsSchema,
  reviewParamsSchema
} from "../validation/review.schema";
import { sendSuccess } from "../lib/response";
import { AIReviewService } from "../services/ai-review.service";
import { PatchGenerationService } from "../services/patch-generation.service";
import { TestGenerationService } from "../services/test-generation.service";
import { AppError } from "../lib/errors";

export async function analyzeReviewController(request: FastifyRequest, reply: FastifyReply) {
  const body = analyzeReviewSchema.parse(request.body);
  const reviewService = new AIReviewService(request.server);

  const review = await reviewService.analyzePullRequest(body);

  return sendSuccess(reply, {
    reviewId: review.id,
    summary: review.summary,
    findings: review.findings,
    deploymentRisk: review.deploymentRisk,
    reviewMeta: review.reviewMeta
  });
}

export async function getReviewController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = reviewParamsSchema.parse(request.params);
  const review = await request.server.prisma.review.findUnique({
    where: { id },
    include: {
      findings: true,
      generatedPatch: true,
      generatedTests: true
    }
  });

  if (!review) {
    throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");
  }

  return sendSuccess(reply, review);
}

export async function generatePatchController(request: FastifyRequest, reply: FastifyReply) {
  const body = generatePatchSchema.parse(request.body);
  const patchService = new PatchGenerationService(request.server);
  const patch = await patchService.generatePatch(body.reviewId, body.context);
  return sendSuccess(reply, patch);
}

export async function generateTestsController(request: FastifyRequest, reply: FastifyReply) {
  const body = generateTestsSchema.parse(request.body);
  const testService = new TestGenerationService(request.server);
  const tests = await testService.generateTests(body.reviewId, body.codeContext, body.framework);
  return sendSuccess(reply, tests);
}
