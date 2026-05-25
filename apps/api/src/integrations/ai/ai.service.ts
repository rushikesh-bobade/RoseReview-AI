import { FastifyInstance } from "fastify";
import {
  buildArchitectureImpactPrompt,
  buildDeploymentRiskPrompt,
  buildPatchPrompt,
  buildRepositoryAwareReviewPrompt,
  buildTestPrompt
} from "./ai.prompts";
import {
  aiDeploymentRiskSchema,
  aiPatchSuggestionSchema,
  aiReviewOutputSchema,
  aiTestSuggestionsSchema
} from "./ai.schemas";
import { GroqProvider } from "./groq.provider";
import { AIDeploymentRiskOutput, AIReviewInput, AIReviewOutput, AIPatchSuggestion, AITestSuggestion } from "./ai.types";

export class AIService {
  private provider: GroqProvider;

  constructor(private app: FastifyInstance) {
    this.provider = new GroqProvider(app.log);
  }

  async generateRepositoryAwareReview(input: AIReviewInput): Promise<AIReviewOutput> {
    const fallback: AIReviewOutput = {
      summary: "Review generated with fallback mode due to provider parsing constraints.",
      overallHealthScore: 72,
      deploymentConfidence: 68,
      mergeReadiness: "needs_changes",
      architectureImpact: "Moderate architecture impact across touched modules.",
      humanizedFeedback:
        "This implementation is moving in the right direction, but a couple of high-impact areas need tightening before production deployment.",
      benchmarkViolations: [],
      findings: []
    };

    try {
      const result = await this.provider.structured(
        {
          task: "pr-review",
          prompt: buildRepositoryAwareReviewPrompt(input),
          schemaName: "AIReviewOutput",
          temperature: 0.1
        },
        aiReviewOutputSchema,
        fallback
      );
      return result.content;
    } catch (error) {
      this.app.log.error({ error }, "AI review generation failed; using fallback");
      return fallback;
    }
  }

  async generateDeploymentRisk(input: AIReviewInput): Promise<AIDeploymentRiskOutput> {
    const fallback: AIDeploymentRiskOutput = {
      score: 45,
      level: "medium",
      rationale: "Default medium risk because AI risk pipeline fallback was used.",
      riskFactors: ["Fallback mode active"]
    };

    try {
      const result = await this.provider.structured(
        {
          task: "deployment-risk",
          prompt: buildDeploymentRiskPrompt(input),
          schemaName: "AIDeploymentRisk",
          temperature: 0.1
        },
        aiDeploymentRiskSchema,
        fallback
      );
      return result.content;
    } catch (error) {
      this.app.log.error({ error }, "AI deployment risk generation failed; using fallback");
      return fallback;
    }
  }

  async generatePatch(context: string): Promise<AIPatchSuggestion> {
    const fallback: AIPatchSuggestion = {
      patch: "diff --git a/file.ts b/file.ts\n+// fallback: add safe guard checks",
      explanation: "Fallback patch generated because provider output was unavailable."
    };
    try {
      const result = await this.provider.structured(
        {
          task: "patch-generation",
          prompt: buildPatchPrompt(context),
          schemaName: "AIPatchSuggestion",
          temperature: 0.1
        },
        aiPatchSuggestionSchema,
        fallback
      );
      return result.content;
    } catch (error) {
      this.app.log.error({ error }, "AI patch generation failed; using fallback");
      return fallback;
    }
  }

  async generateTests(context: string, framework: string): Promise<AITestSuggestion[]> {
    const fallback: AITestSuggestion[] = [
      {
        testName: "handles expected behavior",
        content: "it('handles expected behavior', () => { expect(true).toBe(true); });",
        testType: "unit",
        framework
      }
    ];

    try {
      const result = await this.provider.structured(
        {
          task: "test-generation",
          prompt: buildTestPrompt(context, framework),
          schemaName: "AITestSuggestion[]",
          temperature: 0.15
        },
        aiTestSuggestionsSchema,
        fallback
      );
      return result.content;
    } catch (error) {
      this.app.log.error({ error }, "AI test generation failed; using fallback");
      return fallback;
    }
  }

  async generateArchitectureImpactSummary(input: AIReviewInput): Promise<string> {
    try {
      const result = await this.provider.structured(
        {
          task: "architecture-impact",
          prompt: buildArchitectureImpactPrompt(input),
          schemaName: "AIReviewOutput",
          temperature: 0.1
        },
        aiReviewOutputSchema,
        {
          summary: "Architecture impact summary unavailable",
          overallHealthScore: 70,
          deploymentConfidence: 65,
          mergeReadiness: "needs_changes",
          architectureImpact: "Moderate",
          humanizedFeedback: "Please validate architecture-sensitive modules before merging.",
          benchmarkViolations: [],
          findings: []
        }
      );
      return result.content.architectureImpact;
    } catch (error) {
      this.app.log.error({ error }, "Architecture impact summary failed");
      return "Architecture impact summary unavailable";
    }
  }
}
