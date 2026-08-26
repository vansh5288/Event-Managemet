"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Notification_1 = require("../models/Notification");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all notifications for current user
router.get('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [notifications, total] = await Promise.all([
            Notification_1.Notification.find({ user: req.userId })
                .sort('-createdAt')
                .skip(skip)
                .limit(limitNum),
            Notification_1.Notification.countDocuments({ user: req.userId }),
        ]);
        const unreadCount = await Notification_1.Notification.countDocuments({ user: req.userId, isRead: false });
        res.json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// Get unread count
router.get('/unread-count', auth_1.authenticate, async (req, res, next) => {
    try {
        const count = await Notification_1.Notification.countDocuments({ user: req.userId, isRead: false });
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        next(error);
    }
});
// Mark notification as read
router.patch('/:id/read', auth_1.authenticate, async (req, res, next) => {
    try {
        const notification = await Notification_1.Notification.findOneAndUpdate({ _id: req.params.id, user: req.userId }, { isRead: true, readAt: new Date() }, { new: true });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, data: notification });
    }
    catch (error) {
        next(error);
    }
});
// Mark all notifications as read
router.patch('/read-all', auth_1.authenticate, async (req, res, next) => {
    try {
        await Notification_1.Notification.updateMany({ user: req.userId, isRead: false }, { isRead: true, readAt: new Date() });
        res.json({ success: true, message: 'All notifications marked as read' });
    }
    catch (error) {
        next(error);
    }
});
// Delete notification
router.delete('/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const notification = await Notification_1.Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.userId,
        });
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map