import { z } from "zod";

export const NotificationCategory = z.enum([
  "critical_alert",
  "deployment_warning",
  "review_complete",
  "repository_insight",
  "benchmark_notification",
  "engineering_recommendation"
]);

export const CreateNotificationSchema = z.object({
  userId: z.string().min(1),
  category: NotificationCategory,
  title: z.string().min(1),
  message: z.string().min(1),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const NotificationQuerySchema = z.object({
  unreadOnly: z.enum(["true", "false"]).optional().transform((val) => val === "true"),
  category: NotificationCategory.optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof NotificationQuerySchema>;
