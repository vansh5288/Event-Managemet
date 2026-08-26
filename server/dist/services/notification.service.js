"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const Notification_1 = require("../models/Notification");
const socket_1 = require("../socket");
const logger_1 = require("../utils/logger");
class NotificationService {
    static async create(userId, type, title, message, data) {
        try {
            const notification = await Notification_1.Notification.create({
                user: userId,
                type,
                title,
                message,
                data,
            });
            // Emit real-time notification via Socket.IO
            (0, socket_1.emitToUser)(userId, 'notification:new', notification);
            return notification;
        }
        catch (error) {
            logger_1.logger.error(`Failed to create notification: ${error}`);
            return null;
        }
    }
    static async createBulk(userIds, type, title, message, data) {
        const notifications = userIds.map((userId) => ({
            user: userId,
            type,
            title,
            message,
            data,
        }));
        try {
            const created = await Notification_1.Notification.insertMany(notifications);
            userIds.forEach((userId) => {
                (0, socket_1.emitToUser)(userId, 'notification:new', created[0]);
            });
            return created;
        }
        catch (error) {
            logger_1.logger.error(`Failed to create bulk notifications: ${error}`);
            return [];
        }
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map