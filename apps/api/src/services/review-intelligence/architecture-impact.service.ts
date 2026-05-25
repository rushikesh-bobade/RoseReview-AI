import { FastifyBaseLogger } from "fastify";
import { ArchitectureImpactResult, FileInsight } from "./review-intelligence.types";

export class ArchitectureImpactService {
  constructor(private logger: FastifyBaseLogger) {}

  analyze(changedFiles: FileInsight[]): ArchitectureImpactResult {
    const paths = changedFiles.map((f) => f.path.toLowerCase());
    const impactedModules = this.unique(paths.map((p) => p.split("/")[0]).filter(Boolean));
    const affectedServices = impactedModules.filter((m) => /apps|services|api|backend|worker|packages/.test(m));
    const boundaryViolations = paths.filter((p) => /controller.*repository|ui.*database|infra.*component/.test(p));
    const apiSurfaceChanges = paths.filter((p) => /routes|controllers|openapi|swagger|schema/.test(p));
    const repositoryWideEffects = paths.filter((p) => /shared|common|core|config|types/.test(p));

    const weight =
      affectedServices.length * 10 +
      boundaryViolations.length * 20 +
      apiSurfaceChanges.length * 8 +
      repositoryWideEffects.length * 12;
    const impactLevel = weight >= 70 ? "high" : weight >= 35 ? "medium" : "low";

    const result: ArchitectureImpactResult = {
      impactLevel,
      impactedModules,
      affectedServices,
      boundaryViolations,
      apiSurfaceChanges,
      repositoryWideEffects,
      explanation:
        impactLevel === "high"
          ? "Architecture-sensitive modules were modified across shared and API boundaries."
          : impactLevel === "medium"
            ? "Changes affect multiple modules and should be validated across service boundaries."
            : "Changes are relatively isolated with limited architecture impact."
    };

    this.logger.info({ architectureImpact: impactLevel }, "Architecture impact analysis completed");
    return result;
  }

  private unique(values: string[]) {
    return Array.from(new Set(values));
  }
}
