import { useEffect } from 'react';
import type { KbliItem } from '../types';
import {
  SKALA_LABELS,
  GOLONGAN_INFO,
  getGolonganByRange,
} from '../types';
import {
  GolonganBadge,
  PerubahanBadge,
} from './Badges';
import './DetailModal.css';

interface DetailModalProps {
  item: KbliItem | null;
  onClose: () => void;
}

export function DetailModal({ item, onClose }: DetailModalProps) {
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [item, onClose]);

  if (!item) return null;

  const gol = getGolonganByRange(item.kode);
  const golInfo = gol ? GOLONGAN_INFO[gol] : null;

  // Gabungkan perizinan & jangka waktu
  const izinWaktu = item.perizinan.map((p, i) => ({
    izin: p,
    waktu: item.jangkaWaktu[i] || '-',
  }));
  // Jika jangkaWaktu lebih banyak, append
  if (item.jangkaWaktu.length > item.perizinan.length) {
    for (let i = item.perizinan.length; i < item.jangkaWaktu.length; i++) {
      izinWaktu.push({ izin: '-', waktu: item.jangkaWaktu[i] });
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.kode);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?kode=${item.kode}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Tautan detail KBLI disalin ke clipboard!');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal scale-in"
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

        <div className="modal-header">
          <div className="modal-kode-row">
            <GolonganBadge kode={item.kode} />
            <button className="modal-kode" onClick={handleCopy} title="Salin kode">
              {item.kode}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
          {item.jenisPerubahan && item.jenisPerubahan !== '-' && (
            <PerubahanBadge jenis={item.jenisPerubahan} />
          )}
        </div>

        <h2 className="modal-judul">{item.judul}</h2>

        {golInfo && (
          <div className="modal-gol-info">
            <strong>Golongan {golInfo.kode}</strong> — {golInfo.nama}
          </div>
        )}

        <section className="modal-section">
          <h4>Uraian Kegiatan</h4>
          <p>{item.uraian}</p>
        </section>

        {item.padanan && item.padanan !== '-' && (
          <section className="modal-section padanan">
            <h4>Padanan KBLI 2020</h4>
            <p>{item.padanan}</p>
          </section>
        )}

        <section className="modal-section">
          <h4>Skala Usaha & Tingkat Risiko</h4>
          <div className="skala-table">
            {(Object.keys(SKALA_LABELS) as Array<keyof typeof SKALA_LABELS>).map(
              (key) => {
                const list = item.skalaRisiko[key];
                if (!list || list.length === 0) return null;
                return (
                  <div key={key} className="skala-row">
                    <div className="skala-label">{SKALA_LABELS[key]}</div>
                    <div className="skala-risiko">
                      {list.map((r) => (
                        <span key={r} className={`risk-badge ${riskClass(r)}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
            {Object.values(item.skalaRisiko).every((a) => a.length === 0) && (
              <p className="modal-empty">Data skala usaha tidak tersedia.</p>
            )}
          </div>
        </section>

        {(item.perizinan.length > 0 || item.jangkaWaktu.length > 0) && (
          <section className="modal-section">
            <h4>Perizinan Berusaha & Jangka Waktu</h4>
            <div className="izin-table">
              {izinWaktu.map((iw, idx) => (
                <div key={idx} className="izin-row">
                  <div className="izin-name">
                    {iw.izin === '-' ? '—' : iw.izin}
                  </div>
                  <div className="izin-waktu">
                    {iw.waktu === '-' ? '—' : iw.waktu}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Salin Tautan
          </button>
        </div>
      </div>
    </div>
  );
}

function riskClass(risiko: string): string {
  if (risiko === 'Rendah') return 'low';
  if (risiko === 'Menengah Rendah') return 'mid-low';
  if (risiko === 'Menengah Tinggi') return 'mid-high';
  if (risiko === 'Tinggi') return 'high';
  return 'mid-high';
}
