export interface GitHubInlineDraftComment {
  path: string;
  line: number;
  body: string;
}

export interface GitHubPublishPayload {
  owner: string;
  repo: string;
  pullNumber: number;
  summaryBody: string;
  inlineComments: GitHubInlineDraftComment[];
}
