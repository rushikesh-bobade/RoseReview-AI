import { HumanizedComment } from "./review-feedback.types";

export class CommentFormattingService {
  formatForDashboard(comments: HumanizedComment[]) {
    return comments.map((c) => ({
      title: c.title,
      bodyMarkdown: `### ${c.title}\n\n${c.body}`,
      severityBadge: c.severity.toUpperCase(),
      category: c.category,
      confidence: c.confidence,
      group: c.groupedKey ?? "general"
    }));
  }

  formatForInline(filePath: string, comment: HumanizedComment) {
    return {
      filePath,
      text: `${comment.title}: ${comment.body}`,
      severity: comment.severity
    };
  }
}
