import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { Upload, FileText, Trash2, Search, Tag, Loader, Eye, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { docsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['general','hr_policy','it_manual','announcement','faq','procedure','payroll','leave'];

const STATUS_BADGE = {
  indexed:    { cls: 'badge-green', icon: CheckCircle, label: 'Indexed' },
  processing: { cls: 'badge-amber', icon: Clock,       label: 'Processing' },
  failed:     { cls: 'badge-rose',  icon: AlertCircle, label: 'Failed' },
};

function AnalysisModal({ doc, analysis, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h2 style={{ fontWeight: 700 }}>📄 {doc.original_filename || doc.filename}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {analysis ? (
            <>
              <div className="card">
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Summary</div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{analysis.summary || 'No summary available.'}</p>
              </div>
              {analysis.key_points?.length > 0 && (
                <div className="card">
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Points</div>
                  <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {analysis.key_points.map((pt, i) => <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{pt}</li>)}
                  </ul>
                </div>
              )}
              <div className="grid-2">
                <div className="card">
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Stats</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.85rem' }}>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Words</span><span className="font-bold">{analysis.word_count?.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Pages</span><span className="font-bold">{analysis.page_count}</span></div>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>Sentiment</span><span className={`badge ${analysis.sentiment === 'positive' ? 'badge-green' : analysis.sentiment === 'negative' ? 'badge-rose' : 'badge-brand'}`}>{analysis.sentiment}</span></div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Entities</div>
                  {Object.entries(analysis.entities || {}).filter(([,v]) => v?.length).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 6, fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}: </span>
                      {v.slice(0,3).join(', ')}
                    </div>
                  ))}
                </div>
              </div>
              {analysis.keywords?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {analysis.keywords.slice(0, 20).map((kw, i) => <span key={i} className="badge badge-brand">{kw}</span>)}
                  </div>
                </div>
              )}
            </>
          ) : <div className="flex items-center justify-center" style={{ padding: '3rem' }}><Loader size={24} className="spinner" /></div>}
        </div>
      </motion.div>
    </div>
  );
}

export default function Documents() {
  const { isAdmin } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('general');
  const [search, setSearch] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    setLoading(true);
    try { const { data } = await docsAPI.list(); setDocs(data); }
    catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'], 'image/*': ['.png','.jpg','.jpeg'] },
    maxSize: 50 * 1024 * 1024,
    onDrop: async (files) => {
      if (!files.length) return;
      setUploading(true);
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', category);
        try {
          await docsAPI.upload(fd);
          toast.success(`✅ ${file.name} uploaded & indexed`);
        } catch (err) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      setUploading(false);
      loadDocs();
    },
  });

  const handleAnalyze = async (doc) => {
    setSelectedDoc(doc); setAnalysis(null); setAnalyzing(doc.id);
    try { const { data } = await docsAPI.analyze(doc.id); setAnalysis(data); }
    catch { toast.error('Analysis failed'); setSelectedDoc(null); }
    finally { setAnalyzing(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await docsAPI.delete(id); toast.success('Document deleted'); loadDocs(); }
    catch { toast.error('Delete failed'); }
  };

  const filtered = docs.filter(d => d.filename?.toLowerCase().includes(search.toLowerCase()) || d.category?.includes(search.toLowerCase()));

  return (
    <div style={{ height: '100vh', overflow: 'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Upload, analyze and manage knowledge base documents</p>
        </div>
        <span className="badge badge-brand">{docs.filter(d => d.status === 'indexed').length} indexed</span>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Upload zone */}
        <div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={category} onChange={e => setCategory(e.target.value)} className="input" style={{ width: 'auto' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Select category before uploading</span>
          </div>
          <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}>
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center" style={{ gap: '0.75rem' }}>
                <Loader size={32} className="spinner" style={{ color: 'var(--brand-400)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Uploading & indexing document...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center" style={{ gap: '0.75rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-active)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={24} style={{ color: 'var(--brand-400)' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>PDF, DOCX, TXT, PNG/JPG (max 50MB)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search + list */}
        <div>
          <div className="input-icon-wrap" style={{ marginBottom: '1rem' }}>
            <Search size={16} className="input-icon" />
            <input className="input" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex items-center justify-center" style={{ padding: '3rem' }}><Loader size={28} className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>No documents found. Upload your first document above.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Document</th><th>Category</th><th>Size</th><th>Status</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => {
                    const sb = STATUS_BADGE[doc.status] || STATUS_BADGE.processing;
                    const Icon = sb.icon;
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <FileText size={16} style={{ color: 'var(--brand-400)', flexShrink: 0 }} />
                            <div>
                              <div className="truncate" style={{ maxWidth: 200, fontWeight: 500, fontSize: '0.85rem' }}>{doc.filename}</div>
                              {doc.chunk_count && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.chunk_count} chunks</div>}
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-cyan">{doc.category?.replace('_', ' ')}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{(doc.file_size / 1024).toFixed(1)} KB</td>
                        <td><span className={`badge ${sb.cls}`}><Icon size={9} /> {sb.label}</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{new Date(doc.upload_date).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-ghost btn-sm" onClick={() => handleAnalyze(doc)} disabled={analyzing === doc.id} title="Analyze">
                              {analyzing === doc.id ? <Loader size={14} className="spinner" /> : <Eye size={14} />}
                            </button>
                            {isAdmin && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)} title="Delete"><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedDoc && <AnalysisModal doc={selectedDoc} analysis={analysis} onClose={() => { setSelectedDoc(null); setAnalysis(null); }} />}
    </div>
  );
}
