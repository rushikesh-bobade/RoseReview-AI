export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SeverityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface DashboardOverview {
  totalReviews: number;
  openPullRequests: number;
  overallCodeHealthScore: number;
  deploymentConfidenceAvg: number;
  mergeReadinessAvg: number;
  severityBreakdown: SeverityBreakdown;
}

export interface TrendPoint {
  label: string;
  value: number;
}
