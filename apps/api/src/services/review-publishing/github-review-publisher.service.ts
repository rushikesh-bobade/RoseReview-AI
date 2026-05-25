import { FastifyBaseLogger } from "fastify";
import { GitHubClient } from "../../integrations/github/github.client";
import { GitHubPublishPayload } from "./github-review.types";

export class GitHubReviewPublisherService {
  private client: GitHubClient;
  constructor(private logger: FastifyBaseLogger) {
    this.client = new GitHubClient(logger);
  }

  async publish(payload: GitHubPublishPayload) {
    const review = await this.client.retrySafe("pulls.createReview", async () =>
      this.client.rest.pulls.createReview({
        owner: payload.owner,
        repo: payload.repo,
        pull_number: payload.pullNumber,
        body: payload.summaryBody,
        event: "COMMENT",
        comments: payload.inlineComments.map((c) => ({
          path: c.path,
          line: c.line,
          body: c.body
        }))
      })
    );

    this.logger.info(
      {
        owner: payload.owner,
        repo: payload.repo,
        pull: payload.pullNumber,
        inlineCount: payload.inlineComments.length
      },
      "GitHub review published"
    );

    return {
      reviewId: String(review.data.id),
      reviewUrl: review.data.html_url
    };
  }
}
