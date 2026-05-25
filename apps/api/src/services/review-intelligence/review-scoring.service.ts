import { FastifyBaseLogger } from "fastify";
import { reviewIntelligenceInputSchema } from "./review-intelligence.schemas";
import {
  PrioritizedFinding,
  ReviewIntelligenceInput,
  ReviewIntelligenceOutput
} from "./review-intelligence.types";
import { RepositoryContextService } from "./repository-context.service";
import { ArchitectureImpactService } from "./architecture-impact.service";
import { DependencyImpactService } from "./dependency-impact.service";
import { BenchmarkAnalysisService } from "./benchmark-analysis.service";
import { DeploymentRiskService } from "./deployment-risk.service";
import { MergeReadinessService } from "./merge-readiness.service";

export class ReviewScoringService {
  private repositoryContext: RepositoryContextService;
  private architectureImpact: ArchitectureImpactService;
  private dependencyImpact: DependencyImpactService;
  private benchmarkAnalysis: BenchmarkAnalysisService;
  private deploymentRisk: DeploymentRiskService;
  private mergeReadiness: MergeReadinessService;

  constructor(private logger: FastifyBaseLogger) {
    this.repositoryContext = new RepositoryContextService(logger);
    this.architectureImpact = new ArchitectureImpactService(logger);
    this.dependencyImpact = new DependencyImpactService(logger);
    this.benchmarkAnalysis = new BenchmarkAnalysisService(logger);
    this.deploymentRisk = new DeploymentRiskService(logger);
    this.mergeReadiness = new MergeReadinessService(logger);
  }

  generate(input: ReviewIntelligenceInput): ReviewIntelligenceOutput {
    const parsed = reviewIntelligenceInputSchema.parse(input);

    const repositoryOverview = this.repositoryContext.detectRepositoryOverview(parsed.changedFiles);
    const architecture = this.architectureImpact.analyze(parsed.changedFiles);
    const dependency = this.dependencyImpact.analyze(parsed.changedFiles);
    const benchmark = this.benchmarkAnalysis.evaluate(parsed);
    const risk = this.deploymentRisk.evaluate(parsed.changedFiles, architecture, dependency);
    const merge = this.mergeReadiness.evaluate(parsed.changedFiles, risk, architecture, dependency, benchmark);
    const prioritizedFindings = this.prioritizeFindings({
      riskExplanations: risk.riskExplanations,
      benchmarkViolations: benchmark.violatedStandards,
      architectureLevel: architecture.impactLevel,
      mergeStatus: merge.status
    });

    const output: ReviewIntelligenceOutput = {
      repositoryOverview,
      architectureImpact: architecture,
      deploymentRisk: risk,
      mergeReadiness: merge,
      benchmarkCompliance: benchmark,
      dependencyImpact: dependency,
      prioritizedFindings,
      engineeringRecommendations: this.composeRecommendations(risk, merge, benchmark)
    };

    this.logger.info(
      {
        deploymentConfidence: output.deploymentRisk.deploymentConfidenceScore,
        mergeReadiness: output.mergeReadiness.status,
        benchmarkScore: output.benchmarkCompliance.complianceScore
      },
      "Review intelligence generated"
    );

    return output;
  }

  private prioritizeFindings(input: {
    riskExplanations: string[];
    benchmarkViolations: string[];
    architectureLevel: "low" | "medium" | "high";
    mergeStatus: "ready" | "needs_changes" | "blocked";
  }): PrioritizedFinding[] {
    const findings: PrioritizedFinding[] = [];

    for (const risk of input.riskExplanations.slice(0, 6)) {
      findings.push({
        title: "Deployment risk signal",
        category: /database|auth|infra|cicd|apiContract/i.test(risk) ? "blocker" : "actionable",
        severity: /database|auth|infra|cicd/i.test(risk) ? "high" : "medium",
        explanation: this.humanize(risk)
      });
    }

    for (const violation of input.benchmarkViolations.slice(0, 4)) {
      findings.push({
        title: "Benchmark compliance issue",
        category: "actionable",
        severity: "medium",
        explanation: this.humanize(violation)
      });
    }

    if (input.architectureLevel === "high") {
      findings.push({
        title: "Architecture-sensitive modifications",
        category: "blocker",
        severity: "high",
        explanation:
          "These changes touch shared architectural boundaries; validating cross-service behavior before merge will reduce production surprises."
      });
    }

    if (input.mergeStatus === "ready") {
      findings.push({
        title: "Merge readiness healthy",
        category: "informational",
        severity: "info",
        explanation: "Current risk profile looks controlled; proceed with normal release safeguards."
      });
    }

    return findings;
  }

  private composeRecommendations(
    risk: ReviewIntelligenceOutput["deploymentRisk"],
    merge: ReviewIntelligenceOutput["mergeReadiness"],
    benchmark: ReviewIntelligenceOutput["benchmarkCompliance"]
  ) {
    return this.unique([
      ...risk.mitigationRecommendations,
      ...merge.requiredImprovements,
      ...benchmark.architectureRecommendations
    ]).slice(0, 8);
  }

  private humanize(text: string) {
    return `This change looks workable, though ${text.toLowerCase()} and could create avoidable release risk if left unchecked.`;
  }

  private unique(values: string[]) {
    return Array.from(new Set(values));
  }
}
