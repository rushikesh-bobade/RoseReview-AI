import { prisma } from "../lib/prisma";
import { demoReviewGenerator } from "../mock-intelligence/demo-review-generator.service";
import { fakeActivityGenerator } from "../mock-intelligence/fake-activity-generator.service";
import { logger } from "../infrastructure/logger";

export class SeedService {
  async runSeed() {
    logger.info("Starting Hackathon Demo Database Seed...");

    // 1. Wipe Existing Data (Clean slate for demo)
    await prisma.activityEvent.deleteMany({});
    await prisma.timelineEvent.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.generatedPatch.deleteMany({});
    await prisma.finding.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.pullRequest.deleteMany({});
    await prisma.repository.deleteMany({});
    await prisma.workspaceMember.deleteMany({});
    await prisma.workspace.deleteMany({});
    await prisma.user.deleteMany({});

    // 2. Create Demo User & Workspace
    const user = await prisma.user.create({
      data: {
        email: "demo-presenter@rosereview.dev",
        name: "Demo User",
        githubId: "demo-user-123",
      }
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: "Acme Corp Engineering",
        slug: "acme-corp",
        members: {
          create: {
            userId: user.id,
            role: "admin"
          }
        }
      }
    });

    // 3. Generate Scenarios
    const scenarios = [
      demoReviewGenerator.generateAuthVulnerabilityScenario(),
      demoReviewGenerator.generatePerformanceRegressionScenario()
    ];

    for (const scenario of scenarios) {
      // Create Repository
      const repo = await prisma.repository.create({
        data: {
          workspaceId: workspace.id,
          githubId: "mock-repo-" + scenario.repository.name,
          owner: scenario.repository.owner,
          name: scenario.repository.name,
          defaultBranch: scenario.repository.defaultBranch,
        }
      });

      // Create PR
      const pr = await prisma.pullRequest.create({
        data: {
          repositoryId: repo.id,
          githubNumber: Math.floor(Math.random() * 1000) + 100,
          title: scenario.pullRequest.title,
          author: scenario.pullRequest.author,
          status: scenario.pullRequest.status,
        }
      });

      // Create Review
      const review = await prisma.review.create({
        data: {
          repositoryId: repo.id,
          pullRequestId: pr.id,
          summary: scenario.deploymentImpactSummary,
          status: "completed",
        }
      });

      // Create Findings
      for (const finding of scenario.findings) {
        await prisma.finding.create({
          data: {
            reviewId: review.id,
            title: finding.title,
            description: finding.description,
            severity: finding.severity,
            suggestion: finding.suggestion,
            filePath: finding.filePath,
          }
        });
      }

      // Create Patch if exists
      if (scenario.patch) {
        const filePath = scenario.findings[0]?.filePath || "unknown";
        await prisma.generatedPatch.create({
          data: {
            reviewId: review.id,
            patch: "--- a/" + filePath + "\\n+++ b/" + filePath + "\\n@@ -1,5 +1,5 @@\\n-" + scenario.patch.originalCode + "\\n+" + scenario.patch.improvedCode,
            originalCode: scenario.patch.originalCode,
            improvedCode: scenario.patch.improvedCode,
            explanation: scenario.patch.explanation,
          }
        });
      }

      // Populate Activity Feeds & Timelines
      await fakeActivityGenerator.seedActivityFeed(workspace.id, repo.id, pr.id);
      await fakeActivityGenerator.seedTimelineEvents(pr.id, review.id);
    }

    logger.info("Database Seed Complete. Ready for Demo!");
    return { success: true, message: "Database wiped and seeded with demo data" };
  }
}

export const seedService = new SeedService();
