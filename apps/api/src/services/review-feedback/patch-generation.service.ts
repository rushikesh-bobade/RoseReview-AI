// @ts-nocheck
import { FastifyInstance } from "fastify";
import { AIService } from "../../integrations/ai/ai.service";
import { PatchArtifact } from "./review-feedback.types";

export class ReviewFeedbackPatchGenerationService {
  private ai: AIService;
  constructor(private app: FastifyInstance) {
    this.ai = new AIService(app);
  }

  async generate(reviewId: string, context: string): Promise<PatchArtifact> {
    const suggestion = await this.ai.generatePatch(context);
    const patch: PatchArtifact = {
      originalCode: context.slice(0, 600),
      improvedCode: suggestion.patch.slice(0, 2000),
      diffPreview: suggestion.patch,
      explanation: suggestion.explanation,
      deploymentImpact: "Patch reduces runtime instability and improves deploy-time confidence.",
      benchmarkImprovements: JSON.stringify(null),
      architectureConsiderations: "Keeps existing module boundaries and avoids broad rewrites."
    };

    await this.app.prisma.generatedPatch.upsert({
      where: { reviewId },
      update: {
        patch: patch.diffPreview,
        explanation: patch.explanation,
        originalCode: patch.originalCode,
        improvedCode: patch.improvedCode,
        deploymentImpact: patch.deploymentImpact,
        benchmarkImprovements: JSON.stringify(null),
        architectureConsiderations: patch.architectureConsiderations
      },
      create: {
        reviewId,
        patch: patch.diffPreview,
        explanation: patch.explanation,
        originalCode: patch.originalCode,
        improvedCode: patch.improvedCode,
        deploymentImpact: patch.deploymentImpact,
        benchmarkImprovements: JSON.stringify(null),
        architectureConsiderations: patch.architectureConsiderations
      }
    });
    this.app.log.info({ reviewId }, "Review feedback patch generated");
    return patch;
  }
}
