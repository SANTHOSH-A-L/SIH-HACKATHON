import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Star, AlertTriangle, Activity, Users, MessageSquare, FileText, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { adminAPI } from '../api/client';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1','#8b5cf6','#22d3ee','#4ade80','#fbbf24','#fb7185'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:10, padding:'0.75rem 1rem', fontSize:'0.8rem' }}>
      <p style={{ color:'var(--text-secondary)', marginBottom:4 }}>{label}</p>
      {payload.map((p,i) => <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div className="stat-card" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
      <div className="stat-icon" style={{ background:`${color}18`, border:`1px solid ${color}30` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <div className="stat-value gradient-text">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.analytics(), adminAPI.health()])
      .then(([a, h]) => { setData(a.data); setHealth(h.data); })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center" style={{ height:'100%' }}><div className="spinner" style={{ width:40, height:40, border:'3px solid var(--border-subtle)', borderTop:'3px solid var(--brand-500)', borderRadius:'50%' }} /></div>;

  return (
    <div style={{ height:'100vh', overflow:'auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>Real-time platform insights</p>
        </div>
        {health && <span className={`badge ${health.status==='operational'?'badge-green':'badge-rose'}`}><Activity size={9} /> {health.status}</span>}
      </div>
      <div className="page-body" style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
        <div className="grid-4">
          <StatCard icon={Users}         label="Total Users"        value={data?.total_users||0}        color="#6366f1" />
          <StatCard icon={MessageSquare} label="Conversations"       value={data?.total_conversations||0} color="#8b5cf6" />
          <StatCard icon={FileText}      label="Documents Indexed"   value={data?.total_documents||0}    color="#22d3ee" />
          <StatCard icon={Clock}         label="Avg Response"        value={`${data?.avg_response_time_ms||0}ms`} color="#4ade80" />
        </div>
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={18} style={{ color:'var(--brand-400)' }} /> Daily Queries (7 days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.daily_queries||[]}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="date" tick={{ fill:'var(--text-muted)', fontSize:11 }} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="queries" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:'1rem', display:'flex', alignItems:'center', gap:8 }}>
              <BarChart2 size={18} style={{ color:'var(--accent-400)' }} /> Top Intents
            </h3>
            {data?.top_intents?.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.top_intents} dataKey="count" nameKey="intent" cx="50%" cy="50%" outerRadius={70}>
                    {data.top_intents.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p style={{ color:'var(--text-muted)', textAlign:'center', padding:'3rem 0' }}>No data yet</p>}
          </div>
        </div>
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:'1rem' }}>⚙️ System Health</h3>
            {health && Object.entries({ Database:health.database, 'Vector Store':health.vector_store, 'AI Service':health.ai_service }).map(([k,v]) => (
              <div key={k} className="flex justify-between items-center" style={{ padding:'0.5rem 0', borderBottom:'1px solid var(--border-subtle)', fontSize:'0.875rem' }}>
                <span style={{ color:'var(--text-secondary)' }}>{k}</span>
                <span className={`badge ${v==='healthy'?'badge-green':v==='fallback_mode'?'badge-amber':'badge-rose'}`}>{v}</span>
              </div>
            ))}
          </div>
          <div className="card flex flex-col items-center justify-center" style={{ gap:'1rem' }}>
            <Star size={36} style={{ color:'var(--neon-amber)' }} />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'3rem', fontWeight:800 }} className="gradient-text">{data?.user_satisfaction?.toFixed(1)||'—'}</div>
              <div style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Avg Rating / 5</div>
            </div>
            <span className="badge badge-rose"><AlertTriangle size={9} /> {data?.flagged_conversations||0} Flagged Chats</span>
          </div>
        </div>
      </div>
    </div>
  );
}
