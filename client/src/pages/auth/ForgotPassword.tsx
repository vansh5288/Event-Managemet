import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      toast.success('OTP sent to your email');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">E</div>
            <h1 className="text-2xl font-bold">Reset password</h1>
            <p className="text-gray-500 mt-1">Enter your email to receive an OTP</p>
          </div>
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Check your email</h3>
              <p className="text-sm text-gray-500 mb-4">We&apos;ve sent an OTP to {email}</p>
              <button onClick={() => navigate('/reset-password', { state: { email } })} className="btn-primary w-full mb-2">Enter OTP &amp; Reset</button>
              <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 text-sm">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" required />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              <div className="text-center text-sm">
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Back to login</Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}

