import { FastifyReply } from "fastify";

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  success: false;
  message: string;
  data: null;
  metadata: null;
  timestamp: string;
  requestId?: string;
  error: {
    code: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
  message = "Request successful"
) {
  return reply.status(statusCode).send({
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
    requestId: (reply.request as any).requestId
  } satisfies ApiSuccess<T>);
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
) {
  return reply.status(statusCode).send({
    success: false,
    message,
    data: null,
    metadata: null,
    timestamp: new Date().toISOString(),
    requestId: (reply.request as any).requestId,
    error: {
      code,
      details
    }
  } satisfies ApiError);
}
