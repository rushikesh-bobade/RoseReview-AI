/**
 * Service responsible for generating intelligent, human-readable collaboration 
 * summaries based on engineering events and state changes.
 */
export class CollaborationService {
  generateDeploymentSummary(previousScore: number, newScore: number, context: string): string {
    if (newScore < previousScore) {
      return `Deployment confidence dropped after ${context} changes.`;
    }
    if (newScore > previousScore) {
      return `Deployment confidence improved after ${context} changes.`;
    }
    return `Deployment confidence remained stable during ${context} updates.`;
  }

  generateMergeReadinessSummary(isReady: boolean, missingRequirements: string[]): string {
    if (isReady) {
      return "Pull request is now ready to merge.";
    }
    
    if (missingRequirements.length > 0) {
      return `Merge blocked: ${missingRequirements[0]} requires attention.`;
    }
    
    return "Merge readiness requires further review.";
  }

  generateBenchmarkSummary(violationsCount: number): string {
    if (violationsCount === 0) {
      return "Repository benchmark compliance increased to 100%.";
    }
    return `Detected ${violationsCount} benchmark standard violations.`;
  }

  generateReviewSummary(findingsCount: number, criticalCount: number): string {
    if (findingsCount === 0) {
      return "Code looks exceptional. No issues found.";
    }
    if (criticalCount > 0) {
      return `Found ${criticalCount} critical issues that must be addressed before merging.`;
    }
    return `Found ${findingsCount} suggestions for improvement.`;
  }
}

export const collaborationService = new CollaborationService();
