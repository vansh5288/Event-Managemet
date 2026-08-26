import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ChatRoom } from '../models/ChatRoom';
import { Message } from '../models/Message';
import { sendNotification, setSocketIO } from '../services/notification.service';

let io: Server;

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupSocketIO = (socketIO: Server) => {
  io = socketIO;
  setSocketIO(socketIO);

  io.use((socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (token) {
        const decoded = jwt.verify(token as string, config.jwtSecret) as { userId: string; role: string };
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;
      }
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`🔌 User connected: ${socket.userId || 'anonymous'}`);

    // Join user's personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join chat room
    socket.on('join:chat', async (chatRoomId: string) => {
      socket.join(`chat:${chatRoomId}`);
      try {
        await Message.updateMany(
          { chatRoom: chatRoomId, sender: { $ne: socket.userId }, isRead: false },
          { isRead: true, readAt: new Date() }
        );
      } catch (error) {
        console.error('Error updating read status:', error);
      }
    });

    // Leave chat room
    socket.on('leave:chat', (chatRoomId: string) => {
      socket.leave(`chat:${chatRoomId}`);
    });

    // Send message
    socket.on('message:send', async (data: { chatRoomId: string; content: string; type?: string }) => {
      if (!socket.userId) return;

      try {
const message = await Message.create({
          chatRoom: data.chatRoomId,
          sender: socket.userId,
          content: data.content,
          type: data.type || 'text',
        } as any);

        const populatedMessage = await Message.findById((message as any)._id)
          .populate('sender', 'name email avatar');

        await ChatRoom.findByIdAndUpdate(data.chatRoomId, {
          lastMessage: {
            content: data.content,
            sender: socket.userId,
            timestamp: new Date(),
          },
        });

        // Emit to all users in the chat room
        io.to(`chat:${data.chatRoomId}`).emit('message:new', populatedMessage);

        // Notify other participants
        const chatRoom = await ChatRoom.findById(data.chatRoomId);
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
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (chatRoomId: string) => {
      socket.to(`chat:${chatRoomId}`).emit('typing:start', {
        userId: socket.userId,
        chatRoomId,
      });
    });

    socket.on('typing:stop', (chatRoomId: string) => {
      socket.to(`chat:${chatRoomId}`).emit('typing:stop', {
        userId: socket.userId,
        chatRoomId,
      });
    });

    // Mark messages as read
    socket.on('message:read', async (chatRoomId: string) => {
      try {
        await Message.updateMany(
          { chatRoom: chatRoomId, sender: { $ne: socket.userId }, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        io.to(`chat:${chatRoomId}`).emit('messages:read', {
          chatRoomId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Join event room for notifications
    socket.on('join:event', (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    socket.on('leave:event', (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId || 'anonymous'}`);
    });
  });
};

// Helper functions for emitting events
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToEvent = (eventId: string, event: string, data: any) => {
  if (io) {
    io.to(`event:${eventId}`).emit(event, data);
  }
};

export const emitToChatRoom = (chatRoomId: string, event: string, data: any) => {
  if (io) {
    io.to(`chat:${chatRoomId}`).emit(event, data);
  }
};

export const emitToAll = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};

// Re-export sendNotification for route controllers
export { sendNotification };

export { io };
