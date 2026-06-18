import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../services/aiService';
import { useAuth } from '../hooks/useAuth';

const BOT_WELCOME = 'আমি PSTU AI Assistant! CGPA, ক্লাস রুটিন, নোটিশ — যেকোনো প্রশ্ন করুন। I can also answer in English!';

const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-gray-400 inline-block animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

export default function AIChatWidget() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen]     = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: BOT_WELCOME }]);
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  if (!isAuthenticated) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await aiService.chat(text);
      setMessages(prev => [...prev, { role: 'ai', text: res.data?.reply || res.reply || 'দুঃখিত, উত্তর পাওয়া যায়নি।' }]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'দুঃখিত, এই মুহূর্তে সংযোগ করতে পারছি না। পরে চেষ্টা করুন।';
      setMessages(prev => [...prev, { role: 'ai', text: msg, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">PSTU AI Assistant</p>
                <p className="text-primary-200 text-xs">RAG-powered · Bengali & English</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'ai' && (
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs mr-1.5 flex-shrink-0 mt-0.5">🤖</span>
                )}
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : m.error
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs mr-1.5 flex-shrink-0">🤖</span>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex gap-2 flex-shrink-0">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="কিছু জিজ্ঞেস করুন… / Ask anything…"
              className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-400 transition"
              style={{ maxHeight: '80px' }}
              disabled={loading}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl px-3 py-2 transition flex items-center justify-center"
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-200 ${
          open
            ? 'bg-gray-700 text-white rotate-12'
            : 'bg-gradient-to-br from-primary-500 to-primary-700 text-white hover:scale-110'
        }`}
        aria-label="AI Chat"
        title="PSTU AI Assistant"
      >
        {open ? '×' : '🤖'}
      </button>
    </div>
  );
}
