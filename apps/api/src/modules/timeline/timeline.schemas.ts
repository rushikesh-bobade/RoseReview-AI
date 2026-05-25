import { z } from "zod";

export const TimelineEventStatus = z.enum(["pending", "success", "failed"]);

export const CreateTimelineEventSchema = z.object({
  pullRequestId: z.string().min(1),
  reviewId: z.string().optional(),
  type: z.string().min(1),
  status: TimelineEventStatus,
  description: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const TimelineQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type CreateTimelineEventInput = z.infer<typeof CreateTimelineEventSchema>;
export type TimelineQueryInput = z.infer<typeof TimelineQuerySchema>;
