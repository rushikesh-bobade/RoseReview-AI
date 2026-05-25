import { z } from "zod";

export const reviewAnalyzeSchema = z.object({
  pullRequest: z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    number: z.number().int().positive()
  }),
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

export const reviewIdParamSchema = z.object({
  id: z.string().min(1)
});

export const publishBodySchema = z.object({
  githubOwner: z.string().min(1),
  githubRepo: z.string().min(1),
  githubPrNumber: z.number().int().positive()
});

export const regenerateSchema = z.object({
  target: z.enum(["review", "patch", "tests", "deployment-risk", "comments", "explanations"]),
  context: z.string().optional(),
  framework: z.string().optional()
});
