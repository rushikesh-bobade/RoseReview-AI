import { FastifyBaseLogger } from "fastify";
import {
  ArchitectureImpactResult,
  BenchmarkResult,
  DependencyImpact,
  DeploymentRiskResult,
  FileInsight,
  MergeReadinessResult
} from "./review-intelligence.types";

export class MergeReadinessService {
  constructor(private logger: FastifyBaseLogger) {}

  evaluate(
    changedFiles: FileInsight[],
    deploymentRisk: DeploymentRiskResult,
    architecture: ArchitectureImpactResult,
    dependency: DependencyImpact,
    benchmark: BenchmarkResult
  ): MergeReadinessResult {
    const filePaths = changedFiles.map((f) => f.path.toLowerCase());
    const hasTests = filePaths.some((p) => /test|spec|__tests__/i.test(p));
    const riskyCombo =
      filePaths.some((p) => /auth|database|migration/i.test(p)) &&
      filePaths.some((p) => /infra|deploy|workflow|docker/i.test(p));
    const incompleteIndicators = changedFiles.some((f) => /todo|wip|temp/i.test(f.path));

    const penalties =
      (hasTests ? 0 : 15) +
      (riskyCombo ? 18 : 0) +
      (architecture.impactLevel === "high" ? 16 : architecture.impactLevel === "medium" ? 8 : 0) +
      (dependency.packageUpdateRisk === "high" ? 12 : dependency.packageUpdateRisk === "medium" ? 6 : 0) +
      (incompleteIndicators ? 12 : 0) +
      (benchmark.violatedStandards.length > 0 ? 10 : 0);

    const score = Math.max(0, Math.round((deploymentRisk.mergeReadinessScore + benchmark.complianceScore) / 2 - penalties));
    const status = score >= 75 ? "ready" : score >= 45 ? "needs_changes" : "blocked";

    const result: MergeReadinessResult = {
      status,
      score,
      explanations: [
        `Merge readiness derived from deployment risk (${deploymentRisk.mergeReadinessScore}) and benchmark compliance (${benchmark.complianceScore}).`
      ],
      requiredImprovements: [
        ...(!hasTests ? ["Add or update tests for modified behavior"] : []),
        ...(riskyCombo ? ["Split high-risk infra/auth changes or add staged rollout plan"] : []),
        ...(incompleteIndicators ? ["Resolve WIP/TODO markers before merge"] : [])
      ],
      suggestedReviewPriorities: [
        ...(architecture.impactLevel !== "low" ? ["Review cross-module contracts and boundary impacts"] : []),
        ...(dependency.score > 40 ? ["Validate dependency update compatibility"] : [])
      ],
      deploymentCautions: deploymentRisk.deploymentCautions
    };

    this.logger.info({ mergeStatus: status, score }, "Merge readiness analysis completed");
    return result;
  }
}
