# EventHub - Setup Guide

## Prerequisites

### Required Installations

1. **Node.js** (v18+)
2. **MongoDB** - Local or Atlas
3. **Git** - Optional

---

## Step 1: Configure Environment

### Server (`server/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

# Optional - Add these when you have accounts:
# STRIPE_SECRET_KEY=sk_test_...
# RAZORPAY_KEY_ID=rzp_test_...
# RAZORPAY_KEY_SECRET=...
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
# SMTP_HOST=smtp.gmail.com
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# GOOGLE_AI_API_KEY=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GITHUB_CLIENT_ID=...
# GITHUB_CLIENT_SECRET=...
```

Copy from `server/.env.example`.

### Client (`client/.env`)

```env
VITE_API_BASE_URL=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_RAZORPAY_KEY_ID=
VITE_GOOGLE_CLIENT_ID=
VITE_GITHUB_CLIENT_ID=
```

Copy from `client/.env.example`.

---

## Step 2: Start the Application

### Terminal 1: Start Server (Backend)
```powershell
cd server
npm install
npm run dev
```

Server starts at: http://localhost:5000
Health check: http://localhost:5000/api/health

### Terminal 2: Start Client (Frontend)
```powershell
cd client
npm install
npm run dev
```

Client starts at: http://localhost:5173

---

## Step 3: Test the Application

1. Open **http://localhost:5173**
2. Click **Sign up** to create a new account
3. Check your email for the OTP and verify
4. Login with your credentials
5. Explore the dashboard with 16+ KPIs and interactive charts
6. Navigate through all pages via the sidebar
7. Create an event, add tickets, manage registrations

---

## Docker Deployment

```powershell
docker-compose up --build
```

This starts MongoDB, the API, and the Nginx-served client.

---

## Troubleshooting

### MongoDB not connecting
```powershell
Get-Service MongoDB   # Check if running
Start-Service MongoDB # Start it
```

### Port already in use
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Client can't reach server
The client uses a Vite proxy configured in `client/vite.config.ts`. It proxies `/api` requests to `http://localhost:5000`. Make sure the server is running first.

---

## Architecture

```
Client (React + Vite - Port 5173)  ←→  Server (Express - Port 5000)  ←→  MongoDB (Port 27017)
         ↓                                      ↓
    Browser UI                          REST APIs + Socket.IO
```

