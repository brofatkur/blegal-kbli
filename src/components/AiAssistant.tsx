import { useEffect, useRef, useState } from 'react';
import type { KbliItem } from '../types';
import { matchKbli, generateReply } from '../lib/ai-matcher';
import { askOnline, loadAiConfig } from '../lib/ai-online';
import { getAllData } from '../lib/search';
import './AiAssistant.css';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  matches?: KbliItem[]; // untuk quick actions di pesan assistant
}

interface AiAssistantProps {
  open: boolean;
  onClose: () => void;
  online: boolean;
  onSelectItem: (item: KbliItem) => void;
}

const SUGGESTED_PROMPTS = [
  'Saya mau buka warung kopi',
  'Bagaimana cara kulakan baju online?',
  'Jasa laundry kiloan',
  'Agen travel tiket',
  'Toko bangunan',
  'Pengembangan aplikasi mobile',
];

export function AiAssistant({
  open,
  onClose,
  online,
  onSelectItem,
}: AiAssistantProps) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Halo! 👋 Saya asisten AI untuk membantu Anda menemukan kode **KBLI 2025** yang tepat. Ceritakan rencana usaha Anda, dan saya akan carikan kode yang sesuai beserta detail skala usaha, risiko, dan perizinan.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    const userMsg: Msg = { role: 'user', content };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const data = getAllData();
      let reply: string;
      let matches: KbliItem[] = [];

      if (online) {
        const cfg = loadAiConfig();
        if (!cfg || !cfg.apiKey) {
          reply =
            '⚠️ AI Online aktif tapi API key belum diset. Buka **⚙️ Settings** untuk menambahkan API key (Gemini/OpenAI). Sementara itu, saya pakai mode offline dulu ya.\n\n' +
            generateReply(content, matchKbli(content, data, 5));
          matches = matchKbli(content, data, 5).map((m) => m.item);
        } else {
          const history = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role, content: m.content }));
          reply = await askOnline(content, history, data, cfg);
          // Tetap ambil matches untuk quick actions
          matches = matchKbli(content, data, 3).map((m) => m.item);
        }
      } else {
        // Mode offline
        const results = matchKbli(content, data, 5);
        matches = results.map((m) => m.item);
        reply = generateReply(content, results);
      }

      setMessages((m) => [
        ...m,
        { role: 'assistant', content: reply, matches },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `⚠️ Terjadi kesalahan: ${msg}\n\nCoba lagi, atau periksa API key di **⚙️ Settings**. Sementara mode offline tetap bisa dipakai.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  if (!open) return null;

  return (
    <div className="ai-panel scale-in">
      <div className="ai-header">
        <div className="ai-title">
          <span className="ai-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="aigrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                fill="url(#aigrad)"
              />
              <circle cx="18" cy="6" r="1.5" fill="#fbbf24" />
              <circle cx="6" cy="18" r="1" fill="#fbbf24" />
            </svg>
          </span>
          <div>
            <div className="ai-name">Asisten KBLI AI</div>
            <div className="ai-status">
              <span className={`status-dot ${online ? 'online' : 'offline'}`} />
              {online ? 'AI Online • Powered by LLM' : 'Mode Offline • Smart Matcher'}
            </div>
          </div>
        </div>
        <button className="ai-close" onClick={onClose} aria-label="Tutup AI">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="ai-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            msg={m}
            onSelectItem={onSelectItem}
          />
        ))}
        {sending && (
          <div className="msg assistant">
            <div className="typing">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="ai-suggestions">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              className="suggestion-chip"
              onClick={() => void send(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="ai-input-wrap">
        <textarea
          ref={inputRef}
          className="ai-input"
          placeholder="Ceritakan usaha Anda… (mis. 'saya mau buka cafe')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={sending}
        />
        <button
          className="ai-send"
          onClick={() => void send()}
          disabled={!input.trim() || sending}
          aria-label="Kirim"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  onSelectItem,
}: {
  msg: Msg;
  onSelectItem: (item: KbliItem) => void;
}) {
  const isUser = msg.role === 'user';
  return (
    <div className={`msg ${msg.role}`}>
      {!isUser && (
        <div className="msg-avatar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
      <div className="msg-content">
        <MarkdownLite text={msg.content} />
        {msg.matches && msg.matches.length > 0 && (
          <div className="msg-quick-actions">
            {msg.matches.map((it) => (
              <button
                key={it.kode}
                className="quick-item"
                onClick={() => onSelectItem(it)}
              >
                <span className="quick-kode">{it.kode}</span>
                <span className="quick-judul">{it.judul}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Markdown super-ringan: **bold**, _italic_, • bullet, \n line break
function MarkdownLite({ text }: { text: string }) {
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
  // wrap consecutive <li> jadi <ul>
  const wrapped = html.replace(
    /(<li>.*?<\/li>(<br\/>)?)+/g,
    (m) => `<ul>${m.replace(/<br\/>/g, '')}</ul>`,
  );
  return <div dangerouslySetInnerHTML={{ __html: wrapped }} />;
}
