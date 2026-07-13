import type { KbliItem } from '../types';
import { RISIKO_COLOR, getGolonganByRange, GOLONGAN_INFO } from '../types';
import './Badges.css';

export function RiskBadge({ risiko }: { risiko: string }) {
  const cls = RISIKO_COLOR[risiko] || 'mid-high';
  return <span className={`risk-badge ${cls}`}>{risiko}</span>;
}

export function GolonganBadge({ kode }: { kode: string }) {
  const g = getGolonganByRange(kode);
  if (!g) return null;
  const info = GOLONGAN_INFO[g];
  return (
    <span className="gol-badge" title={info.nama}>
      {g}
    </span>
  );
}

export function PerubahanBadge({ jenis }: { jenis: string }) {
  if (!jenis || jenis === '-') return null;
  // Tentukan warna berdasarkan jenis
  let cls = 'tetap';
  if (jenis.includes('Baru')) cls = 'baru';
  else if (jenis.includes('Pecah')) cls = 'pecah';
  else if (jenis.includes('Gabung')) cls = 'gabung';
  else if (jenis.includes('Recoding') || jenis.includes('Pindah')) cls = 'recoding';
  else if (jenis.includes('Hapus') || jenis.includes('Lebur')) cls = 'hapus';

  return <span className={`perubahan-badge ${cls}`}>{jenis}</span>;
}

export function PerizinanBadges({ item }: { item: KbliItem }) {
  const izin = item.perizinan;
  if (!izin || izin.length === 0) return null;
  return (
    <span className="izin-badges">
      {izin.map((p) => (
        <span key={p} className="izin-badge">
          {p}
        </span>
      ))}
    </span>
  );
}
