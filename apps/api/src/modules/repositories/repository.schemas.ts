import { z } from "zod";

export const ConnectRepositorySchema = z.object({
  workspaceId: z.string().cuid("Invalid workspace ID"),
  githubId: z.string().min(1, "GitHub ID is required"),
  owner: z.string().min(1, "Repository owner is required"),
  name: z.string().min(1, "Repository name is required"),
  defaultBranch: z.string().default("main"),
});

export const UpdateRepositorySettingsSchema = z.object({
  isReviewEnabled: z.boolean().optional(),
  benchmarkStrictness: z.enum(["loose", "standard", "strict"]).optional(),
  deploymentSensitivity: z.enum(["low", "medium", "high"]).optional(),
});

export type ConnectRepositoryInput = z.infer<typeof ConnectRepositorySchema>;
export type UpdateRepositorySettingsInput = z.infer<typeof UpdateRepositorySettingsSchema>;
