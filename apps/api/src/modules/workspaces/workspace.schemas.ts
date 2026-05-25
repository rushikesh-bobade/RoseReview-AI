import { z } from "zod";

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters long"),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

export const AddMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "maintainer", "reviewer", "member"]).default("member"),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof AddMemberSchema>;
