// @ts-nocheck
import { FastifyInstance } from "fastify";
import { AIService } from "../integrations/ai/ai.service";
import { AIReviewInput } from "../integrations/ai/ai.types";

export class AIReviewService {
  private ai: AIService;

  constructor(private app: FastifyInstance) {
    this.ai = new AIService(app);
  }

  async analyzePullRequest(input: {
    pullRequest: { owner: string; repo: string; number: number };
    diff: string;
    language: string;
    prTitle?: string;
    prDescription?: string;
    changedFiles?: string[];
    commitHistory?: Array<{ sha: string; message: string }>;
    benchmarkStandards?: Record<string, unknown>;
  }) {
    const aiInput: AIReviewInput = {
      prTitle: input.prTitle ?? `PR #${input.pullRequest.number}`,
      prDescription: input.prDescription,
      changedFiles: input.changedFiles ?? ["unknown-file"],
      fileDiffs: [{ filePath: "combined.diff", diff: input.diff }],
      frameworkInfo: [input.language],
      commitHistory: input.commitHistory,
      benchmarkStandards: input.benchmarkStandards,
      architectureSensitiveAreas: ["auth", "database", "api", "infrastructure"]
    };

    const [reviewOutput, riskOutput, architectureImpact] = await Promise.all([
      this.ai.generateRepositoryAwareReview(aiInput),
      this.ai.generateDeploymentRisk(aiInput),
      this.ai.generateArchitectureImpactSummary(aiInput)
    ]);

    const repository = await this.app.prisma.repository.upsert({
      where: {
        owner_name: { owner: input.pullRequest.owner, name: input.pullRequest.repo }
      },
      update: {},
      create: {
        owner: input.pullRequest.owner,
        name: input.pullRequest.repo
      }
    });

    const pullRequest = await this.app.prisma.pullRequest.upsert({
      where: {
        repositoryId_githubNumber: {
          repositoryId: repository.id,
          githubNumber: input.pullRequest.number
        }
      },
      update: { title: aiInput.prTitle },
      create: {
        repositoryId: repository.id,
        githubNumber: input.pullRequest.number,
        title: aiInput.prTitle
      }
    });

    const review = await this.app.prisma.review.create({
      data: {
        repositoryId: repository.id,
        pullRequestId: pullRequest.id,
        summary: `${reviewOutput.summary}\n\nArchitecture Impact: ${architectureImpact}\nHumanized Feedback: ${reviewOutput.humanizedFeedback}`,
        status: reviewOutput.mergeReadiness === "ready" ? "completed" : "needs_attention",
        findings: {
          create: reviewOutput.findings.map((finding) => ({
            title: finding.title,
            description: `${finding.description}\nWhy it matters: ${finding.whyItMatters}\nRecommendation: ${finding.recommendation}`,
            severity: finding.severity,
            filePath: finding.filePath,
            suggestion: finding.recommendation
          }))
        }
      },
      include: { findings: true }
    });

    await this.app.prisma.deploymentRisk.create({
      data: {
        pullRequestId: pullRequest.id,
        score: riskOutput.score,
        level: riskOutput.level,
        rationale: `${riskOutput.rationale} Risk factors: ${riskOutput.riskFactors.join(", ")}`
      }
    });

    this.app.log.info(
      {
        reviewId: review.id,
        healthScore: reviewOutput.overallHealthScore,
        deploymentConfidence: reviewOutput.deploymentConfidence,
        mergeReadiness: reviewOutput.mergeReadiness
      },
      "AI review persisted"
    );

    return {
      ...review,
      reviewMeta: {
        overallHealthScore: reviewOutput.overallHealthScore,
        deploymentConfidence: reviewOutput.deploymentConfidence,
        mergeReadiness: reviewOutput.mergeReadiness,
        benchmarkViolations: reviewOutput.benchmarkViolations
      },
      deploymentRisk: riskOutput
    };
  }
}
