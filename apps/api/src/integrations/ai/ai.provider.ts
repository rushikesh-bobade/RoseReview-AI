import { ZodSchema } from "zod";
import { AIProviderResult, AIStructuredRequest, AITextRequest } from "./ai.types";

export interface AIProvider {
  readonly name: string;
  text(request: AITextRequest): Promise<AIProviderResult<string>>;
  structured<T>(request: AIStructuredRequest, schema: ZodSchema<T>, fallback: T): Promise<AIProviderResult<T>>;
  streamPrepared(): boolean;
}
