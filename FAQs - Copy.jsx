import React, { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../api/client';
import toast from 'react-hot-toast';

export default function FAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      // Assuming GET /api/v1/documents/faqs gets the faqs
      const res = await adminAPI.faqs();
      setFaqs(res.data);
    } catch (err) {
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'auto', padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <HelpCircle size={48} style={{ color: 'var(--brand-500)', margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Frequently Asked Questions</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Find quick answers to common queries</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader className="spin" size={32} /></div>
      ) : faqs.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No FAQs available at the moment.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map(faq => (
            <div key={faq.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button 
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                style={{ 
                  width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-primary)',
                  fontSize: '1.1rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left'
                }}
              >
                {faq.question}
                {openId === faq.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '0 1.5rem 1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
