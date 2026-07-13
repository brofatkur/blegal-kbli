// AI Matcher offline: NLP keyword matcher sederhana yang mencocokkan
// deskripsi aktivitas user → KBLI paling relevan. Tanpa API, langsung jalan.
//
// Strategi:
// 1. Tokenisasi query user + stopword removal
// 2. Hitung skor TF-IDF sederhana atas field judul + uraian tiap KBLI
// 3. Boost: kode match, judul exact, sinonim bisnis umum
import type { KbliItem } from '../types';

// Kamus sinonim bisnis → kata kunci KBLI (membantu pencarian natural)
const SYNONYMS: Record<string, string[]> = {
  'warung': ['warung', 'kopi', 'makan', 'minum'],
  'kulakan': ['grosir', 'perdagangan', 'besar'],
  'boutique': ['pakaian', 'detail', 'eceran'],
  'tailor': ['jahit', 'pakaian', 'konveksi'],
  'jasa': ['jasa', 'service', 'layanan'],
  'laundry': ['cuci', 'laundry', 'pakaian'],
  'kuliner': ['makanan', 'minuman', 'restoran', 'warung'],
  'fashion': ['pakaian', 'tekstil', 'kulit'],
  'teknologi': ['informasi', 'komputer', 'elektronik', 'digital'],
  'tech': ['teknologi', 'informasi', 'komputer', 'digital'],
  'startup': ['teknologi', 'informasi', 'digital', 'perangkat', 'lunak'],
  'aplikasi': ['perangkat', 'lunak', 'program', 'komputer', 'digital'],
  'software': ['perangkat', 'lunak', 'program', 'komputer'],
  'web': ['situs', 'internet', 'digital', 'perangkat', 'lunak'],
  'online': ['internet', 'elektronik', 'perdagangan', 'digital'],
  'olshop': ['perdagangan', 'elektronik', 'internet', 'eceran'],
  'maklon': ['kontrak', 'manufaktur', 'pengolahan'],
  'agent': ['agen', 'perantara', 'broker'],
  'agen': ['agen', 'perantara', 'broker'],
  'properti': ['real', 'estat', 'bangunan', 'sewa'],
  'property': ['real', 'estat', 'bangunan', 'sewa'],
  'sekolah': ['pendidikan', 'pengajaran', 'akademik'],
  'kursus': ['pendidikan', 'pelatihan', 'kursus'],
  'training': ['pelatihan', 'pendidikan', 'kursus'],
  'klinik': ['kesehatan', 'praktik', 'dokter', 'medis'],
  'dokter': ['kesehatan', 'praktik', 'medis', 'dokter'],
  'apotek': ['farmasi', 'obat', 'kesehatan'],
  'pharmacy': ['farmasi', 'obat', 'kesehatan'],
  'travel': ['perjalanan', 'wisata', 'agen', 'transportasi'],
  'hotel': ['akomodasi', 'penginapan', 'hotel'],
  'resto': ['restoran', 'makan', 'rumah', 'makan'],
  'cafe': ['kafe', 'kopi', 'minuman'],
  'kafe': ['kafe', 'kopi', 'minuman'],
  'carpentry': ['kayu', 'perkayuan', 'mebel'],
  'toko': ['perdagangan', 'eceran', 'toko'],
  'shop': ['perdagangan', 'eceran', 'toko'],
  'store': ['perdagangan', 'eceran', 'toko'],
  'bisnis': ['usaha', 'perdagangan', 'jasa'],
  'business': ['usaha', 'perdagangan', 'jasa'],
  'mekanik': ['perbaikan', 'montir', 'mesin', 'bengkel'],
  'bengkel': ['perbaikan', 'montir', 'mesin', 'bengkel'],
  'printing': ['cetak', 'cetak', 'grafis', 'percetakan'],
  'percetakan': ['cetak', 'grafis', 'percetakan'],
};

const STOPWORDS = new Set([
  'dan', 'atau', 'yang', 'untuk', 'pada', 'dari', 'ke', 'di', 'dengan',
  'ini', 'itu', 'juga', 'tidak', 'akan', 'adalah', 'dalam', 'oleh',
  'sebagai', 'para', 'serta', 'ataupun', 'agar', 'karena', 'namun',
  'saya', 'mau', 'ingin', 'buka', 'membuka', 'mendirikan', 'usaha',
  'jenis', 'bidang', 'apa', 'kode', 'kbli', 'nya', 'lah', 'kah',
  'sama', 'seperti', 'sambil', 'serta', 'juga', 'the', 'a', 'an',
  'i', 'want', 'to', 'open', 'start', 'business', 'type', 'of',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Expand query dengan sinonim
function expandQuery(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const t of tokens) {
    const syns = SYNONYMS[t];
    if (syns) syns.forEach((s) => expanded.add(s));
  }
  return Array.from(expanded);
}

export interface MatchResult {
  item: KbliItem;
  score: number;
  matchedTokens: string[];
}

// Fungsi inti: cari KBLI paling cocok untuk deskripsi aktivitas user
export function matchKbli(
  query: string,
  data: KbliItem[],
  limit = 10,
): MatchResult[] {
  if (!query.trim() || data.length === 0) return [];

  let qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  // Expand dengan sinonim
  qTokens = expandQuery(qTokens);
  const qSet = new Set(qTokens);

  const results: MatchResult[] = [];

  for (const item of data) {
    const itemTokens = item.tokens.split(' ').filter(Boolean);
    if (itemTokens.length === 0) continue;

    // Hitung token overlap
    const matchedTokens: string[] = [];
    let overlap = 0;
    const itemSet = new Set(itemTokens);
    for (const t of qSet) {
      if (itemSet.has(t)) {
        overlap++;
        matchedTokens.push(t);
      }
    }
    if (overlap === 0) continue;

    // Skor TF sederhana: overlap / query_length
    let score = overlap / qTokens.length;

    // Boost: judul match (lebih penting)
    const judulTokens = new Set(tokenize(item.judul));
    let judulMatch = 0;
    for (const t of qSet) if (judulTokens.has(t)) judulMatch++;
    if (judulMatch > 0) {
      score += (judulMatch / qTokens.length) * 0.5;
    }

    // Boost: panjang judul pendek (lebih spesifik)
    if (item.judul.length < 40) score += 0.05;

    // Boost: uraian match dengan jumlah relatif
    if (overlap >= 3) score += 0.1;

    if (score > 0.05) {
      results.push({ item, score, matchedTokens });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// Generate jawaban natural berdasarkan hasil match
export function generateReply(
  query: string,
  matches: MatchResult[],
): string {
  if (matches.length === 0) {
    return `Maaf, saya belum menemukan KBLI yang cocok untuk deskripsi "${query}". Coba gunakan kata kunci yang lebih spesifik, misalnya jenis produk atau layanan utama (contoh: "restoran", "perdagangan pakaian", "jasa pengembangan perangkat lunak").`;
  }

  const top = matches[0];
  const lines: string[] = [];
  lines.push(
    `Berdasarkan deskripsi Anda, berikut KBLI 2025 yang paling relevan untuk usaha "${query}":\n`,
  );
  lines.push(`**🏆 ${top.item.kode} — ${top.item.judul}**`);
  lines.push(`_${top.item.uraian.slice(0, 220)}${top.item.uraian.length > 220 ? '…' : ''}_\n`);

  if (matches.length > 1) {
    lines.push(`**Kemungkinan lain yang relevan:**`);
    for (let i = 1; i < Math.min(matches.length, 5); i++) {
      const m = matches[i];
      lines.push(`• **${m.item.kode}** — ${m.item.judul}`);
    }
  }

  lines.push(
    `\n💡 _Tips: Klik salah satu kode di atas untuk melihat detail lengkap (skala usaha, risiko, perizinan, dan padanan KBLI 2020). Saya juga bisa menjawab pertanyaan spesifik jika Anda menghubungkan API AI ( tombol ⚙️ Settings )._`,
  );

  return lines.join('\n');
}
