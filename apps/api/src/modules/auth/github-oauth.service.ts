import { env } from "../../infrastructure/env";
import { logger } from "../../infrastructure/logger";

/**
 * Service for handling GitHub OAuth authorization flows.
 * Note: This is a preparation layer for the hackathon MVP. Real OAuth flows 
 * will require configuring GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.
 */
export class GitHubOAuthService {
  /**
   * Generates the GitHub OAuth authorization URL to redirect the user to.
   */
  getAuthorizationUrl(state: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID || "mock_client_id";
    const redirectUri = `${env.APP_URL}/api/auth/github/callback`;
    const scopes = ["read:user", "user:email", "repo", "read:org"];
    
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes.join(" "))}&state=${state}`;
  }

  /**
   * Exchanges an authorization code for an access token.
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    logger.info({ code }, "Exchanging GitHub OAuth code for token");
    
    if (process.env.NODE_ENV !== "production" && !process.env.GITHUB_CLIENT_SECRET) {
      // Mock implementation for local testing without real credentials
      return "mock_github_access_token_12345";
    }

    throw new Error("GitHub OAuth exchange not fully implemented without credentials");
  }

  /**
   * Retrieves the authenticated user's profile from GitHub.
   */
  async getGitHubUserProfile(accessToken: string) {
    if (accessToken.startsWith("mock_")) {
      return {
        id: "mock_github_id_999",
        login: "mock-developer",
        email: "developer@example.com",
        avatar_url: "https://avatars.githubusercontent.com/u/9919?v=4",
      };
    }
    
    throw new Error("GitHub API integration requires valid access token");
  }
}

export const githubOAuthService = new GitHubOAuthService();
