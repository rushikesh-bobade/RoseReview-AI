import { z } from "zod";

export const supportedActions = ["opened", "synchronize", "reopened", "ready_for_review"] as const;

export const pullRequestEventSchema = z.object({
  action: z.enum(supportedActions),
  repository: z.object({
    id: z.number(),
    name: z.string(),
    owner: z.object({ login: z.string() })
  }),
  pull_request: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    html_url: z.string().url().optional(),
    draft: z.boolean().optional(),
    user: z.object({ login: z.string() }).optional(),
    head: z.object({
      sha: z.string().optional(),
      ref: z.string().optional()
    }),
    base: z.object({
      ref: z.string().optional()
    })
  })
});

export type PullRequestEventPayload = z.infer<typeof pullRequestEventSchema>;
