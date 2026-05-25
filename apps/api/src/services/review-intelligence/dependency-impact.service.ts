import { FastifyBaseLogger } from "fastify";
import { DependencyImpact, FileInsight } from "./review-intelligence.types";

export class DependencyImpactService {
  constructor(private logger: FastifyBaseLogger) {}

  analyze(changedFiles: FileInsight[]): DependencyImpact {
    const paths = changedFiles.map((f) => f.path.toLowerCase());
    const modifiedSharedLibraries = paths.filter((p) => /packages\/|shared\/|lib\/|common\//.test(p));
    const packageUpdates = paths.filter((p) => /package\.json|pnpm-lock|yarn\.lock|package-lock/.test(p));
    const apiDependencyChanges = paths.filter((p) => /openapi|swagger|client|sdk|graphql/.test(p));
    const serviceCouplingImpact = paths.filter((p) => /services\/|modules\/|domain\//.test(p));
    const infrastructureRippleEffects = paths.filter((p) => /docker|k8s|terraform|workflow|deploy/.test(p));

    const score = Math.min(
      100,
      modifiedSharedLibraries.length * 15 +
        packageUpdates.length * 20 +
        apiDependencyChanges.length * 15 +
        serviceCouplingImpact.length * 6 +
        infrastructureRippleEffects.length * 12
    );

    const packageUpdateRisk = score >= 65 ? "high" : score >= 35 ? "medium" : "low";
    const transitiveRiskHints = [
      ...(packageUpdates.length ? ["Dependency graph changed; validate lockfile and runtime compatibility"] : []),
      ...(modifiedSharedLibraries.length ? ["Shared modules changed; check downstream services for regressions"] : [])
    ];

    const result: DependencyImpact = {
      modifiedSharedLibraries,
      transitiveRiskHints,
      packageUpdateRisk,
      apiDependencyChanges,
      serviceCouplingImpact,
      infrastructureRippleEffects,
      score
    };

    this.logger.info({ dependencyScore: score }, "Dependency impact analysis completed");
    return result;
  }
}
