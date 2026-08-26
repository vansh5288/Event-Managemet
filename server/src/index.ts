import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { config } from './config';
import { connectDatabase } from './config/database';
import { setupSocketIO } from './socket';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocketIO(io);

const startServer = async () => {
  await connectDatabase();

  httpServer.listen(config.port, () => {
    console.log(`
    ╔══════════════════════════════════════════════╗
    ║     🚀 Event Management API Server          ║
    ║──────────────────────────────────────────────║
    ║  Port: ${config.port.toString().padEnd(35)}║
    ║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(31)}║
    ║  CORS: ${config.corsOrigin.padEnd(34)}║
    ╚══════════════════════════════════════════════╝
    `);
  });
};

startServer().catch(console.error);

export { io };
