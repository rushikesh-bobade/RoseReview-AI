import Groq from "groq-sdk";
import { FastifyBaseLogger } from "fastify";
import { ZodSchema } from "zod";
import { env } from "../../config/env";
import { AIProvider } from "./ai.provider";
import { AIProviderResult, AIStructuredRequest, AITextRequest } from "./ai.types";
import { safeParseStructuredOutput } from "./ai.utils";

export class GroqProvider implements AIProvider {
  readonly name = "groq";
  private client: Groq | null;
  private model: string;

  constructor(private logger: FastifyBaseLogger) {
    this.client = env.GROQ_API_KEY ? new Groq({ apiKey: env.GROQ_API_KEY }) : null;
    this.model = env.GROQ_MODEL || "llama-3.3-70b-versatile";
  }

  streamPrepared() {
    return true;
  }

  async text(request: AITextRequest): Promise<AIProviderResult<string>> {
    const started = Date.now();
    const completion = await this.callWithRetry(
      request.task,
      async () =>
        this.client!.chat.completions.create({
          model: this.model,
          temperature: request.temperature ?? 0.15,
          messages: [{ role: "user", content: request.prompt }]
        }),
      2
    );

    const content = completion.choices[0]?.message?.content ?? "";
    const latencyMs = Date.now() - started;
    const usage = {
      promptTokens: completion.usage?.prompt_tokens,
      completionTokens: completion.usage?.completion_tokens,
      totalTokens: completion.usage?.total_tokens
    };

    this.logger.info({ provider: this.name, task: request.task, latencyMs, usage }, "AI text generation completed");
    return {
      content,
      raw: content,
      meta: {
        provider: this.name,
        model: this.model,
        latencyMs,
        usage,
        attempts: 1
      }
    };
  }

  async structured<T>(
    request: AIStructuredRequest,
    schema: ZodSchema<T>,
    fallback: T
  ): Promise<AIProviderResult<T>> {
    const textResult = await this.text({
      task: request.task,
      prompt: request.prompt,
      temperature: request.temperature ?? 0.1
    });
    const content = safeParseStructuredOutput(textResult.content, schema, fallback);
    return {
      content,
      raw: textResult.raw,
      meta: textResult.meta
    };
  }

  private async callWithRetry<T>(task: string, fn: () => Promise<T>, retries: number): Promise<T> {
    if (!this.client) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (error) {
        this.logger.warn({ provider: this.name, task, attempt, error }, "AI provider call failed, retrying");
        if (attempt >= retries) throw error;
        attempt += 1;
      }
    }
  }
}
