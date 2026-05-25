import { FastifyBaseLogger } from "fastify";
import { AppError } from "../../lib/errors";
import { pullRequestEventSchema } from "./github.schemas";
import { NormalizedPullRequestEvent } from "./github.types";

export function normalizePullRequestEvent(
  logger: FastifyBaseLogger,
  payload: unknown,
  headers: Record<string, string | string[] | undefined>
): NormalizedPullRequestEvent {
  const event = headers["x-github-event"];
  if (event !== "pull_request") {
    throw new AppError("UNSUPPORTED_WEBHOOK_EVENT", 202, "Event ignored");
  }

  const parsed = pullRequestEventSchema.parse(payload);
  const normalized: NormalizedPullRequestEvent = {
    event: "pull_request",
    action: parsed.action,
    deliveryId: typeof headers["x-github-delivery"] === "string" ? headers["x-github-delivery"] : undefined,
    repository: {
      owner: parsed.repository.owner.login,
      repo: parsed.repository.name,
      githubId: parsed.repository.id
    },
    pullRequest: {
      number: parsed.pull_request.number,
      title: parsed.pull_request.title,
      author: parsed.pull_request.user?.login,
      headSha: parsed.pull_request.head.sha,
      headRef: parsed.pull_request.head.ref,
      baseRef: parsed.pull_request.base.ref,
      draft: parsed.pull_request.draft,
      htmlUrl: parsed.pull_request.html_url
    }
  };

  logger.info(
    {
      deliveryId: normalized.deliveryId,
      action: normalized.action,
      repo: `${normalized.repository.owner}/${normalized.repository.repo}`,
      pr: normalized.pullRequest.number
    },
    "Normalized GitHub pull_request event"
  );
  return normalized;
}
