"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const database_1 = require("./config/database");
const socket_1 = require("./socket");
const httpServer = (0, http_1.createServer)(app_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: config_1.config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
exports.io = io;
(0, socket_1.setupSocketIO)(io);
const startServer = async () => {
    await (0, database_1.connectDatabase)();
    httpServer.listen(config_1.config.port, () => {
        console.log(`
    ╔══════════════════════════════════════════════╗
    ║     🚀 Event Management API Server          ║
    ║──────────────────────────────────────────────║
    ║  Port: ${config_1.config.port.toString().padEnd(35)}║
    ║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(31)}║
    ║  CORS: ${config_1.config.corsOrigin.padEnd(34)}║
    ╚══════════════════════════════════════════════╝
    `);
    });
};
startServer().catch(console.error);
//# sourceMappingURL=index.js.map