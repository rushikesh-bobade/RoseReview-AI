import { FastifyBaseLogger } from "fastify";
import { GitHubService } from "../integrations/github/github.service";
import { GitHubRepositoryRef, RepositoryContextSummary } from "../integrations/github/github.types";

export class RepositoryContextService {
  constructor(private logger: FastifyBaseLogger, private github: GitHubService) {}

  async buildRepositoryContext(input: GitHubRepositoryRef & { filePaths: string[] }): Promise<RepositoryContextSummary> {
    const [metadata, languages] = await Promise.all([
      this.github.fetchRepositoryMetadata(input),
      this.github.fetchRepositoryLanguages(input)
    ]);
    const context = this.github.createRepositoryContextFromFiles(metadata.fullName, input.filePaths, languages);
    this.logger.info({ repo: metadata.fullName, languages }, "Repository context prepared");
    return context;
  }
}
