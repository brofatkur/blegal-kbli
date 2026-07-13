import { memo } from 'react';
import type { KbliItem } from '../types';
import { highlightText } from '../lib/highlight';
import { GolonganBadge, PerubahanBadge, PerizinanBadges } from './Badges';
import './ResultCard.css';

interface ResultCardProps {
  item: KbliItem;
  query: string;
  onClick: (item: KbliItem) => void;
}

export const ResultCard = memo(function ResultCard({
  item,
  query,
  onClick,
}: ResultCardProps) {
  // Ambil ringkasan risiko: tampilkan risiko unik
  const allRisiko = new Set<string>();
  Object.values(item.skalaRisiko).forEach((arr: string[]) =>
    arr.forEach((r: string) => allRisiko.add(r)),
  );
  const risikoList = Array.from(allRisiko);

  return (
    <article
      className="result-card fade-in"
      onClick={() => onClick(item)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(item);
        }
      }}
    >
      <div className="card-header">
        <div className="card-kode-wrap">
          <GolonganBadge kode={item.kode} />
          <span className="card-kode">{item.kode}</span>
        </div>
        {item.jenisPerubahan && item.jenisPerubahan !== '-' && (
          <PerubahanBadge jenis={item.jenisPerubahan} />
        )}
      </div>

      <h3
        className="card-judul"
        dangerouslySetInnerHTML={{ __html: highlightText(item.judul, query) }}
      />

      <p
        className="card-uraian"
        dangerouslySetInnerHTML={{
          __html: highlightText(
            item.uraian.length > 180
              ? item.uraian.slice(0, 180) + '…'
              : item.uraian,
            query,
          ),
        }}
      />

      <div className="card-footer">
        <div className="card-risiko">
          {risikoList.length > 0 ? (
            risikoList.map((r) => (
              <span key={r} className={`risk-badge ${riskClass(r)}`}>
                {r}
              </span>
            ))
          ) : (
            <span className="card-empty">—</span>
          )}
        </div>
        <PerizinanBadges item={item} />
      </div>

      <div className="card-arrow" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </article>
  );
});

function riskClass(risiko: string): string {
  if (risiko === 'Rendah') return 'low';
  if (risiko === 'Menengah Rendah') return 'mid-low';
  if (risiko === 'Menengah Tinggi') return 'mid-high';
  if (risiko === 'Tinggi') return 'high';
  return 'mid-high';
}
