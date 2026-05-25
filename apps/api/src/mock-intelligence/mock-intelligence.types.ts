export interface MockRepository {
  owner: string;
  name: string;
  defaultBranch: string;
  description: string;
  framework: string;
}

export interface MockPullRequest {
  title: string;
  description: string;
  author: string;
  status: "open" | "merged" | "closed";
  riskLevel: "low" | "medium" | "high";
  affectedFiles: number;
  additions: number;
  deletions: number;
}

export interface MockFinding {
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  suggestion: string;
  filePath: string;
  lineNumber: number;
}

export interface MockPatch {
  originalCode: string;
  improvedCode: string;
  explanation: string;
}

export interface MockReviewScenario {
  repository: MockRepository;
  pullRequest: MockPullRequest;
  findings: MockFinding[];
  patch?: MockPatch;
  deploymentImpactSummary: string;
  mergeReadiness: boolean;
  mergeBlockers: string[];
}
