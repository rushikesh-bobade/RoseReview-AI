import fp from "fastify-plugin";
import fastifyRateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";
import { errorResponse } from "./api-response";

/**
 * Configure global API rate limiting to protect against abuse and DoS attacks.
 */
export const rateLimitPlugin = fp(async (fastify: FastifyInstance) => {
  await fastify.register(fastifyRateLimit, {
    max: 100, // Default 100 requests per timeWindow
    timeWindow: "1 minute",
    
    // Customize the response to match our SaaS standardized API response
    errorResponseBuilder: (req, context) => {
      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        `Rate limit exceeded, retry in ${context.after}`,
        {
          limit: context.max,
          after: context.after,
          ttl: context.ttl
        },
        req.id
      );
    },
    
    // We can define custom configurations per route if needed via `config.rateLimit`
    // but this sets the safe baseline for the entire application.
  });
});
