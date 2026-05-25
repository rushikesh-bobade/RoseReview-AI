import { z } from "zod";

export const ChartDataPointSchema = z.object({
  name: z.string(),
  value: z.number(),
  fill: z.string().optional(), // For pie charts
});

export const DashboardMetricsSchema = z.object({
  repositoryHealthScore: z.number(),
  deploymentConfidence: z.number(),
  openPullRequests: z.number(),
  criticalIssuesPrevented: z.number(),
  
  // Recharts compatible arrays
  healthTrend: z.array(ChartDataPointSchema),
  severityDistribution: z.array(ChartDataPointSchema),
  activityTimeline: z.array(z.object({
    date: z.string(),
    reviews: z.number(),
    deployments: z.number(),
  })),
  
  recentActivity: z.array(z.object({
    id: z.string(),
    type: z.string(),
    message: z.string(),
    timestamp: z.string(),
    severity: z.string(),
  })),
});

export type DashboardMetrics = z.infer<typeof DashboardMetricsSchema>;
