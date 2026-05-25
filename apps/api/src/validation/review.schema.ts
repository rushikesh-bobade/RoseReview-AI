import { z } from "zod";

export const githubRefSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  number: z.number().int().positive()
});

export const analyzeReviewSchema = z.object({
  pullRequest: githubRefSchema,
  prTitle: z.string().optional(),
  prDescription: z.string().optional(),
  changedFiles: z.array(z.string()).optional(),
  diff: z.string().min(1),
  language: z.string().default("typescript"),
  commitHistory: z
    .array(
      z.object({
        sha: z.string(),
        message: z.string()
      })
    )
    .optional(),
  benchmarkStandards: z.record(z.unknown()).optional()
});

export const generatePatchSchema = z.object({
  reviewId: z.string().min(1),
  context: z.string().min(1)
});

export const generateTestsSchema = z.object({
  reviewId: z.string().min(1),
  codeContext: z.string().min(1),
  framework: z.string().default("vitest")
});

export const reviewParamsSchema = z.object({
  id: z.string().min(1)
});
