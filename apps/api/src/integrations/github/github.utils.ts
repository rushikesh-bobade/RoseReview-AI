import { GitHubChangedFile } from "./github.types";

const frontendHints = ["next.config", "vite.config", "nuxt.config", "angular.json", "svelte.config"];
const backendHints = ["fastify", "express", "nestjs", "django", "flask", "spring"];
const packageManagerHints = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lockb"];
const infraHints = ["dockerfile", "docker-compose", ".github/workflows", "terraform", "k8s", "helm"];
const testHints = ["vitest", "jest", "playwright", "cypress", "pytest"];

export function classifySeverity(score: number) {
  if (score >= 80) return "critical" as const;
  if (score >= 60) return "high" as const;
  if (score >= 35) return "medium" as const;
  if (score >= 15) return "low" as const;
  return "informational" as const;
}

export function detectSignals(filePaths: string[]) {
  const normalized = filePaths.map((p) => p.toLowerCase());
  const hasAny = (hints: string[]) => hints.filter((hint) => normalized.some((p) => p.includes(hint)));

  return {
    frontendFrameworks: hasAny(frontendHints),
    backendFrameworks: hasAny(backendHints),
    packageManagers: hasAny(packageManagerHints),
    infrastructureFiles: hasAny(infraHints),
    testingFrameworks: hasAny(testHints),
    hasDatabaseChanges: normalized.some((p) => /prisma|schema|migration|sql|database/.test(p)),
    hasAuthChanges: normalized.some((p) => /auth|login|jwt|oauth|session|permission|acl/.test(p)),
    hasApiContractChanges: normalized.some((p) => /openapi|swagger|routes|controller|api/.test(p))
  };
}

export function calculateFileImpactScore(files: GitHubChangedFile[]) {
  return Math.min(
    100,
    files.reduce((acc, file) => {
      const sensitiveWeight = /docker|deploy|infra|auth|schema|migration|api/i.test(file.filename) ? 2 : 1;
      return acc + (file.additions + file.deletions) * sensitiveWeight * 0.5;
    }, 0)
  );
}

export function findRiskyFiles(files: GitHubChangedFile[]) {
  return files
    .filter((f) => /auth|payment|deploy|docker|schema|migration|route|controller|infra|workflow/i.test(f.filename))
    .map((f) => f.filename);
}

export function groupChangedModules(files: GitHubChangedFile[]) {
  const groups = new Set<string>();
  for (const file of files) {
    const top = file.filename.split("/")[0];
    if (top) groups.add(top);
  }
  return Array.from(groups);
}
