import { prisma } from "../../lib/prisma";
import { ConnectRepositoryInput, UpdateRepositorySettingsInput } from "./repository.schemas";
import { logger } from "../../infrastructure/logger";

export class RepositoryService {
  async connectRepository(userId: string, input: ConnectRepositoryInput) {
    // 1. Verify user has access to this workspace
    const workspaceAccess = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: userId,
        },
      },
    });

    if (!workspaceAccess) {
      throw new Error("Unauthorized to add repositories to this workspace");
    }

    // 2. Connect the repository
    const repository = await prisma.repository.create({
      data: {
        workspaceId: input.workspaceId,
        githubId: input.githubId,
        owner: input.owner,
        name: input.name,
        defaultBranch: input.defaultBranch,
      },
    });

    logger.info(
      { repoId: repository.id, workspaceId: input.workspaceId, userId },
      "Repository connected to workspace"
    );

    return repository;
  }

  async listWorkspaceRepositories(workspaceId: string, userId: string) {
    // Verify access
    const hasAccess = await prisma.workspaceMember.count({
      where: { workspaceId, userId },
    });

    if (!hasAccess) {
      throw new Error("Unauthorized access to workspace");
    }

    return prisma.repository.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { pullRequests: true, reviews: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async updateSettings(repositoryId: string, userId: string, input: UpdateRepositorySettingsInput) {
    // Verify access through workspace
    const repo = await prisma.repository.findUnique({
      where: { id: repositoryId },
      select: { workspaceId: true },
    });

    if (!repo) {
      throw new Error("Repository not found");
    }

    const hasAccess = await prisma.workspaceMember.count({
      where: { workspaceId: repo.workspaceId, userId },
    });

    if (!hasAccess) {
      throw new Error("Unauthorized to modify repository settings");
    }

    return prisma.repository.update({
      where: { id: repositoryId },
      data: input,
    });
  }
}

export const repositoryService = new RepositoryService();
