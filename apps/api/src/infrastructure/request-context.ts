import { AsyncLocalStorage } from "node:async_hooks";
import { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "node:crypto";

export interface RequestContext {
  requestId: string;
  userId?: string;
  workspaceId?: string;
  traceId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Access the current request context from anywhere in the application.
 * Useful for logging and deep service-level tracing without prop-drilling `req`.
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Fastify hook to initialize the request context for every incoming request.
 */
export async function requestContextHook(req: FastifyRequest, reply: FastifyReply) {
  const traceId = (req.headers["x-trace-id"] as string) || randomUUID();
  const requestId = req.id; // Fastify automatically generates this
  
  const context: RequestContext = {
    requestId,
    traceId,
  };

  // Note: We use `run` in a preHandler or onRequest hook, but Fastify's async flow 
  // requires wrapping the entire request lifecycle if using ALS deeply. 
  // For Fastify, it's often better to register this via a plugin that wraps the handler.
  // We'll export the ALS store so the main server can use it in `addHook('onRequest')`.
}

export const requestContext = {
  store: asyncLocalStorage,
  get: getRequestContext,
};
