export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface GitHubPullRequestRef {
  owner: string;
  repo: string;
  number: number;
}

export interface ReviewFinding {
  title: string;
  description: string;
  severity: Severity;
  filePath?: string;
  suggestion?: string;
}

export interface AIReviewResult {
  summary: string;
  findings: ReviewFinding[];
}

export interface DeploymentRiskReport {
  score: number;
  level: "low" | "medium" | "high";
  rationale: string;
}

export interface GeneratedPatchResult {
  patch: string;
  explanation: string;
}

export interface GeneratedTestCase {
  testName: string;
  content: string;
  framework?: string;
}
