export type RiskLevel = "low" | "medium" | "high";
export type ImpactLevel = "low" | "medium" | "high";
export type MergeReadinessStatus = "ready" | "needs_changes" | "blocked";

export interface FileInsight {
  path: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface RepositoryOverview {
  frameworks: string[];
  backendFrameworks: string[];
  apiLayers: string[];
  authModules: string[];
  dbLayers: string[];
  infrastructureDirs: string[];
  sharedUtilities: string[];
  riskyServices: string[];
}

export interface DependencyImpact {
  modifiedSharedLibraries: string[];
  transitiveRiskHints: string[];
  packageUpdateRisk: RiskLevel;
  apiDependencyChanges: string[];
  serviceCouplingImpact: string[];
  infrastructureRippleEffects: string[];
  score: number;
}

export interface BenchmarkResult {
  complianceScore: number;
  violatedStandards: string[];
  architectureRecommendations: string[];
  consistencyFeedback: string[];
}

export interface ArchitectureImpactResult {
  impactLevel: ImpactLevel;
  impactedModules: string[];
  affectedServices: string[];
  boundaryViolations: string[];
  apiSurfaceChanges: string[];
  repositoryWideEffects: string[];
  explanation: string;
}

export interface DeploymentRiskResult {
  deploymentConfidenceScore: number;
  mergeReadinessScore: number;
  architectureImpactLevel: ImpactLevel;
  riskExplanations: string[];
  affectedServices: string[];
  mitigationRecommendations: string[];
  deploymentCautions: string[];
}

export interface MergeReadinessResult {
  status: MergeReadinessStatus;
  score: number;
  explanations: string[];
  requiredImprovements: string[];
  suggestedReviewPriorities: string[];
  deploymentCautions: string[];
}

export interface PrioritizedFinding {
  title: string;
  category: "blocker" | "actionable" | "informational";
  severity: "critical" | "high" | "medium" | "low" | "info";
  explanation: string;
}

export interface ReviewIntelligenceInput {
  repositoryName: string;
  changedFiles: FileInsight[];
  commitMessages: string[];
  repositoryBenchmarks?: {
    namingConventions?: string[];
    architectureRules?: string[];
    testingRequirements?: string[];
    folderStructureExpectations?: string[];
    securityStandards?: string[];
    performanceGuidelines?: string[];
    codeOrganizationStandards?: string[];
  };
}

export interface ReviewIntelligenceOutput {
  repositoryOverview: RepositoryOverview;
  architectureImpact: ArchitectureImpactResult;
  deploymentRisk: DeploymentRiskResult;
  mergeReadiness: MergeReadinessResult;
  benchmarkCompliance: BenchmarkResult;
  dependencyImpact: DependencyImpact;
  prioritizedFindings: PrioritizedFinding[];
  engineeringRecommendations: string[];
}
