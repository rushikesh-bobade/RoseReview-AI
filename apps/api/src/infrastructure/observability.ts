import { FastifyInstance } from "fastify";

const metrics = {
  requests: 0,
  errors: 0,
  totalLatencyMs: 0
};

export function registerObservability(app: FastifyInstance) {
  app.addHook("onResponse", async (request, reply) => {
    metrics.requests += 1;
    if (reply.statusCode >= 400) metrics.errors += 1;
    const startAt = (request as any).__startAt as number | undefined;
    if (startAt) metrics.totalLatencyMs += Date.now() - startAt;
  });
}

export function getObservabilitySnapshot() {
  return {
    requests: metrics.requests,
    errors: metrics.errors,
    avgLatencyMs: metrics.requests > 0 ? Math.round(metrics.totalLatencyMs / metrics.requests) : 0
  };
}
