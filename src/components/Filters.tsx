import { useState } from 'react';
import type { Golongan } from '../types';
import { GOLONGAN_INFO, SKALA_LABELS } from '../types';
import './Filters.css';

export type RiskFilter = 'all' | 'Rendah' | 'Menengah Rendah' | 'Menengah Tinggi' | 'Tinggi';
export type SkalaFilter = 'all' | keyof typeof SKALA_LABELS;

export interface FilterState {
  golongan: Golongan | 'all';
  risiko: RiskFilter;
  skala: SkalaFilter;
  perubahan: string; // 'all' | jenis perubahan
}

interface FiltersProps {
  state: FilterState;
  onChange: (s: FilterState) => void;
  resultCount: number;
  totalCount: number;
  perubahanOptions: string[];
}

export function Filters({
  state,
  onChange,
  resultCount,
  totalCount,
  perubahanOptions,
}: FiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const activeCount =
    (state.golongan !== 'all' ? 1 : 0) +
    (state.risiko !== 'all' ? 1 : 0) +
    (state.skala !== 'all' ? 1 : 0) +
    (state.perubahan !== 'all' ? 1 : 0);

  const update = (patch: Partial<FilterState>) =>
    onChange({ ...state, ...patch });

  const reset = () =>
    onChange({ golongan: 'all', risiko: 'all', skala: 'all', perubahan: 'all' });

  return (
    <div className="filters">
      <div className="filters-row">
        <div className="filter-summary">
          <span className="result-count">
            <strong>{resultCount.toLocaleString('id-ID')}</strong> dari{' '}
            {totalCount.toLocaleString('id-ID')} KBLI
          </span>
        </div>

        <div className="filter-actions">
          <button
            className={`filter-toggle ${activeCount > 0 ? 'has-active' : ''}`}
            onClick={() => setExpanded((v) => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter {activeCount > 0 && <span className="badge-count">{activeCount}</span>}
          </button>

          {activeCount > 0 && (
            <button className="reset-btn" onClick={reset}>
              Reset
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="filters-panel fade-in">
          <div className="filter-group">
            <label>Golongan</label>
            <select
              value={state.golongan}
              onChange={(e) =>
                update({ golongan: e.target.value as Golongan | 'all' })
              }
            >
              <option value="all">Semua Golongan</option>
              {(Object.keys(GOLONGAN_INFO) as Golongan[]).map((g) => (
                <option key={g} value={g}>
                  {g} — {GOLONGAN_INFO[g].nama}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Skala Usaha</label>
            <select
              value={state.skala}
              onChange={(e) => update({ skala: e.target.value as SkalaFilter })}
            >
              <option value="all">Semua Skala</option>
              {(Object.keys(SKALA_LABELS) as Array<keyof typeof SKALA_LABELS>).map(
                (s) => (
                  <option key={s} value={s}>
                    {SKALA_LABELS[s]}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="filter-group">
            <label>Tingkat Risiko</label>
            <select
              value={state.risiko}
              onChange={(e) => update({ risiko: e.target.value as RiskFilter })}
            >
              <option value="all">Semua Risiko</option>
              <option value="Rendah">Rendah</option>
              <option value="Menengah Rendah">Menengah Rendah</option>
              <option value="Menengah Tinggi">Menengah Tinggi</option>
              <option value="Tinggi">Tinggi</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Jenis Perubahan</label>
            <select
              value={state.perubahan}
              onChange={(e) => update({ perubahan: e.target.value })}
            >
              <option value="all">Semua</option>
              {perubahanOptions.map((p) => (
                <option key={p} value={p}>
                  {p || 'Tidak Ada'}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
