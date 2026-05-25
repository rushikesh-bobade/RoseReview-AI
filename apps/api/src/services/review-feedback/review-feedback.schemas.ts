import { z } from "zod";

export const regenerateFeedbackSchema = z.object({
  target: z.enum(["comments", "patch", "tests", "explanations"]),
  context: z.string().optional(),
  framework: z.string().default("vitest")
});

export const reviewFeedbackIdParamSchema = z.object({
  id: z.string().min(1)
});
