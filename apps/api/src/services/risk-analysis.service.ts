import { FastifyInstance } from "fastify";
import { DeploymentRiskReport } from "../types/domain";

export class RiskAnalysisService {
  constructor(private app: FastifyInstance) {}

  calculateRisk(input: { changedFiles?: number; linesChanged?: number; findingsCount?: number }): DeploymentRiskReport {
    const score =
      Math.min(100, (input.changedFiles ?? 0) * 8 + (input.linesChanged ?? 0) * 0.1 + (input.findingsCount ?? 0) * 12) |
      0;
    const level = score >= 70 ? "high" : score >= 35 ? "medium" : "low";
    return {
      score,
      level,
      rationale: `Risk computed from changed files (${input.changedFiles ?? 0}), lines changed (${input.linesChanged ?? 0}), and findings (${input.findingsCount ?? 0}).`
    };
  }

  async persistRisk(pullRequestId: string, risk: DeploymentRiskReport) {
    return this.app.prisma.deploymentRisk.create({
      data: {
        pullRequestId,
        score: risk.score,
        level: risk.level,
        rationale: risk.rationale
      }
    });
  }
}
