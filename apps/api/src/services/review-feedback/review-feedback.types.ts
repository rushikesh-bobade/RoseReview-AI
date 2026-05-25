export type ReviewCategory =
  | "Critical Risk"
  | "High Impact"
  | "Important Recommendation"
  | "Optimization Suggestion"
  | "Informational Insight";

export interface RawReviewSignal {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  filePath?: string;
  confidence?: number;
}

export interface HumanizedComment {
  title: string;
  body: string;
  category: ReviewCategory;
  severity: RawReviewSignal["severity"];
  confidence: number;
  groupedKey?: string;
}

export interface PatchArtifact {
  originalCode: string;
  improvedCode: string;
  diffPreview: string;
  explanation: string;
  deploymentImpact: string;
  benchmarkImprovements: string[];
  architectureConsiderations: string;
}

export interface GeneratedTestArtifact {
  testName: string;
  testType: "unit" | "edge-case" | "regression" | "integration" | "negative" | "concurrency";
  framework: string;
  content: string;
}

export interface ExplanationSummary {
  deploymentSummary: string;
  mergeReadinessReason: string;
  architectureReasoning: string;
  tradeoffExplanation: string;
  benchmarkSummary: string;
  dependencySummary: string;
}
