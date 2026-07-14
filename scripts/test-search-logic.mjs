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

// Alias (sinkron dengan src/lib/aliases.ts)
const ALIAS_KBLI = {
  sembako: ['47241','47243','47249','46311','46315','46319','46329','46331','46321','46322','46325','46326'],
  'toko sembako': ['47241','47243','47249','46311','46319'],
  'grosir sembako': ['46311','46319','46315','46329','46331'],
  warung: ['47241','47249','47243','47519','47529','47539'],
  kulakan: ['46311','46319','46329','46331','46315'],
  olshop: ['47912','47913','47911','63111'],
};
function findAlias(q) {
  const qLow = q.toLowerCase();
  const aliases = Object.keys(ALIAS_KBLI).sort((a,b)=>b.split(/\s+/).length-a.split(/\s+/).length);
  for (const a of aliases) {
    const re = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i');
    if (re.test(qLow)) return { alias: a, codes: ALIAS_KBLI[a] };
  }
  return null;
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
  // Alias boost
  const aliasMatch = findAlias(q);
  // Teks: FlexSearch
  const rawResults = index.search(q, { limit: limit * 2, suggest: true });
  const ids = [];
  if (aliasMatch) {
    for (const kode of aliasMatch.codes) {
      const idx = data.findIndex((d) => d.kode === kode);
      if (idx >= 0) ids.push(idx);
    }
  }
  for (const entry of normalizeIds(rawResults)) ids.push(entry);
  const seen = new Set();
  const hits = [];
  for (let r = 0; r < ids.length; r++) {
    const idx = ids[r];
    if (seen.has(idx)) continue;
    seen.add(idx);
    const item = data[idx];
    if (!item) continue;
    let score = Math.max(0, 1000 - r);
    if (aliasMatch && aliasMatch.codes.includes(item.kode)) score += 500;
    hits.push({ item, score });
  }
  hits.sort((a,b) => b.score - a.score);
  return hits.slice(0, limit).map(h => h.item);
}

const queries = [
  'sembako',
  'toko sembako',
  'grosir sembako',
  'warung',
  'jual beras',
  'minyak goreng',
  'restoran',
  'pertanian',
  '01111',
  'perangkat lunak',
  'cafe',
  'laundry',
  'olshop',
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
