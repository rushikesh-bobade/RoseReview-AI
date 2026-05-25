import { prisma } from "../../lib/prisma";
import { CreateNotificationInput, NotificationQueryInput } from "./notification.schemas";
import { logger } from "../../infrastructure/logger";

export class NotificationService {
  async createNotification(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        category: input.category,
        title: input.title,
        message: input.message,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    logger.debug({ notificationId: notification.id, userId: input.userId }, "Notification created");
    return notification;
  }

  async getUserNotifications(userId: string, query: NotificationQueryInput) {
    const where: any = { userId };
    
    if (query.unreadOnly) {
      where.isRead = false;
    }
    
    if (query.category) {
      where.category = query.category;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1, // skip the cursor itself
      }),
    });

    // Parse JSON metadata
    return notifications.map(n => ({
      ...n,
      metadata: n.metadata ? JSON.parse(n.metadata) : null,
    }));
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== userId) {
      throw new Error("Unauthorized to access this notification");
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

export const notificationService = new NotificationService();
