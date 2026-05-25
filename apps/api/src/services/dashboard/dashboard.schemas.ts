import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

export const dashboardFilterSchema = paginationSchema.extend({
  repositoryId: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  mergeReadiness: z.enum(["ready", "needs_changes", "blocked"]).optional(),
  deploymentConfidenceMin: z.coerce.number().min(0).max(100).optional(),
  benchmarkViolation: z.coerce.boolean().optional()
});

export const idParamSchema = z.object({
  id: z.string().min(1)
});
