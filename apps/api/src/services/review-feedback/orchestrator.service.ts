import { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors";
import { ExplanationEngineService } from "./explanation-engine.service";
import { ReviewCommentService } from "./review-comment.service";
import { ReviewFeedbackPatchGenerationService } from "./patch-generation.service";
import { ReviewFeedbackTestGenerationService } from "./test-generation.service";

export class ReviewFeedbackOrchestratorService {
  private comments: ReviewCommentService;
  private patches: ReviewFeedbackPatchGenerationService;
  private tests: ReviewFeedbackTestGenerationService;
  private explanations = new ExplanationEngineService();

  constructor(private app: FastifyInstance) {
    this.comments = new ReviewCommentService(app);
    this.patches = new ReviewFeedbackPatchGenerationService(app);
    this.tests = new ReviewFeedbackTestGenerationService(app);
  }

  async ensureReview(reviewId: string) {
    const review = await this.app.prisma.review.findUnique({
      where: { id: reviewId },
      include: { findings: true, pullRequest: { include: { deploymentRisks: true } } }
    });
    if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");
    return review;
  }

  async generateComments(reviewId: string) {
    return this.comments.generateAndPersist(reviewId);
  }

  async generatePatch(reviewId: string, context: string) {
    return this.patches.generate(reviewId, context);
  }

  async generateTests(reviewId: string, context: string, framework: string) {
    return this.tests.generate(reviewId, context, framework);
  }

  async generateExplanations(reviewId: string) {
    const review = await this.ensureReview(reviewId);
    const risk = review.pullRequest.deploymentRisks[0];
    const summary = this.explanations.summarize({
      summary: review.summary,
      findingsCount: review.findings.length,
      riskLevel: risk?.level
    });
    await this.app.prisma.explanationMetadata.upsert({
      where: { reviewId },
      update: summary,
      create: { reviewId, ...summary }
    });
    return summary;
  }

  async groupedFindings(reviewId: string) {
    return this.comments.getGroupedFindings(reviewId);
  }
}
