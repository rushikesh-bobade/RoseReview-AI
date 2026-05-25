import { FastifyInstance } from "fastify";
import { AIService } from "../integrations/ai/ai.service";
import { AppError } from "../lib/errors";

export class PatchGenerationService {
  private ai: AIService;

  constructor(private app: FastifyInstance) {
    this.ai = new AIService(app);
  }

  async generatePatch(reviewId: string, context: string) {
    const review = await this.app.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");

    const patchResult = await this.ai.generatePatch(context);

    const patch = await this.app.prisma.generatedPatch.upsert({
      where: { reviewId },
      update: {
        patch: patchResult.patch,
        explanation: patchResult.explanation
      },
      create: {
        reviewId,
        patch: patchResult.patch,
        explanation: patchResult.explanation
      }
    });

    return patch;
  }
}
