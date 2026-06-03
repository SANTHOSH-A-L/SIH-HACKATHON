import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Building, IdCard, Bot, Loader } from 'lucide-react';
import { authAPI } from '../api/client';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ email:'', password:'', full_name:'', department:'', employee_id:'' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authAPI.register(form);
      toast.success('Registered! Check your email for OTP.');
      navigate(`/verify-otp?email=${form.email}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', top: '-15%', right: '-10%' }} />
      </div>
      <motion.div className="auth-box" style={{ maxWidth: 480 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col items-center" style={{ marginBottom: '1.75rem', gap: '0.75rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={26} color="white" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }} className="gradient-text">Create Account</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Join IntelliAssist AI Platform</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div className="input-icon-wrap"><User size={16} className="input-icon" />
              <input className="input" placeholder="Rajesh Kumar" required value={form.full_name} onChange={set('full_name')} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Work Email</label>
            <div className="input-icon-wrap"><Mail size={16} className="input-icon" />
              <input className="input" type="email" placeholder="you@organization.gov.in" required value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Department</label>
              <div className="input-icon-wrap"><Building size={14} className="input-icon" />
                <input className="input" placeholder="HR / IT / Finance" value={form.department} onChange={set('department')} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Employee ID</label>
              <div className="input-icon-wrap"><IdCard size={14} className="input-icon" />
                <input className="input" placeholder="EMP-001" value={form.employee_id} onChange={set('employee_id')} />
              </div>
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon-wrap"><Lock size={16} className="input-icon" />
              <input className="input" type="password" placeholder="Min 8 characters" required value={form.password} onChange={set('password')} />
            </div>
          </div>
          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {loading ? <><Loader size={16} className="spinner" /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--brand-400)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
