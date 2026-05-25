import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { errorResponse } from "./api-response";
import { logger } from "./logger";
import { requestContext } from "./request-context";

export function globalErrorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const ctx = requestContext.get();
  const requestId = ctx?.requestId || request.id;

  // 1. Handle Zod Validation Errors
  if (error instanceof ZodError) {
    logger.warn({ req: request, err: error, requestId }, "Validation Error");
    const details = error.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
    return reply.status(400).send(
      errorResponse("VALIDATION_ERROR", "Invalid request payload", details, requestId)
    );
  }

  // 2. Handle Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.warn({ req: request, err: error, code: error.code, requestId }, "Database Error");
    
    // Unique constraint violation
    if (error.code === "P2002") {
      return reply.status(409).send(
        errorResponse("CONFLICT", "Resource already exists", error.meta, requestId)
      );
    }
    // Record not found
    if (error.code === "P2025") {
      return reply.status(404).send(
        errorResponse("NOT_FOUND", "Resource not found", null, requestId)
      );
    }
    
    // Generic DB error
    return reply.status(400).send(
      errorResponse("DATABASE_ERROR", "Database operation failed", null, requestId)
    );
  }

  // 3. Handle Fastify-specific errors (e.g., Payload too large, 404s mapped to errors)
  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode && fastifyError.statusCode < 500) {
    logger.warn({ req: request, err: error, requestId }, "Client Error");
    return reply.status(fastifyError.statusCode).send(
      errorResponse(
        fastifyError.code || "CLIENT_ERROR",
        fastifyError.message,
        null,
        requestId
      )
    );
  }

  // 4. Handle Unexpected Server Errors
  logger.error({ req: request, err: error, requestId }, "Unhandled Server Error");
  
  // Do not leak stack traces to the client in production
  const isProd = process.env.NODE_ENV === "production";
  return reply.status(500).send(
    errorResponse(
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred processing your request.",
      isProd ? null : error.stack,
      requestId
    )
  );
}
