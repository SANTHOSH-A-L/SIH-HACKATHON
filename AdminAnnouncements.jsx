import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Calendar, Loader } from 'lucide-react';
import { adminAPI } from '../api/client';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await adminAPI.announcements();
      setAnnouncements(res.data);
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !content) return toast.error('All fields required');
    try {
      await adminAPI.createAnnouncement({ title, content, is_active: true });
      toast.success('Announcement created');
      setTitle('');
      setContent('');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteAnnouncement(id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Broadcast messages to all employees</p>
        </div>
      </div>
      <div className="page-body">
        <div className="grid-2">
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={18} /> New Broadcast</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Annual Townhall 2026"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Content</label>
                <textarea 
                  className="input-field" 
                  rows={4} 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Message body..."
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Broadcast Now</button>
            </form>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {loading ? <div className="p-8 text-center"><Loader className="spin" /></div> : announcements.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="flex justify-between items-start">
                  <h4 style={{ fontWeight: 600 }}>{a.title}</h4>
                  <button onClick={() => handleDelete(a.id)} className="btn-icon" style={{ color: 'var(--neon-rose)' }}><Trash2 size={16} /></button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{a.content}</p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                  <Calendar size={12} /> {new Date(a.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
