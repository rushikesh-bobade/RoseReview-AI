import { ZodSchema } from "zod";
import { AppError } from "../../lib/errors";

export function extractJsonBlock(raw: string) {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i) ?? trimmed.match(/```\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

export function safeParseStructuredOutput<T>(raw: string, schema: ZodSchema<T>, fallback: T): T {
  try {
    const json = JSON.parse(extractJsonBlock(raw));
    const parsed = schema.safeParse(json);
    if (parsed.success) return parsed.data;
    return fallback;
  } catch {
    return fallback;
  }
}

export function requireProviderKey(enabled: boolean, providerName: string) {
  if (!enabled) {
    throw new AppError("AI_PROVIDER_NOT_CONFIGURED", 503, `${providerName} provider not configured`);
  }
}
