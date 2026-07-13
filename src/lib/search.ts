// Search engine: index FlexSearch untuk pencarian cepat fuzzy/partial.
import { Index } from 'flexsearch';
import type { KbliItem } from '../types';

let data: KbliItem[] = [];
let index: Index | null = null;
let indexReady = false;
let loadingPromise: Promise<KbliItem[]> | null = null;

// Load data dari JSON (di-fetch sekali, di-cache)
export async function loadKbliData(): Promise<KbliItem[]> {
  if (data.length > 0) return data;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const res = await fetch('./data/kbli.json');
    if (!res.ok) throw new Error('Gagal memuat data KBLI');
    data = (await res.json()) as KbliItem[];

    // Bangun index FlexSearch
    // tokenize: forward (cari "tani" → "pertanian")
    index = new Index({
      tokenize: 'forward',
      resolution: 9,
      cache: true,
      context: { resolution: 3, depth: 2, bidirectional: true },
    });

    for (let i = 0; i < data.length; i++) {
      const it = data[i];
      // Index gabungan: kode + judul + uraian + padanan
      const doc = `${it.kode} ${it.judul} ${it.tokens}`;
      index.add(i, doc);
    }
    indexReady = true;
    return data;
  })();

  return loadingPromise;
}

export function isIndexReady(): boolean {
  return indexReady;
}

export interface SearchHit {
  item: KbliItem;
  score: number;
}

// Normalisasi ejaan: kata serapan Inggris → ejaan baku Indonesia yang
// dipakai di KBLI. Membantu user yang mengetik "cafe" → match "kafe".
const SPELL_MAP: Record<string, string> = {
  cafe: 'kafe',
  computer: 'komputer',
  restaurant: 'restoran',
  software: 'perangkat lunak',
  hardware: 'perangkat keras',
  application: 'aplikasi',
  technology: 'teknologi',
  business: 'bisnis',
  service: 'jasa',
  shop: 'toko',
  store: 'toko',
  hotel: 'hotel',
  clinic: 'klinik',
  pharmacy: 'apotek',
  travel: 'perjalanan',
  online: 'daring',
  offline: 'luring',
};

function normalizeQuery(q: string): string {
  const tokens = q.toLowerCase().split(/(\s+)/);
  return tokens
    .map((t) => SPELL_MAP[t] || t)
    .join('');
}

// Search: kembalikan item yang cocok, diurutkan berdasarkan relevansi.
export function search(query: string, limit = 50): SearchHit[] {
  if (!index || !query.trim()) return [];
  const q = normalizeQuery(query.trim());

  // Cek apakah query adalah kode (digit-only). Kode KBLI 5-digit sudah
  // structured, jadi kita lakukan prefix search langsung di data — jauh
  // lebih akurat daripada FlexSearch yang men-tokenize angka.
  const isKodeQuery = /^\d+$/.test(q);
  if (isKodeQuery) {
    const hits: SearchHit[] = [];
    // Exact match dapat skor tertinggi, lalu prefix.
    for (let i = 0; i < data.length && hits.length < limit; i++) {
      const item = data[i];
      let score = 0;
      if (item.kode === q) score = 1000;
      else if (item.kode.startsWith(q)) score = 500;
      else continue;
      hits.push({ item, score });
    }
    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  // Search via FlexSearch untuk keyword teks
  const rawResults = index.search(q, { limit: limit * 2, suggest: true });

  // Normalize hasil FlexSearch ke flat list of ids.
  // FlexSearch bisa return beberapa format tergantung config & versi:
  //   - Flat array of ids:     [0, 1, 2]            ← default Index
  //   - Array of arrays:       [[0, 1], [2]]        ← multi-term / Document index
  //   - Array of {id, score}:  [{id:0, score:9}]    ← saat `enrich:true`
  // Kita flatten semuanya jadi satu list ids dengan posisi untuk scoring.
  const ids: number[] = [];
  for (const entry of rawResults as unknown[]) {
    if (typeof entry === 'number') {
      ids.push(entry);
    } else if (Array.isArray(entry)) {
      for (const sub of entry) {
        if (typeof sub === 'number') ids.push(sub);
        else if (sub && typeof sub === 'object' && 'id' in sub) {
          ids.push((sub as { id: number }).id);
        }
      }
    } else if (entry && typeof entry === 'object' && 'id' in entry) {
      ids.push((entry as { id: number }).id);
    }
  }

  // Dedupe sambil menjaga urutan (posisi awal = lebih relevan)
  const seen = new Set<number>();
  const hits: SearchHit[] = [];

  for (let r = 0; r < ids.length; r++) {
    const idx = ids[r];
    if (seen.has(idx)) continue;
    seen.add(idx);
    const item = data[idx];
    if (!item) continue;

    // Scoring manual untuk boost kode match & judul exact
    let score = Math.max(0, 1000 - r); // posisi awal lebih tinggi
    const qLow = q.toLowerCase();

    // Boost: kode persis
    if (item.kode === q) score += 100;
    else if (item.kode.startsWith(q)) score += 50;
    else if (item.kode.includes(q)) score += 20;

    // Boost: judul persis / contains
    const jLow = item.judul.toLowerCase();
    if (jLow === qLow) score += 60;
    else if (jLow.startsWith(qLow)) score += 30;
    else if (jLow.includes(qLow)) score += 15;

    // Kode query: hanya tampilkan yang cocok prefix
    if (isKodeQuery && !item.kode.startsWith(q)) {
      score -= 5;
    }

    hits.push({ item, score });
  }

  // Sort by score desc
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

// Auto-suggest cepat untuk dropdown
export function suggest(query: string, limit = 8): KbliItem[] {
  if (!query.trim()) return [];
  return search(query, limit).map((h) => h.item);
}

export function getAllData(): KbliItem[] {
  return data;
}
