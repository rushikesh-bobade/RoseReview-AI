import fp from "fastify-plugin";
import cors from "@fastify/cors";
import crypto from "node:crypto";
import { FastifyInstance, FastifyRequest } from "fastify";
import { env } from "./env";
import { errorResponse } from "./api-response";

/**
 * Core security plugin configuring CORS, secure headers, and payload limits.
 */
export const securityPlugin = fp(async (fastify: FastifyInstance) => {
  // CORS Configuration
  await fastify.register(cors, {
    origin: env.NODE_ENV === "production" ? env.APP_URL : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-workspace-id"],
  });

  // Global body size limit (e.g. 5MB)
  // This protects against resource exhaustion from massive payloads
  fastify.addHook("onRequest", async (req, reply) => {
    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
      return reply.status(413).send(
        errorResponse("PAYLOAD_TOO_LARGE", "Request body exceeds 5MB limit", null, req.id)
      );
    }
  });
});

/**
 * Utility to verify GitHub Webhook Signatures
 */
export function verifyGitHubWebhookSignature(
  signature: string | string[] | undefined,
  rawBody: Buffer | string
): boolean {
  if (!env.WEBHOOK_SECRET || !signature || typeof signature !== "string") {
    return false;
  }
  
  try {
    const hmac = crypto.createHmac("sha256", env.WEBHOOK_SECRET);
    const digest = "sha256=" + hmac.update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch (error) {
    return false;
  }
}
