// Alias map: istilah awam Indonesia → daftar kode KBLI yang relevan.
// Dipakai bersama oleh search engine (search.ts) dan AI matcher (ai-matcher.ts)
// supaya konsisten. Berguna untuk istilah yang TIDAK ada di data KBLI resmi
// (mis. "sembako", "warung", "olshop") tapi punya arti bisnis yang jelas.

// Deskripsi singkat per alias untuk dipakai AI menjelaskan ke user.
export interface AliasDef {
  codes: string[];
  description?: string;
}

export const ALIAS_KBLI: Record<string, AliasDef> = {
  // === SEMBAKO (Sembilan Bahan Pokok) ===
  // Beras, gula, minyak goreng, daging, telur, susu, dll. Tidak ada di KBLI.
  sembako: {
    codes: [
      '47241', // Eceran Beras
      '47243', // Eceran Kopi, Gula Pasir, Gula Merah
      '47249', // Eceran Makanan Lainnya (minyak goreng, kecap, dll)
      '46311', // Besar Beras
      '46315', // Besar Minyak & Lemak Nabati (minyak goreng)
      '46319', // Besar Bahan Makanan Hasil Pertanian
      '46329', // Besar Bahan Makanan Hasil Peternakan & Perikanan
      '46331', // Besar Gula, Cokelat
      '46321', // Besar Daging Sapi
      '46322', // Besar Daging Ayam
      '46325', // Besar Telur
      '46326', // Besar Susu
    ],
    description:
      'Sembako (sembilan bahan pokok) mencakup beras, gula, minyak goreng, daging, telur, susu, dan kebutuhan pokok lainnya. Untuk usaha sembako, pilih kode berdasarkan jenis usaha: eceran (warung/toko) = 47xxx, grosir/kulakan = 46xxx.',
  },
  'toko sembako': {
    codes: ['47241', '47243', '47249', '46311', '46319'],
    description:
      'Toko sembako eceran. Kode utama: 47241 (beras), 47243 (gula/kopi), 47249 (makanan lain).',
  },
  'warung sembako': {
    codes: ['47241', '47249', '47243'],
    description: 'Warung sembako = perdagangan eceran bahan pokok.',
  },
  'grosir sembako': {
    codes: ['46311', '46319', '46315', '46329', '46331'],
    description:
      'Grosir/distributor sembako = perdagangan besar bahan pokok. Kode: 46311 (beras), 46319 (bahan makanan pertanian), 46315 (minyak goreng), 46331 (gula).',
  },
  'agen sembako': {
    codes: ['46311', '46319', '46315', '46331'],
    description: 'Agen sembako = perdagangan besar bahan pokok.',
  },
  'jual beras': {
    codes: ['47241', '46311'],
    description: 'Jual beras: eceran 47241, grosir 46311.',
  },
  'jual gula': {
    codes: ['47243', '46331'],
    description: 'Jual gula: eceran 47243, grosir 46331.',
  },
  'minyak goreng': {
    codes: ['46315', '47249', '10415', '10437'],
    description:
      'Minyak goreng: perdagangan 46315 (grosir) / 47249 (eceran), produksi 10415 / 10437.',
  },

  // === Warung / Toko Kelontong ===
  warung: {
    codes: ['47241', '47249', '47243', '47519', '47529', '47539'],
    description:
      'Warung umumnya menjual campuran barang (makanan + kebutuhan rumah). Kode: 472xx (makanan), 475xx (barang rumah tangga).',
  },
  kelontong: {
    codes: ['47249', '47519', '47529', '47539'],
    description: 'Toko kelontong = eceran aneka barang campur.',
  },

  // === Kuliner / Makanan ===
  kuliner: {
    codes: ['56303', '56304', '56305', '56301', '56302', '10750'],
    description: 'Usaha kuliner: restoran (56301), rumah makan (56303), kafe (56304), kantin (56305).',
  },
  'rumah makan': {
    codes: ['56301', '56303', '56304', '56305'],
    description: 'Rumah makan/restoran: 56301 (restoran/RM), 56303 (rumah makan).',
  },
  'jasa catering': {
    codes: ['56210', '56209'],
    description: 'Catering / jasa boga: 56210.',
  },
  catering: {
    codes: ['56210', '56209'],
    description: 'Catering / jasa boga: 56210.',
  },
  'jual makanan': {
    codes: ['10750', '10751', '10752', '10753'],
    description: 'Produksi makanan olahan untuk dijual: 10750 (industri makanan).',
  },

  // === Fashion / Pakaian ===
  fashion: {
    codes: ['47511', '47512', '47513', '47519', '14111'],
    description: 'Fashion/pakaian: eceran 47511, grosir 46411, produksi/konveksi 14111.',
  },
  butik: { codes: ['47511', '47519'], description: 'Butik = eceran pakaian 47511.' },
  konveksi: {
    codes: ['14111', '14112', '14121', '14122'],
    description: 'Konveksi = industri garmen 14111.',
  },
  'jual baju': {
    codes: ['47511', '46411', '14111'],
    description: 'Jual pakaian: eceran 47511, grosir 46411.',
  },

  // === Otomotif ===
  bengkel: {
    codes: ['45201', '45202', '45203', '45204'],
    description: 'Bengkel: mobil 45201/45203, motor 45202/45204.',
  },
  'bengkel mobil': { codes: ['45201', '45203'] },
  'bengkel motor': { codes: ['45202', '45204'] },

  // === Jasa ===
  laundry: {
    codes: ['97010', '97020'],
    description: 'Laundry/cuci pakaian: 97010 (cuci & setrika).',
  },
  salon: {
    codes: ['96021', '96022', '96029'],
    description: 'Salon: kecantikan 96021, rambut 96022.',
  },
  'salon kecantikan': { codes: ['96021'] },
  'salon rambut': { codes: ['96022'] },

  // === Properti ===
  kost: {
    codes: ['68102', '55101', '55201'],
    description: 'Usaha kos/kost: 68102 (sewa rumah non-kontrak), 55101 (penginapan).',
  },
  kosan: { codes: ['68102', '55101', '55201'] },
  kontrakan: { codes: ['68102', '55101'] },

  // === Transportasi ===
  ojek: {
    codes: ['49231', '49239'],
    description: 'Ojek = angkutan ojek taksi 49231 / 49239.',
  },
  taksi: { codes: ['49212', '49213'] },
  travel: {
    codes: ['79110', '79120'],
    description: 'Agen perjalanan/wisata: 79110 / 79120.',
  },

  // === Tech / Digital ===
  startup: {
    codes: ['58201', '58202', '58203', '62011', '62012', '62019', '62021'],
    description: 'Startup tech: pengembangan perangkat lunak 62011 / 62021.',
  },
  'jasa it': { codes: ['62011', '62012', '62019', '62021'] },
  'web developer': { codes: ['62011', '62012', '62021'] },
  'app developer': { codes: ['62012', '62021', '62019'] },

  // === Online Shop ===
  olshop: {
    codes: ['47912', '47913', '47911', '63111'],
    description: 'Toko online/e-commerce: 47912 (eceran via internet), 63111 (portal e-commerce).',
  },
  'toko online': { codes: ['47912', '47913', '47911', '63111'] },
  dropship: { codes: ['47912', '47913', '47911'] },
  reseller: { codes: ['47912', '47913', '47911'] },
};

// Cek apakah query mengandung alias (bisa multi-kata, mis. "toko sembako").
// Return alias + daftar kode + deskripsi (jika ada).
export function findAlias(
  q: string,
): { alias: string; codes: string[]; description?: string } | null {
  const qLow = q.toLowerCase();
  // Cari alias dengan panjang token terbanyak dulu (spesifik > umum)
  const aliases = Object.keys(ALIAS_KBLI).sort(
    (a, b) => b.split(/\s+/).length - a.split(/\s+/).length,
  );
  for (const alias of aliases) {
    // Match sebagai whole word/phrase (bukan substring "warung" di "warungko")
    const re = new RegExp(
      `\\b${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i',
    );
    if (re.test(qLow)) {
      const def = ALIAS_KBLI[alias];
      return { alias, codes: def.codes, description: def.description };
    }
  }
  return null;
}
