import { FastifyBaseLogger } from "fastify";
import {
  ArchitectureImpactResult,
  DependencyImpact,
  DeploymentRiskResult,
  FileInsight
} from "./review-intelligence.types";

export class DeploymentRiskService {
  constructor(private logger: FastifyBaseLogger) {}

  evaluate(changedFiles: FileInsight[], architecture: ArchitectureImpactResult, dependency: DependencyImpact): DeploymentRiskResult {
    const paths = changedFiles.map((f) => f.path.toLowerCase());
    const has = (regex: RegExp) => paths.some((p) => regex.test(p));

    const riskSignals = {
      auth: has(/auth|login|session|jwt|oauth/),
      middleware: has(/middleware|interceptor|guard/),
      database: has(/prisma|schema|migration|sql|database/),
      apiContract: has(/routes|controllers|openapi|swagger|graphql|proto/),
      dependency: has(/package\.json|lock|requirements|go\.mod|pom\.xml/),
      envSensitive: has(/\.env|config|secrets|vault/),
      sharedUtils: has(/shared|common|utils|lib\/core/),
      infra: has(/docker|k8s|terraform|helm|workflow|deploy/),
      cicd: has(/\.github\/workflows|jenkins|gitlab-ci/),
      missingTests: !has(/test|spec|__tests__/),
      highImpact: changedFiles.some((f) => f.changes > 200)
    };

    const scoreRaw =
      (riskSignals.auth ? 12 : 0) +
      (riskSignals.middleware ? 8 : 0) +
      (riskSignals.database ? 14 : 0) +
      (riskSignals.apiContract ? 10 : 0) +
      (riskSignals.dependency ? 10 : 0) +
      (riskSignals.envSensitive ? 9 : 0) +
      (riskSignals.sharedUtils ? 8 : 0) +
      (riskSignals.infra ? 13 : 0) +
      (riskSignals.cicd ? 8 : 0) +
      (riskSignals.missingTests ? 10 : 0) +
      (riskSignals.highImpact ? 10 : 0) +
      (architecture.impactLevel === "high" ? 12 : architecture.impactLevel === "medium" ? 6 : 0) +
      Math.round(dependency.score * 0.2);

    const score = Math.min(100, scoreRaw);
    const deploymentConfidenceScore = Math.max(0, 100 - score);
    const mergeReadinessScore = Math.max(0, deploymentConfidenceScore - (riskSignals.missingTests ? 12 : 0));
    const architectureImpactLevel = architecture.impactLevel;
    const riskExplanations = Object.entries(riskSignals)
      .filter(([, value]) => value)
      .map(([key]) => `Risk signal detected: ${key}`);
    const affectedServices = architecture.affectedServices;
    const mitigationRecommendations = [
      ...(riskSignals.missingTests ? ["Add focused tests for modified high-impact paths"] : []),
      ...(riskSignals.database ? ["Run migration dry-run and validate rollback path"] : []),
      ...(riskSignals.apiContract ? ["Validate backward compatibility for API consumers"] : []),
      ...(riskSignals.infra || riskSignals.cicd ? ["Perform deployment rehearsal in staging"] : [])
    ];
    const deploymentCautions = [
      ...(riskSignals.auth ? ["Authentication paths changed; monitor error rates after release"] : []),
      ...(riskSignals.sharedUtils ? ["Shared utility changes may affect multiple services"] : [])
    ];

    const result: DeploymentRiskResult = {
      deploymentConfidenceScore,
      mergeReadinessScore,
      architectureImpactLevel,
      riskExplanations,
      affectedServices,
      mitigationRecommendations,
      deploymentCautions
    };

    this.logger.info({ deploymentConfidenceScore, mergeReadinessScore }, "Deployment risk analysis completed");
    return result;
  }
}
