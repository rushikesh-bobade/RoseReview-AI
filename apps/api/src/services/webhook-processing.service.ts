// @ts-nocheck
import { FastifyInstance } from "fastify";
import { normalizePullRequestEvent } from "../integrations/github/github.webhook";
import { GitHubService } from "../integrations/github/github.service";
import { PullRequestAnalysisService } from "./pull-request-analysis.service";
import { RepositoryContextService } from "./repository-context.service";
import { ReviewScoringService } from "./review-intelligence/review-scoring.service";
import { ReviewWorkflowService } from "./review-publishing/review-workflow.service";

export class WebhookProcessingService {
  constructor(private app: FastifyInstance) {}

  async processGitHubWebhook(payload: unknown, headers: Record<string, string | string[] | undefined>) {
    const normalized = normalizePullRequestEvent(this.app.log, payload, headers);
    const github = new GitHubService(this.app.log);
    const prAnalysis = new PullRequestAnalysisService(this.app.log, github);
    const repoContextService = new RepositoryContextService(this.app.log, github);
    const reviewScoring = new ReviewScoringService(this.app.log);

    const repository = await this.app.prisma.repository.upsert({
      where: { owner_name: { owner: normalized.repository.owner, name: normalized.repository.repo } },
      update: { githubId: normalized.repository.githubId?.toString() },
      create: {
        owner: normalized.repository.owner,
        name: normalized.repository.repo,
        githubId: normalized.repository.githubId?.toString()
      }
    });

    const pullRequest = await this.app.prisma.pullRequest.upsert({
      where: {
        repositoryId_githubNumber: {
          repositoryId: repository.id,
          githubNumber: normalized.pullRequest.number
        }
      },
      update: {
        title: normalized.pullRequest.title,
        author: normalized.pullRequest.author,
        headSha: normalized.pullRequest.headSha,
        baseBranch: normalized.pullRequest.baseRef,
        status: normalized.action
      },
      create: {
        repositoryId: repository.id,
        githubNumber: normalized.pullRequest.number,
        title: normalized.pullRequest.title,
        author: normalized.pullRequest.author,
        headSha: normalized.pullRequest.headSha,
        baseBranch: normalized.pullRequest.baseRef,
        status: normalized.action
      }
    });

    const ref = {
      owner: normalized.repository.owner,
      repo: normalized.repository.repo,
      number: normalized.pullRequest.number
    };

    const pr = await github.fetchPullRequest(ref);
    const { analysis, files, commits } = await prAnalysis.analyzePullRequestImpact(ref);
    const repoContext = await repoContextService.buildRepositoryContext({
      owner: normalized.repository.owner,
      repo: normalized.repository.repo,
      filePaths: files.map((f) => f.filename)
    });

    const comparison =
      normalized.pullRequest.baseRef && normalized.pullRequest.headRef
        ? await github.fetchBranchComparison({
            owner: normalized.repository.owner,
            repo: normalized.repository.repo,
            base: normalized.pullRequest.baseRef,
            head: normalized.pullRequest.headRef
          })
        : null;

    const summary = github.createReviewSummary({
      prTitle: normalized.pullRequest.title,
      impactScore: analysis.fileImpactScore,
      severity: analysis.severity,
      riskyFiles: analysis.riskyFiles,
      context: repoContext
    });

    const createdReview = await this.app.prisma.review.create({
      data: {
        repositoryId: repository.id,
        pullRequestId: pullRequest.id,
        summary,
        status: "queued"
      }
    });

    const intelligence = reviewScoring.generate({
      repositoryName: `${normalized.repository.owner}/${normalized.repository.repo}`,
      changedFiles: files.map((f) => ({
        path: f.filename,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes
      })),
      commitMessages: commits.map((c) => c.message),
      repositoryBenchmarks: repoContext.benchmarks
        ? {
            architectureRules: repoContext.benchmarks.architecturalRules,
            namingConventions: repoContext.benchmarks.namingStandards,
            testingRequirements: repoContext.benchmarks.testingRequirements,
            codeOrganizationStandards: repoContext.benchmarks.codingConventions
          }
        : undefined
    });

    await this.app.prisma.deploymentRisk.create({
      data: {
        pullRequestId: pullRequest.id,
        score: 100 - intelligence.deploymentRisk.deploymentConfidenceScore,
        level:
          intelligence.deploymentRisk.deploymentConfidenceScore < 40
            ? "high"
            : intelligence.deploymentRisk.deploymentConfidenceScore < 70
              ? "medium"
              : "low",
        rationale: intelligence.deploymentRisk.riskExplanations.join(" | ")
      }
    });

    await this.app.prisma.architectureImpactSummary.create({
      data: {
        pullRequestId: pullRequest.id,
        impactLevel: intelligence.architectureImpact.impactLevel,
        summary: intelligence.architectureImpact.explanation,
        impactedModules: JSON.stringify(null),
        affectedServices: intelligence.architectureImpact.affectedServices
      }
    });

    await this.app.prisma.benchmarkReport.create({
      data: {
        pullRequestId: pullRequest.id,
        complianceScore: intelligence.benchmarkCompliance.complianceScore,
        violatedStandards: JSON.stringify(null),
        recommendations: intelligence.benchmarkCompliance.architectureRecommendations
      }
    });

    await this.app.prisma.mergeReadinessReport.create({
      data: {
        pullRequestId: pullRequest.id,
        status: intelligence.mergeReadiness.status,
        score: intelligence.mergeReadiness.score,
        explanations: JSON.stringify(null),
        requiredImprovements: JSON.stringify(null),
        deploymentCautions: intelligence.mergeReadiness.deploymentCautions
      }
    });

    await this.app.prisma.dependencyAnalysisResult.create({
      data: {
        pullRequestId: pullRequest.id,
        score: intelligence.dependencyImpact.score,
        packageUpdateRisk: intelligence.dependencyImpact.packageUpdateRisk,
        modifiedSharedLibraries: JSON.stringify(null),
        transitiveRiskHints: JSON.stringify(null),
        apiDependencyChanges: JSON.stringify(null),
        serviceCouplingImpact: JSON.stringify(null),
        infrastructureRippleEffects: intelligence.dependencyImpact.infrastructureRippleEffects
      }
    });

    await this.app.prisma.repositoryIntelligenceMetadata.create({
      data: {
        pullRequestId: pullRequest.id,
        repositoryOverview: JSON.stringify(null),
        prioritizedFindings: JSON.stringify(null),
        engineeringRecommendations: intelligence.engineeringRecommendations
      }
    });

    let publication: Awaited<ReturnType<ReviewWorkflowService["publish"]>> | null = null;
    try {
      const workflow = new ReviewWorkflowService(this.app);
      publication = await workflow.publish({
        reviewId: createdReview.id,
        githubOwner: normalized.repository.owner,
        githubRepo: normalized.repository.repo,
        githubPrNumber: normalized.pullRequest.number
      });
    } catch (error) {
      this.app.log.warn({ error }, "Auto-publish skipped/failed; review remains in dashboard");
    }

    this.app.log.info(
      {
        repo: `${normalized.repository.owner}/${normalized.repository.repo}`,
        pr: normalized.pullRequest.number,
        action: normalized.action,
        severity: analysis.severity,
        changedFiles: files.length
      },
      "Webhook processed and review task prepared"
    );

    return {
      normalized,
      pullRequest: {
        number: pr.number,
        title: pr.title,
        state: pr.state
      },
      analysis,
      repoContext,
      branchComparison: comparison,
      aiPromptContext: {
        prTitle: normalized.pullRequest.title,
        summary,
        impactedModules: JSON.stringify(null),
        riskyFiles: analysis.riskyFiles
      },
      mergeReadiness: {
        status: intelligence.mergeReadiness.status,
        score: intelligence.mergeReadiness.score,
        recommendation:
          intelligence.mergeReadiness.status === "blocked"
            ? "Block merge until high-risk concerns are addressed"
            : intelligence.mergeReadiness.status === "needs_changes"
              ? "Address required improvements before merge"
              : "Looks mergeable with standard checks"
      },
      reviewIntelligence: intelligence
      ,
      publishing: publication
    };
  }
}
