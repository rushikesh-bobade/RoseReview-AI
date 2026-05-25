import { z } from "zod";

export const ActivitySeverity = z.enum(["info", "warning", "critical"]);

export const ActivityEventSchema = z.object({
  workspaceId: z.string().min(1),
  repositoryId: z.string().optional(),
  pullRequestId: z.string().optional(),
  actorId: z.string().optional(),
  type: z.string().min(1),
  severity: ActivitySeverity,
  summary: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const ActivityQuerySchema = z.object({
  repositoryId: z.string().optional(),
  severity: ActivitySeverity.optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type ActivityEventInput = z.infer<typeof ActivityEventSchema>;
export type ActivityQueryInput = z.infer<typeof ActivityQuerySchema>;
