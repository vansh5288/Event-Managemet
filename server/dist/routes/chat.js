"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ChatRoom_1 = require("../models/ChatRoom");
const Message_1 = require("../models/Message");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get user's chat rooms
router.get('/rooms', auth_1.authenticate, async (req, res, next) => {
    try {
        const chatRooms = await ChatRoom_1.ChatRoom.find({
            participants: req.userId,
            isActive: true,
        })
            .populate('participants', 'name email avatar')
            .populate('event', 'title')
            .populate('lastMessage.sender', 'name')
            .sort('-updatedAt');
        res.json({ success: true, data: chatRooms });
    }
    catch (error) {
        next(error);
    }
});
// Get or create direct chat room
router.post('/direct', auth_1.authenticate, async (req, res, next) => {
    try {
        const { participantId } = req.body;
        if (!participantId) {
            return res.status(400).json({ success: false, message: 'Participant ID is required' });
        }
        // Check if chat room already exists
        let chatRoom = await ChatRoom_1.ChatRoom.findOne({
            type: ChatRoom_1.ChatRoomType.DIRECT,
            participants: { $all: [req.userId, participantId], $size: 2 },
        }).populate('participants', 'name email avatar');
        if (!chatRoom) {
            chatRoom = await ChatRoom_1.ChatRoom.create({
                type: ChatRoom_1.ChatRoomType.DIRECT,
                participants: [req.userId, participantId],
            });
            chatRoom = await ChatRoom_1.ChatRoom.findById(chatRoom._id).populate('participants', 'name email avatar');
        }
        res.json({ success: true, data: chatRoom });
    }
    catch (error) {
        next(error);
    }
});
// Get event chat room
router.get('/event/:eventId', auth_1.authenticate, async (req, res, next) => {
    try {
        let chatRoom = await ChatRoom_1.ChatRoom.findOne({
            type: ChatRoom_1.ChatRoomType.EVENT,
            event: req.params.eventId,
        }).populate('participants', 'name email avatar');
        if (!chatRoom) {
            chatRoom = await ChatRoom_1.ChatRoom.create({
                type: ChatRoom_1.ChatRoomType.EVENT,
                event: req.params.eventId,
                name: 'Event Chat',
                participants: [req.userId],
            });
            chatRoom = await ChatRoom_1.ChatRoom.findById(chatRoom._id).populate('participants', 'name email avatar');
        }
        res.json({ success: true, data: chatRoom });
    }
    catch (error) {
        next(error);
    }
});
// Get messages for a chat room
router.get('/:chatRoomId', auth_1.authenticate, async (req, res, next) => {
    try {
        const { page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [messages, total] = await Promise.all([
            Message_1.Message.find({ chatRoom: req.params.chatRoomId })
                .populate('sender', 'name email avatar')
                .sort('-createdAt')
                .skip(skip)
                .limit(limitNum),
            Message_1.Message.countDocuments({ chatRoom: req.params.chatRoomId }),
        ]);
        // Mark messages as read
        await Message_1.Message.updateMany({
            chatRoom: req.params.chatRoomId,
            sender: { $ne: req.userId },
            isRead: false,
        }, { isRead: true, readAt: new Date() });
        res.json({
            success: true,
            data: messages.reverse(),
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
// Send a message
router.post('/', auth_1.authenticate, async (req, res, next) => {
    try {
        const { chatRoomId, content, type } = req.body;
        const message = await Message_1.Message.create({
            chatRoom: chatRoomId,
            sender: req.userId,
            content,
            type: type || 'text',
        });
        const populatedMessage = await Message_1.Message.findById(message._id).populate('sender', 'name email avatar');
        // Update chat room's last message
        await ChatRoom_1.ChatRoom.findByIdAndUpdate(chatRoomId, {
            lastMessage: {
                content,
                sender: req.userId,
                timestamp: new Date(),
            },
        });
        res.status(201).json({ success: true, data: populatedMessage });
    }
    catch (error) {
        next(error);
    }
});
// Mark message as read
router.patch('/:id/read', auth_1.authenticate, async (req, res, next) => {
    try {
        const message = await Message_1.Message.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() }, { new: true });
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        res.json({ success: true, data: message });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map