export type SupportedPullRequestAction =
  | "opened"
  | "synchronize"
  | "reopened"
  | "ready_for_review";

export interface GitHubRepositoryRef {
  owner: string;
  repo: string;
}

export interface GitHubPullRequestRef extends GitHubRepositoryRef {
  number: number;
}

export interface GitHubChangedFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author?: string;
}

export interface RepositoryMetadata {
  id: number;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  topics: string[];
}

export interface BranchComparisonSummary {
  aheadBy: number;
  behindBy: number;
  totalCommits: number;
  changedFiles: number;
}

export interface RepositoryContextSummary {
  repositoryName: string;
  languages: string[];
  frameworkSignals: string[];
  packageManagers: string[];
  dependencyFiles: string[];
  testingFrameworks: string[];
  infrastructureFiles: string[];
  benchmarks?: RepositoryBenchmarks;
}

export interface RepositoryBenchmarks {
  codingConventions: string[];
  architecturalRules: string[];
  reviewExpectations: string[];
  namingStandards: string[];
  testingRequirements: string[];
}

export interface PullRequestImpactAnalysis {
  impactedModules: string[];
  affectedServices: string[];
  riskyFiles: string[];
  apiContractChanges: boolean;
  databaseChanges: boolean;
  authenticationChanges: boolean;
  infrastructureChanges: boolean;
  severity: "critical" | "high" | "medium" | "low" | "informational";
  fileImpactScore: number;
}

export interface NormalizedPullRequestEvent {
  event: "pull_request";
  action: SupportedPullRequestAction;
  deliveryId?: string;
  repository: GitHubRepositoryRef & { githubId?: number };
  pullRequest: {
    number: number;
    title: string;
    author?: string;
    headSha?: string;
    headRef?: string;
    baseRef?: string;
    draft?: boolean;
    htmlUrl?: string;
  };
}
