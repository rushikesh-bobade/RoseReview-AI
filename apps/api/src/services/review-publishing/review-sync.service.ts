import { FastifyInstance } from "fastify";

export class ReviewSyncService {
  constructor(private app: FastifyInstance) {}

  async syncDashboard(reviewId: string, status: "ok" | "failed", details?: Record<string, unknown>) {
    await this.app.prisma.dashboardSyncEvent.create({
      data: {
        reviewId,
        syncType: "review-publish",
        status,
        details: details as any
      }
    });
  }

  async getSyncEvents(reviewId: string) {
    return this.app.prisma.dashboardSyncEvent.findMany({
      where: { reviewId },
      orderBy: { syncedAt: "desc" }
    });
  }
}
