import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { seedService } from "../seed/seed.service";
import { dashboardDemoService } from "./dashboard-demo.service";
import { successResponse } from "../infrastructure/api-response";

export async function demoRoutes(fastify: FastifyInstance) {
  // Demo Seed Endpoint
  fastify.post("/seed", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await seedService.runSeed();
    return reply.send(successResponse(null, result.message, undefined, request.id));
  });

  // Demo Dashboard Metrics Endpoint
  fastify.get("/dashboard-metrics", async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = await dashboardDemoService.getDashboardMetrics();
    return reply.send(successResponse(metrics, "Demo dashboard metrics generated", undefined, request.id));
  });
}
