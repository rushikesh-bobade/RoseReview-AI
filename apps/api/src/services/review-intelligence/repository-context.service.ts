import { FastifyBaseLogger } from "fastify";
import { FileInsight, RepositoryOverview } from "./review-intelligence.types";

export class RepositoryContextService {
  constructor(private logger: FastifyBaseLogger) {}

  detectRepositoryOverview(changedFiles: FileInsight[]): RepositoryOverview {
    const paths = changedFiles.map((f) => f.path.toLowerCase());
    const find = (pattern: RegExp) => paths.filter((p) => pattern.test(p));

    const frameworks = this.unique([
      ...this.tag(paths, /next\.config|_app\.tsx|_document\.tsx/, "next.js"),
      ...this.tag(paths, /vite\.config|src\/main\.(ts|js)x?/, "vite"),
      ...this.tag(paths, /nuxt\.config/, "nuxt"),
      ...this.tag(paths, /angular\.json/, "angular")
    ]);

    const backendFrameworks = this.unique([
      ...this.tag(paths, /fastify|plugins\/|routes\//, "fastify"),
      ...this.tag(paths, /express/, "express"),
      ...this.tag(paths, /nestjs/, "nestjs")
    ]);

    const apiLayers = this.unique(find(/routes\/|controllers\/|api\//).map((p) => p.split("/")[0]));
    const authModules = find(/auth|login|session|jwt|oauth/);
    const dbLayers = find(/prisma|schema|migration|sql|database/);
    const infrastructureDirs = find(/docker|k8s|helm|terraform|\.github\/workflows|deploy/);
    const sharedUtilities = find(/utils|shared|lib|common/);
    const riskyServices = find(/payment|billing|auth|notification|gateway|webhook|queue/);

    const overview: RepositoryOverview = {
      frameworks,
      backendFrameworks,
      apiLayers,
      authModules: this.unique(authModules),
      dbLayers: this.unique(dbLayers),
      infrastructureDirs: this.unique(infrastructureDirs),
      sharedUtilities: this.unique(sharedUtilities),
      riskyServices: this.unique(riskyServices)
    };

    this.logger.info({ overview }, "Repository context identified");
    return overview;
  }

  private tag(paths: string[], pattern: RegExp, label: string) {
    return paths.some((p) => pattern.test(p)) ? [label] : [];
  }

  private unique(values: string[]) {
    return Array.from(new Set(values));
  }
}
