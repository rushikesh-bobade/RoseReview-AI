import { ExplanationSummary } from "./review-feedback.types";

export class ExplanationEngineService {
  summarize(input: {
    summary: string;
    findingsCount: number;
    riskLevel?: string;
    benchmarkViolations?: string[];
    dependencyNotes?: string[];
  }): ExplanationSummary {
    return {
      deploymentSummary: `Deployment profile is ${input.riskLevel ?? "medium"} risk with ${input.findingsCount} notable review signals.`,
      mergeReadinessReason:
        input.findingsCount > 5
          ? "Merge is possible after resolving high-impact concerns and validating release safeguards."
          : "Merge readiness is strong with normal verification checks.",
      architectureReasoning:
        "The change should be evaluated against shared boundaries to avoid unintended cross-module behavior.",
      tradeoffExplanation:
        "A small increase in implementation complexity can improve runtime safety and long-term maintainability.",
      benchmarkSummary:
        input.benchmarkViolations && input.benchmarkViolations.length
          ? `Benchmark attention points: ${input.benchmarkViolations.join(", ")}.`
          : "Current changes are broadly aligned with repository benchmark expectations.",
      dependencySummary:
        input.dependencyNotes && input.dependencyNotes.length
          ? input.dependencyNotes.join(" ")
          : "No major dependency coupling concerns were detected."
    };
  }
}
