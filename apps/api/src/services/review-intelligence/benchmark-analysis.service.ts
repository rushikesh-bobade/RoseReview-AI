import { FastifyBaseLogger } from "fastify";
import { BenchmarkResult, FileInsight, ReviewIntelligenceInput } from "./review-intelligence.types";

export class BenchmarkAnalysisService {
  constructor(private logger: FastifyBaseLogger) {}

  evaluate(input: Pick<ReviewIntelligenceInput, "repositoryBenchmarks" | "changedFiles">): BenchmarkResult {
    const violatedStandards: string[] = [];
    const recommendations: string[] = [];
    const feedback: string[] = [];

    const filePaths = input.changedFiles.map((f) => f.path);
    const testsPresent = filePaths.some((p) => /test|spec|__tests__/i.test(p));

    if (input.repositoryBenchmarks?.testingRequirements?.length && !testsPresent) {
      violatedStandards.push("Testing requirements not met: no test changes detected.");
      recommendations.push("Add targeted tests for changed logic and risk paths.");
    }

    if (input.repositoryBenchmarks?.securityStandards?.length) {
      const authTouched = filePaths.some((p) => /auth|login|session|jwt/i.test(p));
      if (authTouched) {
        feedback.push("Security-sensitive paths changed; include explicit validation and threat assumptions.");
      }
    }

    if (input.repositoryBenchmarks?.folderStructureExpectations?.length) {
      const rootFiles = filePaths.filter((p) => !p.includes("/"));
      if (rootFiles.length > 0) {
        violatedStandards.push("Unexpected root-level modifications may violate folder structure standards.");
      }
    }

    const complianceScore = Math.max(0, 100 - violatedStandards.length * 22 - (testsPresent ? 0 : 8));
    const result: BenchmarkResult = {
      complianceScore,
      violatedStandards,
      architectureRecommendations: recommendations,
      consistencyFeedback: feedback
    };

    this.logger.info({ benchmarkScore: complianceScore }, "Benchmark analysis completed");
    return result;
  }
}
