// Test search logic murni (tanpa browser) — replikasi persis kode search.ts
import { readFileSync } from 'fs';
import { Index } from 'flexsearch';

const data = JSON.parse(readFileSync('./public/data/kbli.json', 'utf8'));
console.log(`Loaded ${data.length} records`);

const index = new Index({
  tokenize: 'forward',
  resolution: 9,
  cache: true,
  context: { resolution: 3, depth: 2, bidirectional: true },
});

for (let i = 0; i < data.length; i++) {
  const it = data[i];
  index.add(i, `${it.kode} ${it.judul} ${it.tokens}`);
}
console.log('Index built\n');

// Helper: normalize rawResults seperti kode produksi
function normalizeIds(rawResults) {
  const ids = [];
  for (const entry of rawResults) {
    if (typeof entry === 'number') ids.push(entry);
    else if (Array.isArray(entry)) {
      for (const sub of entry) {
        if (typeof sub === 'number') ids.push(sub);
        else if (sub && typeof sub === 'object' && 'id' in sub) ids.push(sub.id);
      }
    } else if (entry && typeof entry === 'object' && 'id' in entry) {
      ids.push(entry.id);
    }
  }
  return ids;
}

const SPELL_MAP = {
  cafe: 'kafe', computer: 'komputer', restaurant: 'restoran',
  software: 'perangkat lunak', hardware: 'perangkat keras',
  application: 'aplikasi', technology: 'teknologi', business: 'bisnis',
  service: 'jasa', shop: 'toko', store: 'toko', hotel: 'hotel',
  clinic: 'klinik', pharmacy: 'apotek', travel: 'perjalanan',
};
function normalizeQuery(q) {
  return q.toLowerCase().split(/(\s+)/).map((t) => SPELL_MAP[t] || t).join('');
}

function search(q, limit = 10) {
  q = normalizeQuery(q);
  // Kode query: prefix search langsung
  const isKodeQuery = /^\d+$/.test(q);
  if (isKodeQuery) {
    const hits = [];
    for (let i = 0; i < data.length && hits.length < limit; i++) {
      const item = data[i];
      let score = 0;
      if (item.kode === q) score = 1000;
      else if (item.kode.startsWith(q)) score = 500;
      else continue;
      hits.push(item);
    }
    return hits;
  }
  // Teks: FlexSearch
  const rawResults = index.search(q, { limit: limit * 2, suggest: true });
  const ids = normalizeIds(rawResults);
  const seen = new Set();
  const hits = [];
  for (let r = 0; r < ids.length; r++) {
    const idx = ids[r];
    if (seen.has(idx)) continue;
    seen.add(idx);
    const item = data[idx];
    if (!item) continue;
    hits.push(item);
  }
  return hits;
}

const queries = [
  'restoran',
  'pertanian',
  '01111',
  '0111',
  'perdagangan',
  'kopi',
  'perangkat lunak',
  'cafe',
  'laundry',
  'xyz123',
];

console.log('=== SEARCH RESULTS ===');
for (const q of queries) {
  const results = search(q, 5);
  const sample = results.slice(0, 3).map((r) => `${r.kode} ${r.judul.slice(0, 30)}`);
  console.log(`\n"${q}" (${results.length} hits):`);
  sample.forEach((s) => console.log(`   ${s}`));
  if (results.length === 0) console.log('   (kosong)');
}
