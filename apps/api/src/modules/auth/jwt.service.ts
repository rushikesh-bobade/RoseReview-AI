import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../infrastructure/env";
import { errorResponse } from "../../infrastructure/api-response";

// Extend Fastify interfaces for TypeScript
declare module "fastify" {
  export interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; email: string; name: string | null };
    user: { id: string; email: string; name: string | null };
  }
}

/**
 * Configure JWT signing, verification, and secure cookie handling.
 */
export const jwtPlugin = fp(async (fastify: FastifyInstance) => {
  // Register JWT
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "rosereview_token",
      signed: false, // We rely on JWT signature itself
    },
  });

  // Register Cookie support
  await fastify.register(fastifyCookie, {
    secret: env.JWT_SECRET,
  });

  // Export authentication decorator
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        return reply.status(401).send(
          errorResponse("UNAUTHORIZED", "Authentication required", null, request.id)
        );
      }
    }
  );
});
