import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import {
  Send, Mic, MicOff, Bot, User, Plus, Trash2, MessageSquare,
  ThumbsUp, ThumbsDown, Ticket, Sparkles, ChevronDown, ExternalLink, Volume2
} from 'lucide-react';
import { chatAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const QUICK_PROMPTS = [
  '📋 How many casual leaves do I get per year?',
  '🔑 How to reset my office VPN password?',
  '💰 When is my salary credited each month?',
  '🏥 What is the medical reimbursement policy?',
  '📅 What are upcoming company events?',
  '📝 How to apply for work from home?',
];

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fadeIn" style={{ alignItems: 'flex-start' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bot size={16} color="white" />
      </div>
      <div className="chat-bubble-ai">
        <div className="typing-dots"><span /><span /><span /></div>
      </div>
    </div>
  );
}

function Message({ msg, onFeedback }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(msg.content.replace(/[#*`]/g, ''));
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
      style={{ alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}
    >
      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--bg-hover)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: isUser ? '1px solid var(--border-subtle)' : 'none'
      }}>
        {isUser ? <User size={15} color="var(--text-secondary)" /> : <Bot size={15} color="white" />}
      </div>

      <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
          {isUser ? <p style={{ margin: 0 }}>{msg.content}</p>
            : <ReactMarkdown components={{
                p: ({ children }) => <p style={{ margin: '0 0 0.5rem' }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: '1.25rem', margin: '0.5rem 0' }}>{children}</ul>,
                li: ({ children }) => <li style={{ marginBottom: '0.25rem' }}>{children}</li>,
                code: ({ children }) => <code style={{ background: 'rgba(99,102,241,0.15)', padding: '0.1rem 0.4rem', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>{children}</code>,
                strong: ({ children }) => <strong style={{ color: 'var(--brand-400)' }}>{children}</strong>,
              }}>{msg.content}</ReactMarkdown>
          }
        </div>

        {/* Sources */}
        {msg.sources?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {msg.sources.map((s, i) => (
              <span key={i} className="badge badge-brand" style={{ fontSize: '0.65rem' }}>
                <ExternalLink size={9} /> {s.source}
              </span>
            ))}
          </div>
        )}

        {/* AI message actions */}
        {!isUser && (
          <div className="flex gap-1" style={{ opacity: 0.6 }}>
            <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={speak}><Volume2 size={12} /></button>
            <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={copy}>{copied ? '✓' : '⎘'}</button>
            <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => onFeedback?.(5)}><ThumbsUp size={12} /></button>
            <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => onFeedback?.(1)}><ThumbsDown size={12} /></button>
          </div>
        )}

        {/* Suggested queries */}
        {!isUser && msg.suggested_queries?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
            {msg.suggested_queries.slice(0, 2).map((q, i) => (
              <button key={i} onClick={() => msg.onSuggest?.(q)}
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 99, padding: '0.25rem 0.75rem', fontSize: '0.72rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                {q}
              </button>
            ))}
          </div>
        )}

        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          {msg.response_time_ms ? `  ·  ${msg.response_time_ms}ms` : ''}
        </span>
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const loadSessions = async () => {
    try {
      const { data } = await chatAPI.getSessions();
      setSessions(data);
    } catch {}
  };

  const loadMessages = async (sessionId) => {
    try {
      const { data } = await chatAPI.getMessages(sessionId);
      setMessages(data);
      setActiveSession(sessionId);
    } catch { toast.error('Failed to load conversation'); }
  };

  const newChat = () => { setActiveSession(null); setMessages([]); inputRef.current?.focus(); };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await chatAPI.deleteSession(id);
      setSessions(s => s.filter(x => x.id !== id));
      if (activeSession === id) newChat();
      toast.success('Conversation deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await chatAPI.sendMessage({ message: msg, session_id: activeSession, language: 'en', include_sources: true });
      if (!activeSession) { setActiveSession(data.session_id); loadSessions(); }
      const aiMsg = { ...data, id: Date.now() + 1, role: 'assistant', content: data.response,
        timestamp: new Date().toISOString(), onSuggest: (q) => sendMessage(q) };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = { id: Date.now() + 1, role: 'assistant', content: '❌ Sorry, I encountered an error. Please try again or contact support.', timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally { setLoading(false); }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) { toast.error('Voice input not supported in this browser'); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new window.webkitSpeechRecognition();
    rec.continuous = false; rec.lang = 'en-IN'; rec.interimResults = false;
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => { setListening(false); toast.error('Voice recognition error'); };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start(); setListening(true);
  };

  const handleFeedback = async (sessionId, rating) => {
    try { await chatAPI.submitFeedback({ session_id: sessionId || activeSession, rating }); toast.success('Feedback submitted!'); }
    catch {}
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Chat history sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} onClick={newChat}>
                <Plus size={16} /> New Chat
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {sessions.length === 0
                ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem 1rem' }}>No conversations yet</p>
                : sessions.map(s => (
                  <div key={s.id} onClick={() => loadMessages(s.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer', marginBottom: 2, background: activeSession === s.id ? 'rgba(99,102,241,0.12)' : 'transparent', border: activeSession === s.id ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="truncate" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{s.title}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(s.updated_at).toLocaleDateString()}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '0.2rem', opacity: 0.5 }} onClick={(e) => deleteSession(s.id, e)}><Trash2 size={12} /></button>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowSidebar(!showSidebar)}><MessageSquare size={16} /></button>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>IntelliAssist AI</span>
            <span className="badge badge-brand"><Sparkles size={9} /> RAG Powered</span>
          </div>
          <div className="flex items-center gap-2">
            {activeSession && (
              <button className="btn btn-outline btn-sm" onClick={() => { const t = {title:'IT Support Request',description:'Auto-generated from chat',category:'IT',priority:'medium'}; chatAPI.createTicket(t).then(() => toast.success('Ticket #created!')).catch(() => {}); }}>
                <Ticket size={14} /> Raise Ticket
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }} className="animate-pulse-glow">
                  <Bot size={36} color="white" />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Hello, {user?.full_name?.split(' ')[0]} 👋</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 360 }}>I'm your AI-powered enterprise assistant. Ask me anything about HR policies, IT support, payroll, or company procedures.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.75rem', width: '100%', maxWidth: 600 }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.8rem', transition: 'var(--transition)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <Message key={msg.id} msg={msg} onFeedback={(r) => handleFeedback(activeSession, r)} />
              ))}
              {loading && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '0.5rem 0.5rem 0.5rem 1rem', transition: 'var(--transition)' }}
            onFocus={() => {}} >
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about HR policies, IT support, payroll, leaves..."
              rows={1} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', paddingTop: '0.35rem', lineHeight: 1.5 }} />
            <div className="flex gap-1" style={{ alignItems: 'flex-end' }}>
              <button className={`btn btn-sm ${listening ? 'btn-danger' : 'btn-ghost'}`} style={{ borderRadius: 10 }} onClick={toggleVoice}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button className="btn btn-primary btn-sm" style={{ borderRadius: 10, padding: '0.5rem 0.9rem' }}
                onClick={() => sendMessage()} disabled={!input.trim() || loading}>
                <Send size={15} />
              </button>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            IntelliAssist AI may produce inaccurate information. Verify important policy details with HR/IT.
          </p>
        </div>
      </div>
    </div>
  );
}
