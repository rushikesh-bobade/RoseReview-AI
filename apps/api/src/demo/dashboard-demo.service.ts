import { DashboardMetrics } from "./demo-data.schemas";
import { engineeringMetricsService } from "./engineering-metrics.service";
import { prisma } from "../lib/prisma";

export class DashboardDemoService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    // We mix dynamic data (real counts from DB) with realistic generated graph data
    // to create an impressive visual experience even if the DB is sparse.

    const openPullRequests = await prisma.pullRequest.count({
      where: { status: "open" }
    });

    const recentActivity = await prisma.activityEvent.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        summary: true,
        createdAt: true,
        severity: true,
      }
    });

    return {
      repositoryHealthScore: 82, // Hardcoded for realistic demo visual
      deploymentConfidence: 94, // High confidence for good vibes during demo
      openPullRequests,
      criticalIssuesPrevented: 14, // Vanity metric for investors/demo
      
      healthTrend: engineeringMetricsService.generateHealthTrend(),
      severityDistribution: engineeringMetricsService.generateSeverityDistribution(),
      activityTimeline: engineeringMetricsService.generateActivityTimeline(),
      
      recentActivity: recentActivity.map((a: any) => ({
        id: a.id,
        type: a.type,
        message: a.summary,
        timestamp: a.createdAt.toISOString(),
        severity: a.severity,
      })),
    };
  }
}

export const dashboardDemoService = new DashboardDemoService();
