// Build script: CSV → JSON untuk web
// Parse CSV multi-baris & normalisasi field multi-line menjadi struktur bersih.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSV_PATH = resolve(__dirname, '../data-source/KBLI-2025-Lengkap.csv');
const OUT_DIR = resolve(__dirname, '../public/data');
const OUT_JSON = resolve(OUT_DIR, 'kbli.json');

const raw = readFileSync(CSV_PATH, 'utf-8');

const records = await new Promise((resolveP, rejectP) => {
  const rows = [];
  parse(
    raw,
    { columns: true, trim: false, skip_empty_lines: false, relax_column_count: true },
  )
    .on('data', (r) => rows.push(r))
    .on('end', () => resolveP(rows))
    .on('error', rejectP);
});

// Helper: pecah field multiline jadi array, trim tiap baris, drop '-' & kosong
const splitLines = (s) =>
  (s || '')
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => x && x !== '-');

// Normalisasi mapping skala → tingkat risiko
// Input: ["Usaha Mikro → Rendah", "Usaha Kecil → Menengah Rendah", ...]
// Output: { mikro: ["Rendah","Menengah Rendah"], kecil: [...], ... }
const SCALE_MAP = [
  { key: 'mikro', label: 'Usaha Mikro', aliases: ['mikro'] },
  { key: 'kecil', label: 'Usaha Kecil', aliases: ['kecil'] },
  { key: 'menengah', label: 'Usaha Menengah', aliases: ['menengah'] },
  { key: 'besar', label: 'Usaha Besar', aliases: ['besar'] },
];

function parseSkalaRisiko(lines) {
  const out = { mikro: [], kecil: [], menengah: [], besar: [] };
  for (const line of lines) {
    // pola: "Usaha Mikro → Rendah"  (panah bisa → atau -> atau -)
    const m = line.match(/usaha\s+(\w+)\s*[→\->]+\s*(.+)/i);
    if (!m) continue;
    const skala = m[1].toLowerCase();
    const risiko = m[2].trim();
    const target = SCALE_MAP.find((s) => skala.includes(s.key));
    if (target && !out[target.key].includes(risiko)) {
      out[target.key].push(risiko);
    }
  }
  return out;
}

// Normalisasi: jangka waktu → array of {izin: string, waktu: string}
// Field 6 (Perizinan) dan 7 (Jangka Waktu) saling berhubungan baris-demi-baris.
// Karena urutan bisa tidak sinkron, kita simpan apa adanya sebagai array terpisah.
function parsePerizinanWaktu(linesIzin, linesWaktu) {
  // Gabungkan dengan zip (panjang mungkin beda); fallback: gabung flat
  return {
    perizinan: linesIzin,
    jangkaWaktu: linesWaktu,
  };
}

// Tokenisasi ringan untuk search (untuk indexing manual jika perlu)
const stopwordId = new Set([
  'dan', 'atau', 'yang', 'untuk', 'pada', 'dari', 'ke', 'di', 'dengan',
  'ini', 'itu', 'juga', 'tidak', 'akan', 'adalah', 'dalam', 'oleh',
  'sebagai', 'para', 'serta', 'ataupun', 'agar', 'karena', 'namun',
  'kegiatan', 'termasuk', 'mencakup', 'lihat', 'subgolongan', 'golongan',
]);

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopwordId.has(t));
}

const items = [];
let skipped = 0;

for (const r of records) {
  const kode = (r['Kode KBLI 2025'] || '').trim();
  // Skip baris yang bukan record (kolom kode kosong / bukan 5 digit)
  if (!kode || !/^\d{5}$/.test(kode)) {
    skipped++;
    continue;
  }
  const judul = (r['Judul KBLI 2025'] || '').trim();
  const uraian = (r['Uraian KBLI 2025'] || '').trim();
  const padanan = (r['Padanan KBLI 2020'] || '').trim();
  const jenisPerubahan = (r['Jenis Perubahan'] || '').trim();

  const skalaLines = splitLines(r['Skala Usaha → Tingkat Risiko'] || '');
  const skalaRisiko = parseSkalaRisiko(skalaLines);

  const perizinan = splitLines(r['Perizinan Berusaha'] || '');
  const jangkaWaktu = splitLines(r['Jangka Waktu Penerbitan'] || '');

  items.push({
    kode,
    judul,
    uraian,
    padanan,
    jenisPerubahan,
    skalaRisiko,
    perizinan,
    jangkaWaktu,
    // Pre-tokenize untuk search engine
    tokens: tokenize(`${judul} ${uraian} ${padanan}`).join(' '),
  });
}

// Sort by kode
items.sort((a, b) => a.kode.localeCompare(b.kode));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(items), 'utf-8');

console.log(`✓ Parsed ${items.length} KBLI records (${skipped} baris di-skip)`);
console.log(`✓ Output: ${OUT_JSON} (${(JSON.stringify(items).length / 1024).toFixed(0)} KB)`);
console.log(`✓ Contoh: ${items[0].kode} - ${items[0].judul}`);
