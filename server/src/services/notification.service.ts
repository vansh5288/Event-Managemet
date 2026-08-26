import { Notification } from '../models/Notification';
import { logger } from '../utils/logger';
import type { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Send a single notification to a user, persist it in the database,
 * and emit it in real-time via Socket.IO.
 */
export const sendNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, any>
) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      data,
    } as any);

    emitToUser(userId, 'notification:new', notification);
    return notification;
  } catch (error) {
    logger.error(`Failed to create notification: ${(error as Error).message}`);
    return null;
  }
};

export class NotificationService {
  static async create(
    userId: string,
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ) {
    return sendNotification(userId, type, title, message, data);
  }

  static async createBulk(
    userIds: string[],
    type: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ) {
    const notifications = userIds.map((userId) => ({
      user: userId,
      type,
      title,
      message,
      data,
    }));

    try {
      const created = await Notification.insertMany(notifications);
      userIds.forEach((userId) => {
        emitToUser(userId, 'notification:new', created[0]);
      });
      return created;
    } catch (error) {
      logger.error(`Failed to create bulk notifications: ${(error as Error).message}`);
      return [];
    }
  }
}

export const notificationService = new NotificationService();

