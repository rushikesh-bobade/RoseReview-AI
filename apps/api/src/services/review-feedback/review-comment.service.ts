import { FastifyInstance } from "fastify";
import { HumanizationService } from "./humanization.service";
import { ReviewPrioritizationService } from "./review-prioritization.service";
import { CommentFormattingService } from "./comment-formatting.service";
import { RawReviewSignal } from "./review-feedback.types";

export class ReviewCommentService {
  private humanization = new HumanizationService();
  private prioritization = new ReviewPrioritizationService();
  private formatting = new CommentFormattingService();

  constructor(private app: FastifyInstance) {}

  async generateAndPersist(reviewId: string) {
    const review = await this.app.prisma.review.findUnique({
      where: { id: reviewId },
      include: { findings: true }
    });
    if (!review) throw new Error("Review not found");

    const signals: RawReviewSignal[] = review.findings.map((f) => ({
      id: f.id,
      title: f.title,
      description: this.humanization.calmRecommendation(
        f.description,
        f.suggestion ? `A safer path is: ${f.suggestion}` : "A small refactor here can reduce production risk."
      ),
      severity: this.normalizeSeverity(f.severity),
      filePath: f.filePath ?? undefined
    }));

    const prioritized = this.prioritization.prioritize(signals);
    await this.app.prisma.reviewComment.deleteMany({ where: { reviewId } });
    await this.app.prisma.$transaction(
      prioritized.map((c) =>
        this.app.prisma.reviewComment.create({
          data: {
            reviewId,
            category: c.category,
            severity: c.severity,
            confidence: c.confidence,
            title: c.title,
            body: c.body,
            groupedKey: c.groupedKey
          }
        })
      )
    );

    this.app.log.info({ reviewId, count: prioritized.length }, "Review comments generated and persisted");
    return this.formatting.formatForDashboard(prioritized);
  }

  async getGroupedFindings(reviewId: string) {
    const comments = await this.app.prisma.reviewComment.findMany({
      where: { reviewId },
      orderBy: [{ confidence: "desc" }, { createdAt: "asc" }]
    });
    const groups: Record<string, typeof comments> = {};
    for (const c of comments) {
      const key = c.groupedKey ?? "general";
      groups[key] = groups[key] ?? [];
      groups[key].push(c);
    }
    return groups;
  }

  private normalizeSeverity(severity: string): RawReviewSignal["severity"] {
    const s = severity.toLowerCase();
    if (s === "critical" || s === "high" || s === "medium" || s === "low" || s === "info") return s;
    return "info";
  }
}
