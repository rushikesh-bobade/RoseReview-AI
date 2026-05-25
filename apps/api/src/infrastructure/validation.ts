import { z } from "zod";

export function parseWithSchema<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
