import { FastifyInstance } from "fastify";
import { AIService } from "../integrations/ai/ai.service";
import { AppError } from "../lib/errors";

export class TestGenerationService {
  private ai: AIService;

  constructor(private app: FastifyInstance) {
    this.ai = new AIService(app);
  }

  async generateTests(reviewId: string, codeContext: string, framework: string) {
    const review = await this.app.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new AppError("REVIEW_NOT_FOUND", 404, "Review not found");

    const tests = await this.ai.generateTests(codeContext, framework);

    return this.app.prisma.$transaction(
      tests.map((test) =>
        this.app.prisma.generatedTest.create({
          data: {
            reviewId,
            testName: test.testName,
            content: test.content,
            framework: test.framework ?? framework
          }
        })
      )
    );
  }
}
