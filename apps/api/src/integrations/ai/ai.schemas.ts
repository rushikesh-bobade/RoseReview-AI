import { z } from "zod";

export const severitySchema = z.enum(["critical", "high", "medium", "low", "info"]);

export const aiReviewFindingSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  whyItMatters: z.string().min(1),
  recommendation: z.string().min(1),
  severity: severitySchema,
  filePath: z.string().optional()
});

export const aiReviewOutputSchema = z.object({
  summary: z.string().min(1),
  overallHealthScore: z.number().min(0).max(100),
  deploymentConfidence: z.number().min(0).max(100),
  mergeReadiness: z.enum(["ready", "needs_changes", "high_risk"]),
  architectureImpact: z.string().min(1),
  humanizedFeedback: z.string().min(1),
  benchmarkViolations: z.array(z.string()),
  findings: z.array(aiReviewFindingSchema)
});

export const aiDeploymentRiskSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.enum(["low", "medium", "high"]),
  rationale: z.string().min(1),
  riskFactors: z.array(z.string())
});

export const aiPatchSuggestionSchema = z.object({
  patch: z.string().min(1),
  explanation: z.string().min(1)
});

export const aiTestSuggestionSchema = z.object({
  testName: z.string().min(1),
  content: z.string().min(1),
  testType: z.enum(["unit", "integration", "regression", "failure-case"]),
  framework: z.string().optional()
});

export const aiTestSuggestionsSchema = z.array(aiTestSuggestionSchema);
