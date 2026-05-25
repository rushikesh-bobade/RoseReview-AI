import { z } from "zod";

export const fileInsightSchema = z.object({
  path: z.string(),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  changes: z.number().int().nonnegative()
});

export const reviewIntelligenceInputSchema = z.object({
  repositoryName: z.string().min(1),
  changedFiles: z.array(fileInsightSchema),
  commitMessages: z.array(z.string()),
  repositoryBenchmarks: z
    .object({
      namingConventions: z.array(z.string()).optional(),
      architectureRules: z.array(z.string()).optional(),
      testingRequirements: z.array(z.string()).optional(),
      folderStructureExpectations: z.array(z.string()).optional(),
      securityStandards: z.array(z.string()).optional(),
      performanceGuidelines: z.array(z.string()).optional(),
      codeOrganizationStandards: z.array(z.string()).optional()
    })
    .optional()
});
