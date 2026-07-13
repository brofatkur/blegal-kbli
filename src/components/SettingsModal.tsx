import { useEffect, useState } from 'react';
import {
  loadAiConfig,
  saveAiConfig,
  clearAiConfig,
  type AiConfig,
  type AiProvider,
} from '../lib/ai-online';
import './SettingsModal.css';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  online: boolean;
  onToggleOnline: (v: boolean) => void;
}

export function SettingsModal({
  open,
  onClose,
  online,
  onToggleOnline,
}: SettingsModalProps) {
  const [config, setConfig] = useState<AiConfig | null>(loadAiConfig);
  const [provider, setProvider] = useState<AiProvider>(
    config?.provider || 'gemini',
  );
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [model, setModel] = useState(config?.model || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    if (!apiKey.trim()) return;
    const cfg: AiConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
    };
    saveAiConfig(cfg);
    setConfig(cfg);
    setSaved(true);
    onToggleOnline(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    clearAiConfig();
    setConfig(null);
    setApiKey('');
    setModel('');
    onToggleOnline(false);
  };

  const defaultModel = provider === 'gemini' ? 'gemini-2.0-flash' : 'gpt-4o-mini';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal settings-modal scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal-close" onClick={onClose} aria-label="Tutup">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="modal-judul">⚙️ Pengaturan</h2>
        <p className="settings-subtitle">
          Konfigurasi AI Assistant untuk chat yang lebih cerdas dan kontekstual.
        </p>

        <section className="modal-section">
          <h4>Mode AI</h4>
          <div className="mode-toggle">
            <button
              className={`mode-btn ${!online ? 'active' : ''}`}
              onClick={() => onToggleOnline(false)}
            >
              <span className="mode-icon">🧠</span>
              <div>
                <div className="mode-name">Offline (Smart Matcher)</div>
                <div className="mode-desc">
                  Pakai NLP lokal. Gratis, cepat, tanpa API key.
                </div>
              </div>
            </button>
            <button
              className={`mode-btn ${online ? 'active' : ''}`}
              onClick={() => onToggleOnline(true)}
            >
              <span className="mode-icon">🚀</span>
              <div>
                <div className="mode-name">Online (LLM)</div>
                <div className="mode-desc">
                  Pakai Gemini/OpenAI. Jawaban lebih kaya & kontekstual.
                </div>
              </div>
            </button>
          </div>
        </section>

        {online && (
          <section className="modal-section fade-in">
            <h4>Konfigurasi API</h4>

            <div className="form-group">
              <label>Provider</label>
              <div className="provider-tabs">
                <button
                  className={`provider-tab ${provider === 'gemini' ? 'active' : ''}`}
                  onClick={() => setProvider('gemini')}
                >
                  Google Gemini
                </button>
                <button
                  className={`provider-tab ${provider === 'openai' ? 'active' : ''}`}
                  onClick={() => setProvider('openai')}
                >
                  OpenAI
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>API Key</label>
              <div className="input-with-action">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    provider === 'gemini'
                      ? 'AIza…'
                      : 'sk-…'
                  }
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="show-btn"
                  onClick={() => setShowKey((v) => !v)}
                  type="button"
                >
                  {showKey ? '🙈' : '👁️'}
                </button>
              </div>
              <small className="form-hint">
                Dapatkan API key:{' '}
                <a
                  href={
                    provider === 'gemini'
                      ? 'https://aistudio.google.com/apikey'
                      : 'https://platform.openai.com/api-keys'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {provider === 'gemini' ? 'Google AI Studio' : 'OpenAI Dashboard'}
                </a>
                . Key disimpan lokal di browser Anda, tidak pernah dikirim ke server kami.
              </small>
            </div>

            <div className="form-group">
              <label>Model (opsional)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={`default: ${defaultModel}`}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <div className="settings-actions">
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={!apiKey.trim()}
              >
                {saved ? '✓ Tersimpan!' : 'Simpan Konfigurasi'}
              </button>
              {config && (
                <button className="btn-danger" onClick={handleClear}>
                  Hapus API Key
                </button>
              )}
            </div>
          </section>
        )}

        <div className="settings-note">
          🔒 Privasi: Konfigurasi & API key disimpan di <code>localStorage</code> browser
          Anda. Permintaan AI langsung ke provider (Google/OpenAI), tidak melewati
          server perantara.
        </div>
      </div>
    </div>
  );
}
