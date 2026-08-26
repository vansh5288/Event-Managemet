"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.sendNotification = exports.emitToAll = exports.emitToChatRoom = exports.emitToEvent = exports.emitToUser = exports.setupSocketIO = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const ChatRoom_1 = require("../models/ChatRoom");
const Message_1 = require("../models/Message");
const Notification_1 = require("../models/Notification");
let io;
const setupSocketIO = (socketIO) => {
    exports.io = io = socketIO;
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (token) {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
                socket.userId = decoded.userId;
                socket.userRole = decoded.role;
            }
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.userId || 'anonymous'}`);
        // Join user's personal room
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }
        // Join chat room
        socket.on('join:chat', async (chatRoomId) => {
            socket.join(`chat:${chatRoomId}`);
            try {
                await Message_1.Message.updateMany({ chatRoom: chatRoomId, sender: { $ne: socket.userId }, isRead: false }, { isRead: true, readAt: new Date() });
            }
            catch (error) {
                console.error('Error updating read status:', error);
            }
        });
        // Leave chat room
        socket.on('leave:chat', (chatRoomId) => {
            socket.leave(`chat:${chatRoomId}`);
        });
        // Send message
        socket.on('message:send', async (data) => {
            if (!socket.userId)
                return;
            try {
                const message = await Message_1.Message.create({
                    chatRoom: data.chatRoomId,
                    sender: socket.userId,
                    content: data.content,
                    type: data.type || 'text',
                });
                const populatedMessage = await Message_1.Message.findById(message._id)
                    .populate('sender', 'name email avatar');
                await ChatRoom_1.ChatRoom.findByIdAndUpdate(data.chatRoomId, {
                    lastMessage: {
                        content: data.content,
                        sender: socket.userId,
                        timestamp: new Date(),
                    },
                });
                // Emit to all users in the chat room
                io.to(`chat:${data.chatRoomId}`).emit('message:new', populatedMessage);
                // Notify other participants
                const chatRoom = await ChatRoom_1.ChatRoom.findById(data.chatRoomId);
                if (chatRoom) {
                    chatRoom.participants.forEach(participantId => {
                        if (participantId.toString() !== socket.userId) {
                            io.to(`user:${participantId}`).emit('notification:new', {
                                type: 'chat_message',
                                title: 'New Message',
                                message: data.content.substring(0, 100),
                            });
                        }
                    });
                }
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Typing indicator
        socket.on('typing:start', (chatRoomId) => {
            socket.to(`chat:${chatRoomId}`).emit('typing:start', {
                userId: socket.userId,
                chatRoomId,
            });
        });
        socket.on('typing:stop', (chatRoomId) => {
            socket.to(`chat:${chatRoomId}`).emit('typing:stop', {
                userId: socket.userId,
                chatRoomId,
            });
        });
        // Mark messages as read
        socket.on('message:read', async (chatRoomId) => {
            try {
                await Message_1.Message.updateMany({ chatRoom: chatRoomId, sender: { $ne: socket.userId }, isRead: false }, { isRead: true, readAt: new Date() });
                io.to(`chat:${chatRoomId}`).emit('messages:read', {
                    chatRoomId,
                    userId: socket.userId,
                });
            }
            catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
        // Join event room for notifications
        socket.on('join:event', (eventId) => {
            socket.join(`event:${eventId}`);
        });
        socket.on('leave:event', (eventId) => {
            socket.leave(`event:${eventId}`);
        });
        // Disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.userId || 'anonymous'}`);
        });
    });
};
exports.setupSocketIO = setupSocketIO;
// Helper functions for emitting events
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
};
exports.emitToUser = emitToUser;
const emitToEvent = (eventId, event, data) => {
    if (io) {
        io.to(`event:${eventId}`).emit(event, data);
    }
};
exports.emitToEvent = emitToEvent;
const emitToChatRoom = (chatRoomId, event, data) => {
    if (io) {
        io.to(`chat:${chatRoomId}`).emit(event, data);
    }
};
exports.emitToChatRoom = emitToChatRoom;
const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
exports.emitToAll = emitToAll;
const sendNotification = async (userId, type, title, message, data) => {
    try {
        const notification = await Notification_1.Notification.create({
            user: userId,
            type,
            title,
            message,
            data,
        });
        (0, exports.emitToUser)(userId, 'notification:new', notification);
        return notification;
    }
    catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
};
exports.sendNotification = sendNotification;
//# sourceMappingURL=index.js.map