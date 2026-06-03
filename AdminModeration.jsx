import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, Loader } from 'lucide-react';
import { adminAPI } from '../api/client';
import toast from 'react-hot-toast';

export default function AdminModeration() {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlagged();
  }, []);

  const fetchFlagged = async () => {
    try {
      const res = await adminAPI.flaggedChats();
      setFlagged(res.data);
    } catch (err) {
      toast.error('Failed to load flagged chats');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await adminAPI.resolveFlaggedChat(id);
      toast.success('Conversation resolved');
      fetchFlagged();
    } catch (err) {
      toast.error('Failed to resolve');
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Moderation</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Review flagged and toxic conversations</p>
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="flex items-center justify-center p-8"><Loader className="spin" /></div>
        ) : flagged.length === 0 ? (
          <div className="card text-center p-8">
            <Shield size={48} style={{ color: 'var(--brand-400)', margin: '0 auto 1rem' }} />
            <h3>All clear!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>No flagged conversations pending review.</p>
          </div>
        ) : (
          <div className="grid-2">
            {flagged.map(chat => (
              <div key={chat.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 style={{ fontWeight: 600 }}>Session: {chat.session_id.split('-')[0]}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      User ID: {chat.user_id.substring(0, 8)}... | {new Date(chat.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="badge badge-rose"><AlertTriangle size={12} /> High Risk</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 8, fontSize: '0.875rem' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Query:</strong> {chat.query}<br/>
                  <strong style={{ color: 'var(--text-primary)', marginTop: 8, display: 'inline-block' }}>Response:</strong> {chat.response}
                </div>
                <div className="flex justify-end mt-auto pt-4">
                  <button className="btn-primary" onClick={() => handleResolve(chat.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    <CheckCircle size={16} /> Mark Resolved
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
