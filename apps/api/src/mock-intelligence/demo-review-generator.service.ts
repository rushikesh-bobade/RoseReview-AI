import { MockReviewScenario } from "./mock-intelligence.types";

export class DemoReviewGeneratorService {
  /**
   * Generates a realistic "Authentication Vulnerability" review scenario.
   */
  generateAuthVulnerabilityScenario(): MockReviewScenario {
    return {
      repository: {
        owner: "acme-corp",
        name: "fintech-payment-api",
        defaultBranch: "main",
        description: "Core payment processing microservice",
        framework: "Express / Node.js",
      },
      pullRequest: {
        title: "feat: Add JWT token refresh endpoint",
        description: "Adds a new endpoint to refresh expired JWT tokens using refresh tokens stored in Redis.",
        author: "alex-developer",
        status: "open",
        riskLevel: "high",
        affectedFiles: 3,
        additions: 145,
        deletions: 12,
      },
      findings: [
        {
          title: "Timing Attack Vulnerability in Signature Verification",
          description: "The token signature verification uses a standard string comparison (`===`), which is vulnerable to timing attacks. Attackers could potentially forge signatures by measuring the response time of rejected tokens.",
          severity: "critical",
          suggestion: "Use `crypto.timingSafeEqual()` to compare the provided signature against the expected signature.",
          filePath: "src/auth/token-service.ts",
          lineNumber: 42,
        },
        {
          title: "Missing Rate Limiting on Refresh Endpoint",
          description: "The new `/auth/refresh` endpoint does not implement rate limiting. This could lead to token brute-forcing or denial of service attacks.",
          severity: "warning",
          suggestion: "Apply the existing `strictRateLimitMiddleware` to the refresh route.",
          filePath: "src/routes/auth.routes.ts",
          lineNumber: 18,
        }
      ],
      patch: {
        originalCode: "  function verifySignature(providedSig, expectedSig) {\n    if (providedSig === expectedSig) {\n      return true;\n    }\n    return false;\n  }",
        improvedCode: "  const crypto = require('crypto');\n  \n  function verifySignature(providedSig, expectedSig) {\n    const providedBuffer = Buffer.from(providedSig);\n    const expectedBuffer = Buffer.from(expectedSig);\n    \n    if (providedBuffer.length !== expectedBuffer.length) {\n      return false;\n    }\n    \n    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);\n  }",
        explanation: "Replaced standard string comparison with a constant-time comparison buffer check to prevent cryptographic timing attacks."
      },
      deploymentImpactSummary: "High Risk: Modifications to core authentication flows. A failure here will log out active users or allow unauthorized access.",
      mergeReadiness: false,
      mergeBlockers: ["Address timing attack vulnerability", "Add rate limiting to refresh endpoint"],
    };
  }

  /**
   * Generates a realistic "Performance Regression" review scenario.
   */
  generatePerformanceRegressionScenario(): MockReviewScenario {
    return {
      repository: {
        owner: "acme-corp",
        name: "ecommerce-frontend",
        defaultBranch: "main",
        description: "Next.js storefront application",
        framework: "Next.js / React",
      },
      pullRequest: {
        title: "feat: Add dynamic product recommendations",
        description: "Fetches user-specific recommendations on the product detail page.",
        author: "sarah-engineer",
        status: "open",
        riskLevel: "medium",
        affectedFiles: 5,
        additions: 210,
        deletions: 4,
      },
      findings: [
        {
          title: "N+1 Query in Component Render",
          description: "The recommendation component fetches details for each related product individually within a loop during render. This will cause severe waterfall loading delays.",
          severity: "warning",
          suggestion: "Batch the requests into a single GraphQL query or REST call before rendering.",
          filePath: "components/ProductRecommendations.tsx",
          lineNumber: 56,
        }
      ],
      deploymentImpactSummary: "Medium Risk: May increase LCP (Largest Contentful Paint) metrics on product pages by up to 2.4 seconds under load.",
      mergeReadiness: false,
      mergeBlockers: ["Fix N+1 fetching pattern"],
    };
  }
}

export const demoReviewGenerator = new DemoReviewGeneratorService();
