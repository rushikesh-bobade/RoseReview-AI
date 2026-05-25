import { FastifyInstance } from "fastify";
import { AIService } from "../../integrations/ai/ai.service";
import { GeneratedTestArtifact } from "./review-feedback.types";

export class ReviewFeedbackTestGenerationService {
  private ai: AIService;
  constructor(private app: FastifyInstance) {
    this.ai = new AIService(app);
  }

  async generate(reviewId: string, context: string, framework: string): Promise<GeneratedTestArtifact[]> {
    const tests = await this.ai.generateTests(context, framework);
    const enriched: GeneratedTestArtifact[] = tests.map((t) => ({
      testName: t.testName,
      framework: t.framework ?? framework,
      content: t.content,
      testType: this.normalizeType(t.testType)
    }));

    await this.app.prisma.generatedTest.deleteMany({ where: { reviewId } });
    await this.app.prisma.$transaction(
      enriched.map((t) =>
        this.app.prisma.generatedTest.create({
          data: {
            reviewId,
            testName: t.testName,
            content: t.content,
            framework: t.framework,
            testType: t.testType
          }
        })
      )
    );
    this.app.log.info({ reviewId, count: enriched.length }, "Review feedback tests generated");
    return enriched;
  }

  private normalizeType(type?: string): GeneratedTestArtifact["testType"] {
    const t = (type ?? "unit").toLowerCase();
    if (t === "unit" || t === "edge-case" || t === "regression" || t === "integration" || t === "negative" || t === "concurrency") {
      return t;
    }
    return "unit";
  }
}
