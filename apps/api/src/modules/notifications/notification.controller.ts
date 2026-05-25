import { FastifyRequest, FastifyReply } from "fastify";
import { notificationService } from "./notification.service";
import { NotificationQuerySchema } from "./notification.schemas";
import { successResponse, errorResponse } from "../../infrastructure/api-response";

export class NotificationController {
  async getNotifications(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const query = NotificationQuerySchema.parse(request.query);

    const notifications = await notificationService.getUserNotifications(userId, query);
    return reply.send(successResponse(notifications, "Notifications retrieved", undefined, request.id));
  }

  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const count = await notificationService.getUnreadCount(userId);
    return reply.send(successResponse({ count }, "Unread notification count retrieved", undefined, request.id));
  }

  async markAsRead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = request.user.id;
    const { id } = request.params;

    try {
      const notification = await notificationService.markAsRead(id, userId);
      return reply.send(successResponse(notification, "Notification marked as read", undefined, request.id));
    } catch (error: any) {
      if (error.message === "Notification not found") {
        return reply.status(404).send(errorResponse("NOT_FOUND", error.message, null, request.id));
      }
      if (error.message === "Unauthorized to access this notification") {
        return reply.status(403).send(errorResponse("FORBIDDEN", error.message, null, request.id));
      }
      throw error;
    }
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.id;
    const result = await notificationService.markAllAsRead(userId);
    return reply.send(successResponse({ updatedCount: result.count }, "All notifications marked as read", undefined, request.id));
  }
}

export const notificationController = new NotificationController();
