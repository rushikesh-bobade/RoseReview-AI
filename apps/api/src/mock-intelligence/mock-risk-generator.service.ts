export class MockRiskGeneratorService {
  generateDeploymentRisks() {
    return [
      {
        level: "high",
        score: 85,
        rationale: "This PR modifies core database migration files and alters the users table schema. If deployed during peak hours, this may cause transaction deadlocks."
      },
      {
        level: "medium",
        score: 65,
        rationale: "Adds a new third-party dependency (lodash). While generally safe, this increases the bundle size and introduces potential supply-chain vulnerability vectors."
      },
      {
        level: "low",
        score: 15,
        rationale: "Changes are isolated to CSS modules and documentation. Negligible deployment risk."
      }
    ];
  }

  generateArchitectureImpact() {
    return [
      {
        impactLevel: "high",
        summary: "Authentication Middleware Re-architecture",
        impactedModules: ["src/auth", "src/middleware", "src/routes/protected"],
        affectedServices: ["PaymentAPI", "UserDashboard"]
      },
      {
        impactLevel: "medium",
        summary: "Database Connection Pool Optimization",
        impactedModules: ["src/db/prisma-client.ts", "src/config/database.ts"],
        affectedServices: ["CoreAPI"]
      }
    ];
  }
}

export const mockRiskGenerator = new MockRiskGeneratorService();
