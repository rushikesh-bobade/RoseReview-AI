import { ReviewComment } from "@prisma/client";
import { GitHubInlineDraftComment } from "./github-review.types";

export class ReviewCommentMapperService {
  mapSummaryMarkdown(input: {
    summary: string;
    deploymentConfidence?: number;
    mergeReadiness?: string;
    benchmarkNotes?: string[];
    patchPreview?: string | null;
    testsPreview?: string[];
  }) {
    const lines = [
      "## RoseReview Engineering Summary",
      "",
      input.summary,
      "",
      `- Deployment confidence: **${input.deploymentConfidence ?? "n/a"}**`,
      `- Merge readiness: **${input.mergeReadiness ?? "n/a"}**`
    ];
    if (input.benchmarkNotes?.length) lines.push(`- Benchmark notes: ${input.benchmarkNotes.join("; ")}`);
    if (input.patchPreview) lines.push("", "### Suggested Patch Preview", "```diff", input.patchPreview.slice(0, 1200), "```");
    if (input.testsPreview?.length) lines.push("", "### Suggested Tests", ...input.testsPreview.slice(0, 4).map((t) => `- ${t}`));
    return lines.join("\n");
  }

  mapInlineComments(comments: ReviewComment[]): GitHubInlineDraftComment[] {
    const dedup = new Set<string>();
    const out: GitHubInlineDraftComment[] = [];

    for (const c of comments) {
      if ((c.confidence ?? 0) < 70) continue;
      if (c.severity === "info") continue;
      if (!c.githubPath || !c.githubLine) continue;
      const key = `${c.githubPath}:${c.githubLine}:${c.title}`;
      if (dedup.has(key)) continue;
      dedup.add(key);
      out.push({
        path: c.githubPath,
        line: c.githubLine,
        body: `**${c.category}**\n\n${c.body}`
      });
    }
    return out.slice(0, 20);
  }
}
