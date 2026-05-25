import { FastifyInstance } from "fastify";
import { successResponse, errorResponse } from "./api-response";
// We will import prisma once it's set up in the db directory, but for now we'll simulate the check
// import { prisma } from "../lib/prisma";

export async function registerHealthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (req, reply) => {
    try {
      // Execute a lightweight query to verify DB connectivity
      // await prisma.$queryRaw`SELECT 1`;
      const dbStatus = "up"; // Mock until prisma client is generated and imported
      
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      const healthData = {
        status: "operational",
        uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "0.1.0",
        services: {
          database: dbStatus,
          api: "up",
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        }
      };
      
      return reply.send(successResponse(healthData, "System operational"));
    } catch (error) {
      fastify.log.error(error, "Health check failed");
      return reply.status(503).send(
        errorResponse("SERVICE_UNAVAILABLE", "One or more services are down", null, req.id)
      );
    }
  });
}
