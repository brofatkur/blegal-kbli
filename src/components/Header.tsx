import { useEffect, useState } from 'react';
import './Header.css';

interface HeaderProps {
  onOpenSettings: () => void;
  onToggleAi: () => void;
  aiOnline: boolean;
}

type ThemeMode = 'light' | 'dark' | 'auto';

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem('kbli-theme') as ThemeMode | null;
  return saved || 'auto';
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'auto') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', mode);
  }
}

export function Header({ onOpenSettings, onToggleAi, aiOnline }: HeaderProps) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('kbli-theme', theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const cycleTheme = () => {
    setTheme((t) => (t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto'));
  };

  const themeIcon =
    theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🌗';

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-inner">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-logo">
            <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#3e2723" />
                  <stop offset="100%" stopColor="#2d1a17" />
                </linearGradient>
                <linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#d4af37" />
                  <stop offset="100%" stopColor="#b8893a" />
                </linearGradient>
              </defs>
              <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#lg)" stroke="url(#lg2)" strokeWidth="1.2" />
              <path
                d="M11 23V9h5.2c2.7 0 4.4 1.4 4.4 3.6 0 1.6-.9 2.7-2.4 3.1 1.8.3 2.9 1.5 2.9 3.4 0 2.4-1.7 3.9-4.6 3.9H11zm2.7-8.1h2.1c1.2 0 1.9-.6 1.9-1.5 0-.9-.7-1.5-1.9-1.5h-2.1v3zm0 5.8h2.3c1.3 0 2.1-.6 2.1-1.7 0-1-.8-1.7-2.1-1.7h-2.3v3.4z"
                fill="url(#lg2)"
              />
            </svg>
          </span>
          <span className="brand-text">
            <span className="brand-name">B<span className="gradient-text">legal</span></span>
            <span className="brand-tag">KBLI 2025 • Klasifikasi Lapangan Usaha Indonesia</span>
          </span>
        </a>

        <div className="header-actions">
          <button
            className={`ai-toggle-btn ${aiOnline ? 'active' : ''}`}
            onClick={onToggleAi}
            title={aiOnline ? 'AI Online aktif' : 'AI Offline (smart matcher)'}
          >
            <span className={`ai-dot ${aiOnline ? 'online' : 'offline'}`} />
            AI {aiOnline ? 'Online' : 'Offline'}
          </button>

          <button
            className="icon-btn"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            aria-label="Ganti tema"
          >
            <span style={{ fontSize: 18 }}>{themeIcon}</span>
          </button>

          <button
            className="icon-btn"
            onClick={onOpenSettings}
            title="Pengaturan"
            aria-label="Pengaturan"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
