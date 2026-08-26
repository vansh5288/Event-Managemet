export declare class NotificationService {
    static create(userId: string, type: string, title: string, message: string, data?: Record<string, any>): Promise<(import("mongoose").Document<unknown, {}, import("../models/Notification").INotification> & import("../models/Notification").INotification & {
        _id: import("mongoose").Types.ObjectId;
    }) | null>;
    static createBulk(userIds: string[], type: string, title: string, message: string, data?: Record<string, any>): Promise<import("mongoose").MergeType<import("mongoose").Document<unknown, {}, import("../models/Notification").INotification> & import("../models/Notification").INotification & {
        _id: import("mongoose").Types.ObjectId;
    }, Omit<{
        user: string;
        type: string;
        title: string;
        message: string;
        data: Record<string, any> | undefined;
    }, "_id">>[]>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map