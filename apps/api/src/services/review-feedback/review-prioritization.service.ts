import { HumanizedComment, RawReviewSignal, ReviewCategory } from "./review-feedback.types";

export class ReviewPrioritizationService {
  prioritize(signals: RawReviewSignal[]): HumanizedComment[] {
    const enriched = signals
      .map((s) => {
        const confidence = s.confidence ?? (s.severity === "critical" ? 90 : s.severity === "high" ? 82 : 70);
        const category = this.toCategory(s.severity, confidence);
        return { ...s, confidence, category };
      })
      .filter((s) => !(s.severity === "low" && s.confidence < 65))
      .sort((a, b) => b.confidence - a.confidence);

    return enriched.map((s) => ({
      title: s.title,
      body: s.description,
      category: s.category,
      severity: s.severity,
      confidence: s.confidence,
      groupedKey: s.filePath?.split("/")[0]
    }));
  }

  private toCategory(severity: RawReviewSignal["severity"], confidence: number): ReviewCategory {
    if (severity === "critical") return "Critical Risk";
    if (severity === "high") return "High Impact";
    if (severity === "medium" && confidence >= 75) return "Important Recommendation";
    if (severity === "low") return "Optimization Suggestion";
    return "Informational Insight";
  }
}
