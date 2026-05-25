import { prisma } from "../../lib/prisma";
import { CreateWorkspaceInput, AddMemberInput } from "./workspace.schemas";
import { logger } from "../../infrastructure/logger";

export class WorkspaceService {
  async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    const existing = await prisma.workspace.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new Error("Workspace with this slug already exists");
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug: input.slug,
        members: {
          create: {
            userId,
            role: "admin", // The creator is automatically an admin
          },
        },
      },
    });

    logger.info({ workspaceId: workspace.id, userId }, "New workspace created");
    return workspace;
  }

  async getUserWorkspaces(userId: string) {
    return prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true, repositories: true },
        },
      },
    });
  }

  async getWorkspaceBySlug(slug: string, userId: string) {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          where: { userId },
        },
        repositories: true,
      },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    if (workspace.members.length === 0) {
      throw new Error("Unauthorized access to workspace");
    }

    return workspace;
  }
}

export const workspaceService = new WorkspaceService();
