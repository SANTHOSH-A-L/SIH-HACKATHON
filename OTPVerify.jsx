import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Loader, RefreshCw, Mail } from 'lucide-react';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';

export default function OTPVerify() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const refs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }
  }, [countdown]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[i] = val; setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').split('').slice(0, 6);
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    refs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await authAPI.verifyOTP({ email, otp: code });
      toast.success('Email verified! You can now login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authAPI.resendOTP({ email });
      toast.success('OTP resent!');
      setCountdown(60);
    } catch { toast.error('Failed to resend OTP'); }
    finally { setResending(false); }
  };

  return (
    <div className="auth-page">
      <motion.div className="auth-box" style={{ maxWidth: 420, textAlign: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }} className="animate-pulse-glow">
          <Mail size={30} color="white" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }} className="gradient-text">Verify Your Email</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 8 }}>
          We've sent a 6-digit OTP to
        </p>
        <p style={{ color: 'var(--brand-400)', fontWeight: 600, marginBottom: '2rem', fontSize: '0.9rem' }}>{email}</p>

        <form onSubmit={handleSubmit}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input key={i} ref={el => refs.current[i] = el} className="otp-input" maxLength={1}
                value={d} onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)} inputMode="numeric" />
            ))}
          </div>

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: '1.75rem', justifyContent: 'center' }}>
            {loading ? <><Loader size={16} className="spinner" /> Verifying...</> : 'Verify OTP'}
          </button>
        </form>

        <button className="btn btn-ghost" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
          onClick={resend} disabled={countdown > 0 || resending}>
          {resending ? <><Loader size={14} className="spinner" /> Resending...</>
            : countdown > 0 ? `Resend in ${countdown}s`
            : <><RefreshCw size={14} /> Resend OTP</>}
        </button>
      </motion.div>
    </div>
  );
}
