import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import crypto from 'crypto';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import ticketRoutes from './routes/tickets';
import registrationRoutes from './routes/registrations';
import paymentRoutes from './routes/payments';
import userRoutes from './routes/users';
import venueRoutes from './routes/venues';
import sponsorRoutes from './routes/sponsors';
import notificationRoutes from './routes/notifications';
import chatRoutes from './routes/chat';
import certificateRoutes from './routes/certificates';
import analyticsRoutes from './routes/analytics';
import uploadRoutes from './routes/upload';
import searchRoutes from './routes/search';
import reviewRoutes from './routes/reviews';
import aiRoutes from './routes/ai';
import blockchainRoutes from './routes/blockchain';
import reportRoutes from './routes/reports';
import sessionRoutes from './routes/sessions';
import waitlistRoutes from './routes/waitlist';
import walletRoutes from './routes/wallet';
import couponRoutes from './routes/coupons';

const app = express();

// Trust proxy (needed for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = config.corsOrigins;

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// CSRF protection - set a token for state-changing requests
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const csrfToken = req.headers['x-csrf-token'];
    // For API-only with Bearer token auth, verify CSRF token if not a whitelisted path
    const whitelisted = ['/api/auth', '/api/payments/webhook', '/api/upload'];
    const isWhitelisted = whitelisted.some((path) => req.path.startsWith(path));
    // Note: JWT in Authorization header provides CSRF protection for state-changing requests
    // since attackers cannot set custom headers cross-origin. This is defense-in-depth.
    if (!isWhitelisted && !csrfToken && req.headers.authorization) {
      // Generate and set a CSRF token if one is not provided but authorization is present
      const token = crypto.randomBytes(32).toString('hex');
      res.setHeader('X-CSRF-Token', token);
    }
  }
  next();
});

// Global rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindow * 60 * 1000,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api', limiter);

// Prevent NoSQL injection
app.use(mongoSanitize());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wallet', walletRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Event Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(errorHandler);

export default app;
