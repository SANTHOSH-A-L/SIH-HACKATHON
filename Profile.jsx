import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Building, Shield, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../api/client';

export default function Profile() {
  const { user, logout } = useAuth();

  const handlePasswordReset = async () => {
    try {
      await authAPI.resetPasswordRequest({ email: user.email });
      toast.success('Password reset link sent to your email');
    } catch (err) {
      toast.error('Failed to request password reset');
    }
  };

  if (!user) return null;

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Manage your account settings</p>
        </div>
      </div>
      <div className="page-body">
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ 
              width: 80, height: 80, borderRadius: '50%', background: 'var(--brand-500)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 700, color: '#fff'
            }}>
              {user.full_name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{user.full_name}</h2>
              <span className="badge badge-indigo" style={{ marginTop: 8, display: 'inline-block' }}>{user.role}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="flex items-center gap-4">
              <Mail className="text-muted" size={20} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</div>
                <div style={{ fontWeight: 500 }}>{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Building className="text-muted" size={20} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Department</div>
                <div style={{ fontWeight: 500 }}>{user.department || 'N/A'}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Shield className="text-muted" size={20} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Employee ID</div>
                <div style={{ fontWeight: 500 }}>{user.employee_id || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
            <button className="btn-secondary" onClick={handlePasswordReset} style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 8 }}>
              <Key size={18} /> Change Password
            </button>
            <button className="btn-primary" onClick={logout} style={{ flex: 1, background: 'var(--neon-rose)', border: 'none' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
