export type LifecycleState = "pending" | "completed" | "regenerated" | "failed" | "partial" | "updated";

export interface WorkflowInput {
  reviewId: string;
  githubOwner: string;
  githubRepo: string;
  githubPrNumber: number;
}

export interface WorkflowResult {
  reviewId: string;
  status: LifecycleState;
  githubReviewUrl?: string;
  publishedComments: number;
  deploymentConfidence?: number;
  mergeReadiness?: string;
}
