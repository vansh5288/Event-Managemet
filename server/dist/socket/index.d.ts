import { Server } from 'socket.io';
declare let io: Server;
export declare const setupSocketIO: (socketIO: Server) => void;
export declare const emitToUser: (userId: string, event: string, data: any) => void;
export declare const emitToEvent: (eventId: string, event: string, data: any) => void;
export declare const emitToChatRoom: (chatRoomId: string, event: string, data: any) => void;
export declare const emitToAll: (event: string, data: any) => void;
export declare const sendNotification: (userId: string, type: string, title: string, message: string, data?: Record<string, any>) => Promise<(import("mongoose").Document<unknown, {}, import("../models/Notification").INotification> & import("../models/Notification").INotification & {
    _id: import("mongoose").Types.ObjectId;
}) | null>;
export { io };
//# sourceMappingURL=index.d.ts.map