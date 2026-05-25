import { z } from "zod";

export const workflowInputSchema = z.object({
  reviewId: z.string().min(1),
  githubOwner: z.string().min(1),
  githubRepo: z.string().min(1),
  githubPrNumber: z.number().int().positive()
});

export const reviewIdParamSchema = z.object({
  id: z.string().min(1)
});
