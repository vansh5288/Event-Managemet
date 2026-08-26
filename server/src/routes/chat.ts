import { Router, Response, NextFunction } from 'express';
import { ChatRoom, ChatRoomType } from '../models/ChatRoom';
import { Message } from '../models/Message';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user's chat rooms
router.get('/rooms', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const chatRooms = await ChatRoom.find({
      participants: req.userId,
      isActive: true,
    })
      .populate('participants', 'name email avatar')
      .populate('event', 'title')
      .populate('lastMessage.sender', 'name')
      .sort('-updatedAt');

    res.json({ success: true, data: chatRooms });
  } catch (error) {
    next(error);
  }
});

// Get or create direct chat room
router.post('/direct', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { participantId } = req.body;
    if (!participantId) {
      return res.status(400).json({ success: false, message: 'Participant ID is required' });
    }

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({
      type: ChatRoomType.DIRECT,
      participants: { $all: [req.userId, participantId], $size: 2 },
    }).populate('participants', 'name email avatar');

    if (!chatRoom) {
chatRoom = await ChatRoom.create({
        type: ChatRoomType.DIRECT,
        participants: [req.userId, participantId],
      } as any);
      chatRoom = await ChatRoom.findById((chatRoom as any)._id).populate('participants', 'name email avatar');
    }

    res.json({ success: true, data: chatRoom });
  } catch (error) {
    next(error);
  }
});

// Get event chat room
router.get('/event/:eventId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let chatRoom = await ChatRoom.findOne({
      type: ChatRoomType.EVENT,
      event: req.params.eventId,
    }).populate('participants', 'name email avatar');

    if (!chatRoom) {
chatRoom = await ChatRoom.create({
        type: ChatRoomType.EVENT,
        event: req.params.eventId,
        name: 'Event Chat',
        participants: [req.userId],
      } as any);
      chatRoom = await ChatRoom.findById((chatRoom as any)._id).populate('participants', 'name email avatar');
    }

    res.json({ success: true, data: chatRoom });
  } catch (error) {
    next(error);
  }
});

// Get messages for a chat room
router.get('/:chatRoomId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
      Message.find({ chatRoom: req.params.chatRoomId })
        .populate('sender', 'name email avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum),
      Message.countDocuments({ chatRoom: req.params.chatRoomId }),
    ]);

    // Mark messages as read
    await Message.updateMany(
      {
        chatRoom: req.params.chatRoomId,
        sender: { $ne: req.userId },
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );

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
  } catch (error) {
    next(error);
  }
});

// Send a message
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatRoomId, content, type } = req.body;

const message = await Message.create({
      chatRoom: chatRoomId,
      sender: req.userId,
      content,
      type: type || 'text',
    } as any);

    const populatedMessage = await Message.findById((message as any)._id).populate('sender', 'name email avatar');

    // Update chat room's last message
    await ChatRoom.findByIdAndUpdate(chatRoomId, {
      lastMessage: {
        content,
        sender: req.userId,
        timestamp: new Date(),
      },
    });

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
});

export default router;
