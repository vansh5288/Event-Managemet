"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const config_1 = require("./config");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const events_1 = __importDefault(require("./routes/events"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const registrations_1 = __importDefault(require("./routes/registrations"));
const payments_1 = __importDefault(require("./routes/payments"));
const users_1 = __importDefault(require("./routes/users"));
const venues_1 = __importDefault(require("./routes/venues"));
const sponsors_1 = __importDefault(require("./routes/sponsors"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const chat_1 = __importDefault(require("./routes/chat"));
const certificates_1 = __importDefault(require("./routes/certificates"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const upload_1 = __importDefault(require("./routes/upload"));
const search_1 = __importDefault(require("./routes/search"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const ai_1 = __importDefault(require("./routes/ai"));
const blockchain_1 = __importDefault(require("./routes/blockchain"));
const app = (0, express_1.default)();
// Trust proxy (needed for rate limiting behind reverse proxy)
app.set('trust proxy', 1);
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Global rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimitWindow * 60 * 1000,
    max: config_1.config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
    },
});
app.use('/api', limiter);
// Prevent NoSQL injection
app.use((0, express_mongo_sanitize_1.default)());
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/events', events_1.default);
app.use('/api/tickets', tickets_1.default);
app.use('/api/registrations', registrations_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/users', users_1.default);
app.use('/api/venues', venues_1.default);
app.use('/api/sponsors', sponsors_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/certificates', certificates_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/search', search_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/blockchain', blockchain_1.default);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'Event Management API is running',
        timestamp: new Date().toISOString(),
    });
});
// Error handling
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map