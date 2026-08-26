import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/auth-context';

const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const VerifyOtp = lazy(() => import('./pages/auth/VerifyOtp'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/DashboardHome'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const EventForm = lazy(() => import('./pages/EventForm'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Attendees = lazy(() => import('./pages/Attendees'));
const Registrations = lazy(() => import('./pages/Registrations'));
const Tickets = lazy(() => import('./pages/Tickets'));
const Venues = lazy(() => import('./pages/Venues'));
const Payments = lazy(() => import('./pages/Payments'));
const Sponsors = lazy(() => import('./pages/Sponsors'));
const Volunteers = lazy(() => import('./pages/Volunteers'));
const Certificates = lazy(() => import('./pages/Certificates'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Chat = lazy(() => import('./pages/Chat'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const WalletPage = lazy(() => import('./pages/Wallet'));
const Coupons = lazy(() => import('./pages/Coupons'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
    <div className="text-center">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
        E
      </div>
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/verify-otp" element={<PublicRoute><VerifyOtp /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="events" element={<Events />} />
          <Route path="events/create" element={<EventForm />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="events/:id/edit" element={<EventForm />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="attendees" element={<Attendees />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="venues" element={<Venues />} />
          <Route path="payments" element={<Payments />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="sponsors" element={<Sponsors />} />
          <Route path="volunteers" element={<Volunteers />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="chat" element={<Chat />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
              },
              success: {
                style: {
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  color: 'white',
                },
              },
              error: {
                style: {
                  background: 'linear-gradient(135deg, #ef4444, #f97316)',
                  color: 'white',
                },
              },
            }}
          />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

