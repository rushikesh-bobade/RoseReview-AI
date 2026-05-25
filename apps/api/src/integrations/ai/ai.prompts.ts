import { AIReviewInput } from "./ai.types";

function serializeReviewInput(input: AIReviewInput) {
  return JSON.stringify(input, null, 2);
}

const guardrails = `
You are RoseReview, a senior engineering reviewer.
Prioritize high-impact issues only. Avoid nitpicks and low-value comments.
Explain why each issue matters in production terms.
Be concise, practical, and constructive.
Return strict JSON only, no markdown.
`;

export function buildRepositoryAwareReviewPrompt(input: AIReviewInput) {
  return `${guardrails}
Task: Generate a repository-aware pull request review with actionable findings.
Output JSON keys:
summary, overallHealthScore, deploymentConfidence, mergeReadiness, architectureImpact, humanizedFeedback, benchmarkViolations, findings.
Input:
${serializeReviewInput(input)}
`;
}

export function buildDeploymentRiskPrompt(input: AIReviewInput) {
  return `${guardrails}
Task: Assess deployment risk considering authentication changes, database changes, infrastructure sensitivity, dependency updates, API contracts, middleware/shared services, and missing tests.
Output JSON keys:
score, level, rationale, riskFactors.
Input:
${serializeReviewInput(input)}
`;
}

export function buildPatchPrompt(context: string) {
  return `${guardrails}
Task: Generate a safe minimal patch aligned with repository conventions.
Output JSON keys: patch, explanation.
Context:
${context}
`;
}

export function buildTestPrompt(context: string, framework: string) {
  return `${guardrails}
Task: Generate high-value test suggestions (${framework}) including unit, integration, regression, and failure-case scenarios where applicable.
Output as JSON array of objects with keys:
testName, content, testType, framework.
Context:
${context}
`;
}

export function buildArchitectureImpactPrompt(input: AIReviewInput) {
  return `${guardrails}
Task: Summarize architecture impact and dependency/contract risks for this PR.
Return JSON object with:
summary, overallHealthScore, deploymentConfidence, mergeReadiness, architectureImpact, humanizedFeedback, benchmarkViolations, findings.
Input:
${serializeReviewInput(input)}
`;
}
