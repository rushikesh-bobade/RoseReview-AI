import { FastifyInstance } from "fastify";
import { notificationController } from "./notification.controller";

export async function notificationRoutes(fastify: FastifyInstance) {
  // All notification routes require authentication
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/", notificationController.getNotifications.bind(notificationController));
  fastify.get("/unread-count", notificationController.getUnreadCount.bind(notificationController));
  fastify.patch("/:id/read", notificationController.markAsRead.bind(notificationController));
  fastify.post("/mark-all-read", notificationController.markAllAsRead.bind(notificationController));
}
