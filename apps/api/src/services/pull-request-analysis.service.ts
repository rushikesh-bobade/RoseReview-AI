import { FastifyBaseLogger } from "fastify";
import { GitHubService } from "../integrations/github/github.service";
import { GitHubPullRequestRef, PullRequestImpactAnalysis } from "../integrations/github/github.types";
import {
  calculateFileImpactScore,
  classifySeverity,
  detectSignals,
  findRiskyFiles,
  groupChangedModules
} from "../integrations/github/github.utils";

export class PullRequestAnalysisService {
  constructor(private logger: FastifyBaseLogger, private github: GitHubService) {}

  async analyzePullRequestImpact(ref: GitHubPullRequestRef): Promise<{
    analysis: PullRequestImpactAnalysis;
    files: Awaited<ReturnType<GitHubService["fetchChangedFiles"]>>;
    commits: Awaited<ReturnType<GitHubService["fetchCommits"]>>;
  }> {
    const [files, commits] = await Promise.all([this.github.fetchChangedFiles(ref), this.github.fetchCommits(ref)]);

    const filePaths = files.map((f) => f.filename);
    const signals = detectSignals(filePaths);
    const impactedModules = groupChangedModules(files);
    const riskyFiles = findRiskyFiles(files);
    const fileImpactScore = calculateFileImpactScore(files);
    const severity = classifySeverity(fileImpactScore + riskyFiles.length * 3);

    const analysis: PullRequestImpactAnalysis = {
      impactedModules,
      affectedServices: impactedModules.filter((m) => /apps|services|backend|api|worker/i.test(m)),
      riskyFiles,
      apiContractChanges: signals.hasApiContractChanges,
      databaseChanges: signals.hasDatabaseChanges,
      authenticationChanges: signals.hasAuthChanges,
      infrastructureChanges: signals.infrastructureFiles.length > 0,
      severity,
      fileImpactScore
    };

    this.logger.info(
      {
        pr: ref.number,
        files: files.length,
        commits: commits.length,
        severity: analysis.severity,
        score: analysis.fileImpactScore
      },
      "Pull request impact analysis prepared"
    );

    return { analysis, files, commits };
  }
}
