import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader, ArrowLeft } from 'lucide-react';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');
    try {
      setLoading(true);
      await authAPI.resetPasswordRequest({ email });
      setSubmitted(true);
      toast.success('Password reset instructions sent');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-mesh" />
      <div className="auth-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">We'll send you a link to reset your password.</p>
          </div>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <Loader className="spin" size={18} /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Check your email for instructions to reset your password.
              </p>
            </div>
          )}
          <div className="auth-footer" style={{ marginTop: '2rem' }}>
            <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
