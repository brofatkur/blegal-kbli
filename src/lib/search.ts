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

// Search: kembalikan item yang cocok, diurutkan berdasarkan relevansi.
export function search(query: string, limit = 50): SearchHit[] {
  if (!index || !query.trim()) return [];
  const q = query.trim();

  // Cek apakah query adalah kode (5 digit atau sebagian)
  const isKodeQuery = /^\d+$/.test(q);

  // Search via FlexSearch
  const rawResults = index.search(q, { limit: limit * 2, suggest: true });

  // FlexSearch mengembalikan array of array (per-term); flatten + dedupe + score
  const seen = new Set<number>();
  const hits: SearchHit[] = [];

  for (let r = 0; r < rawResults.length; r++) {
    const resultArray = rawResults[r] as unknown as number[];
    if (!Array.isArray(resultArray)) continue;
    for (const idx of resultArray) {
      if (seen.has(idx)) continue;
      seen.add(idx);
      const item = data[idx];
      if (!item) continue;

      // Scoring manual untuk boost kode match & judul exact
      let score = Math.max(0, 9 - r); // posisi awal lebih tinggi
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
