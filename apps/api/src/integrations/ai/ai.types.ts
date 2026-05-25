import { Severity } from "../../types/domain";

export interface AIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AIExecutionMeta {
  provider: string;
  model: string;
  latencyMs: number;
  usage?: AIUsage;
  attempts: number;
}

export interface AITextRequest {
  task: string;
  prompt: string;
  temperature?: number;
}

export interface AIStructuredRequest<TSchemaName extends string = string> {
  task: string;
  prompt: string;
  schemaName: TSchemaName;
  temperature?: number;
}

export interface AIProviderResult<T> {
  content: T;
  raw: string;
  meta: AIExecutionMeta;
}

export interface AIReviewInput {
  prTitle: string;
  prDescription?: string;
  changedFiles: string[];
  fileDiffs: Array<{ filePath: string; diff: string }>;
  repositoryMetadata?: Record<string, unknown>;
  frameworkInfo?: string[];
  dependencyInfo?: string[];
  commitHistory?: Array<{ sha: string; message: string }>;
  benchmarkStandards?: Record<string, unknown>;
  architectureSensitiveAreas?: string[];
}

export interface AIReviewFinding {
  title: string;
  description: string;
  whyItMatters: string;
  recommendation: string;
  severity: Severity;
  filePath?: string;
}

export interface AIReviewOutput {
  summary: string;
  overallHealthScore: number;
  deploymentConfidence: number;
  mergeReadiness: "ready" | "needs_changes" | "high_risk";
  architectureImpact: string;
  humanizedFeedback: string;
  benchmarkViolations: string[];
  findings: AIReviewFinding[];
}

export interface AIDeploymentRiskOutput {
  score: number;
  level: "low" | "medium" | "high";
  rationale: string;
  riskFactors: string[];
}

export interface AIPatchSuggestion {
  patch: string;
  explanation: string;
}

export interface AITestSuggestion {
  testName: string;
  content: string;
  testType: "unit" | "integration" | "regression" | "failure-case";
  framework?: string;
}
