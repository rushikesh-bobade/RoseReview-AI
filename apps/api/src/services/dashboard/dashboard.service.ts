// @ts-nocheck
import { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors";
import { DashboardOverview, PaginationMeta } from "./dashboard.types";
import { mapPatchPreview, mapSeverityBreakdown, mapTestsPreview } from "./review-response.mapper";
import { ReviewAnalyticsService } from "./analytics.service";

function paginate(total: number, page: number, pageSize: number): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export class DashboardService {
  private analytics: ReviewAnalyticsService;

  constructor(private app: FastifyInstance) {
    this.analytics = new ReviewAnalyticsService(app);
  }

  async getOverview(): Promise<DashboardOverview> {
    const [totalReviews, openPullRequests, findings, risks, mergeReadiness] = await Promise.all([
      this.app.prisma.review.count(),
      this.app.prisma.pullRequest.count({ where: { status: { in: ["opened", "synchronize", "reopened"] } } }),
      this.app.prisma.finding.findMany({ select: { severity: true } }),
      this.app.prisma.deploymentRisk.findMany({ select: { score: true } }),
      this.app.prisma.mergeReadinessReport.findMany({ select: { score: true } })
    ]);

    const deploymentConfidenceAvg =
      risks.length > 0 ? Math.round(100 - risks.reduce((a, b) => a + b.score, 0) / risks.length) : 100;
    const mergeReadinessAvg =
      mergeReadiness.length > 0
        ? Math.round(mergeReadiness.reduce((a, b) => a + b.score, 0) / mergeReadiness.length)
        : 100;

    return {
      totalReviews,
      openPullRequests,
      overallCodeHealthScore: Math.round((deploymentConfidenceAvg + mergeReadinessAvg) / 2),
      deploymentConfidenceAvg,
      mergeReadinessAvg,
      severityBreakdown: mapSeverityBreakdown(findings)
    };
  }

  async getRecentReviews(page: number, pageSize: number) {
    const [total, reviews] = await Promise.all([
      this.app.prisma.review.count(),
      this.app.prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          pullRequest: true,
          findings: true
        }
      })
    ]);

    return {
      items: reviews.map((r) => ({
        id: r.id,
        summary: r.summary,
        status: r.status,
        createdAt: r.createdAt,
        pullRequest: {
          id: r.pullRequest.id,
          title: r.pullRequest.title,
          number: r.pullRequest.githubNumber
        },
        severityBreakdown: mapSeverityBreakdown(r.findings)
      })),
      meta: paginate(total, page, pageSize)
    };
  }

  async getRiskTrends() {
    return this.analytics.riskTrends(21);
  }

  async getRepositoryHealth() {
    const repos = await this.app.prisma.repository.findMany({
      include: {
        pullRequests: {
          include: {
            deploymentRisks: true
          }
        }
      }
    });

    return repos.map((repo) => {
      const scores = repo.pullRequests.flatMap((pr) => pr.deploymentRisks.map((r) => r.score));
      const avgRisk = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return {
        repositoryId: repo.id,
        name: `${repo.owner}/${repo.name}`,
        stabilityScore: 100 - avgRisk,
        riskHeat: avgRisk
      };
    });
  }

  async getMergeReadiness() {
    return this.app.prisma.mergeReadinessReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        pullRequestId: true,
        status: true,
        score: true,
        explanations: JSON.stringify(null),
        requiredImprovements: JSON.stringify(null),
        deploymentCautions: JSON.stringify(null),
        createdAt: true
      }
    });
  }

  async getBenchmarkCompliance() {
    return this.app.prisma.benchmarkReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 30
    });
  }

  async getReviewMetrics() {
    const [severityDistribution, trends] = await Promise.all([
      this.analytics.severityDistribution(),
      this.analytics.riskTrends(14)
    ]);
    return {
      severityDistribution,
      deploymentConfidenceTrend: trends.map((t) => ({ label: t.label, value: 100 - t.value })),
      reviewVelocity: trends.map((t) => ({ label: t.label, value: Math.max(1, Math.round((100 - t.value) / 10)) }))
    };
  }

  async listRepositories(page: number, pageSize: number) {
    const [total, items] = await Promise.all([
      this.app.prisma.repository.count(),
      this.app.prisma.repository.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);
    return { items, meta: paginate(total, page, pageSize) };
  }

  async getRepositoryById(id: string) {
    const repo = await this.app.prisma.repository.findUnique({ where: { id } });
    if (!repo) throw new AppError("REPOSITORY_NOT_FOUND", 404, "Repository not found");
    return repo;
  }

  async getRepositoryPullRequests(id: string, page: number, pageSize: number) {
    const [total, items] = await Promise.all([
      this.app.prisma.pullRequest.count({ where: { repositoryId: id } }),
      this.app.prisma.pullRequest.findMany({
        where: { repositoryId: id },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);
    return { items, meta: paginate(total, page, pageSize) };
  }

  async getRepositoryInsights(id: string) {
    const repo = await this.getRepositoryById(id);
    const prs = await this.app.prisma.pullRequest.findMany({
      where: { repositoryId: id },
      include: {
        deploymentRisks: true,
        reviews: {
          include: { findings: true, generatedPatch: true, generatedTests: true }
        }
      }
    });

    const allFindings = prs.flatMap((pr) => pr.reviews.flatMap((r) => r.findings));
    const latestReview = prs.flatMap((pr) => pr.reviews).sort((a, b) => +b.createdAt - +a.createdAt)[0];
    return {
      repository: repo,
      pullRequestCount: prs.length,
      severityBreakdown: mapSeverityBreakdown(allFindings),
      latestPatchPreview: latestReview ? mapPatchPreview(latestReview.generatedPatch) : null,
      latestTestsPreview: latestReview ? mapTestsPreview(latestReview.generatedTests) : []
    };
  }
}
