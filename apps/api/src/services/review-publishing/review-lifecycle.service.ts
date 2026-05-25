import { FastifyInstance } from "fastify";
import { LifecycleState } from "./workflow.types";

export class ReviewLifecycleService {
  constructor(private app: FastifyInstance) {}

  async setState(reviewId: string, state: LifecycleState, reason?: string, metadata?: unknown) {
    await this.app.prisma.reviewLifecycleEvent.create({
      data: {
        reviewId,
        state,
        reason,
        metadata: metadata as any
      }
    });

    await this.app.prisma.review.update({
      where: { id: reviewId },
      data: { status: state }
    });
  }

  async markPublication(reviewId: string, status: "published" | "failed", error?: string) {
    await this.app.prisma.reviewPublicationStatus.upsert({
      where: { reviewId },
      update: {
        status,
        lastError: error,
        attempts: { increment: 1 },
        lastPublishedAt: status === "published" ? new Date() : undefined
      },
      create: {
        reviewId,
        status,
        lastError: error,
        attempts: 1,
        lastPublishedAt: status === "published" ? new Date() : null
      }
    });
  }

  async history(reviewId: string) {
    return this.app.prisma.reviewLifecycleEvent.findMany({
      where: { reviewId },
      orderBy: { createdAt: "desc" }
    });
  }
}
