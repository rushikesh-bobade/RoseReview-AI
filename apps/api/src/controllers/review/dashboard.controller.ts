import { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../lib/response";
import { DashboardService } from "../../services/dashboard/dashboard.service";
import { dashboardFilterSchema, idParamSchema, paginationSchema } from "../../services/dashboard/dashboard.schemas";

export async function dashboardOverviewController(request: FastifyRequest, reply: FastifyReply) {
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getOverview());
}

export async function dashboardRecentReviewsController(request: FastifyRequest, reply: FastifyReply) {
  const query = paginationSchema.parse(request.query);
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getRecentReviews(query.page, query.pageSize));
}

export async function dashboardRiskTrendsController(request: FastifyRequest, reply: FastifyReply) {
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getRiskTrends());
}

export async function dashboardRepositoryHealthController(request: FastifyRequest, reply: FastifyReply) {
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getRepositoryHealth());
}

export async function dashboardMergeReadinessController(request: FastifyRequest, reply: FastifyReply) {
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getMergeReadiness());
}

export async function dashboardBenchmarkComplianceController(request: FastifyRequest, reply: FastifyReply) {
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getBenchmarkCompliance());
}

export async function dashboardReviewMetricsController(request: FastifyRequest, reply: FastifyReply) {
  dashboardFilterSchema.parse(request.query ?? {});
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getReviewMetrics());
}

export async function repositoriesListController(request: FastifyRequest, reply: FastifyReply) {
  const query = paginationSchema.parse(request.query);
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.listRepositories(query.page, query.pageSize));
}

export async function repositoryByIdController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getRepositoryById(id));
}

export async function repositoryPullRequestsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const query = paginationSchema.parse(request.query);
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getRepositoryPullRequests(id, query.page, query.pageSize));
}

export async function repositoryInsightsController(request: FastifyRequest, reply: FastifyReply) {
  const { id } = idParamSchema.parse(request.params);
  const service = new DashboardService(request.server);
  return sendSuccess(reply, await service.getRepositoryInsights(id));
}
