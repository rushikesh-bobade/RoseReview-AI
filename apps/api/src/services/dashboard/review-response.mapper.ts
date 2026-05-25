import { SeverityBreakdown } from "./dashboard.types";

export function normalizeSeverity(severity?: string): keyof SeverityBreakdown {
  const raw = (severity ?? "info").toLowerCase();
  if (raw === "critical" || raw === "high" || raw === "medium" || raw === "low" || raw === "info") return raw;
  return "info";
}

export function mapSeverityBreakdown(findings: Array<{ severity: string }>): SeverityBreakdown {
  const base: SeverityBreakdown = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const finding of findings) {
    base[normalizeSeverity(finding.severity)] += 1;
  }
  return base;
}

export function mapPatchPreview(patch: { patch: string; explanation: string | null } | null) {
  if (!patch) return null;
  return {
    explanation: patch.explanation,
    preview: patch.patch.slice(0, 1000)
  };
}

export function mapTestsPreview(tests: Array<{ testName: string; framework: string | null; content: string }>) {
  return tests.map((t) => ({
    name: t.testName,
    framework: t.framework ?? "unknown",
    preview: t.content.slice(0, 500)
  }));
}
