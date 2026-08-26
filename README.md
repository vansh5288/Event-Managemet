# 🎉 EventHub - Event Management Platform

A production-ready, full-stack Event Management Platform with AI-powered insights, blockchain-verified ticketing, real-time chat, and comprehensive analytics.

![Stack](https://img.shields.io/badge/Stack-MERN-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6) ![React](https://img.shields.io/badge/React-19-61DAFB)

## ✨ Features

### Core Platform
- **Event Management** - Create, edit, delete, publish, duplicate, and clone events
- **Ticket System** - Free/paid/VIP/student/early-bird tickets with coupons and discounts
- **Registration Flow** - Book tickets, waitlist, QR check-in, attendance tracking
- **Payments** - Stripe + Razorpay integration with invoices, refunds, and transaction history
- **Venues** - Manage venues with capacity, amenities, and Google Maps locations
- **Sponsors & Volunteers** - Full CRUD management
- **Certificates** - Automatic generation with QR verification and PDF download
- **Real-time Chat** - Socket.IO with typing indicators, read receipts, and online status
- **Notifications** - In-app, email, and push notification support

### 🤖 AI Features
- Event recommendations (collaborative + content-based filtering)
- Speaker recommendations
- Attendee matchmaking / networking suggestions
- AI Chatbot assistant
- AI Email generator for announcements
- Sentiment analysis on reviews/feedback
- Event summary generation
- Spam detection
- Duplicate event detection

### ⛓️ Blockchain Features
- NFT ticket minting
- Certificate verification on-chain
- Reward distribution
- Proof of attendance
- Wallet integration (MetaMask-ready)

### 📊 Analytics
- Revenue trends
- Registration trends
- Event growth
- Category distribution
- Attendance analytics
- Top-performing events
- Interactive charts (Recharts)

### 🔐 Security
- JWT authentication with refresh tokens
- Role-based access control (Admin, Organizer, Volunteer, Participant, Sponsor, Judge, Speaker)
- Helmet security headers
- Rate limiting
- NoSQL injection protection
- Input validation & sanitization
- CORS protection
- Password hashing (bcrypt)

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────┐
│   React Client  │  REST   │  Express API    │  ODBC   │   MongoDB   │
│   (Vite + TS)   │◄───────►│  (TypeScript)   │◄──────►│             │
│   Tailwind UI   │  Socket │  Socket.IO      │         └─────────────┘
└─────────────────┘  .IO    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Configure environment
```bash
# Server
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Client
cd client
cp .env.example .env
```

### 2. Start the server
```bash
cd server
npm install
npm run dev
```

### 3. Start the client
```bash
cd client
npm install
npm run dev
```

### 4. Open the app
Visit http://localhost:5173

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

This starts MongoDB, the API server, and the Nginx-served client.

## 📁 Project Structure

```
├── client/                    # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── lib/               # API client, types, auth context
│   │   └── pages/             # Route pages
│   ├── Dockerfile
│   └── nginx.conf
├── server/                    # Express + TypeScript backend
│   ├── src/
│   │   ├── ai/                # AI services
│   │   ├── blockchain/        # Blockchain integration
│   │   ├── config/            # Environment config
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/            # MongoDB models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic services
│   │   ├── socket/            # Socket.IO setup
│   │   └── utils/             # Helpers, tokens, logger
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── smartContract.sol          # Blockchain smart contract
```

## 🧪 Testing

```bash
# Server
cd server && npm run build

# Client
cd client && npm run build && npm run lint
```

## 🔑 Environment Variables

See `server/.env.example` and `client/.env.example` for the full list of configuration options.

## 📄 License

MIT

