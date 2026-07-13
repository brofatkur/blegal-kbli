// Tipe data KBLI
export interface SkalaRisiko {
  mikro: string[];
  kecil: string[];
  menengah: string[];
  besar: string[];
}

export interface KbliItem {
  kode: string;          // 5-digit, mis. "01111"
  judul: string;
  uraian: string;
  padanan: string;       // padanan KBLI 2020
  jenisPerubahan: string; // Tetap, Pecah Kode, dll.
  skalaRisiko: SkalaRisiko;
  perizinan: string[];
  jangkaWaktu: string[];
  tokens: string;        // teks pre-tokenized untuk search
}

// Kategori/filter tambahan yang diturunkan dari kode
export type Golongan =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'
  | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U';

export const GOLONGAN_INFO: Record<Golongan, { nama: string; kode: string }> = {
  A: { kode: 'A', nama: 'Pertanian, Kehutanan, dan Perikanan' },
  B: { kode: 'B', nama: 'Pertambangan dan Penggalian' },
  C: { kode: 'C', nama: 'Industri Pengolahan' },
  D: { kode: 'D', nama: 'Pengadaan Listrik dan Gas' },
  E: { kode: 'E', nama: 'Pengadaan Air, Manajemen Sampah' },
  F: { kode: 'F', nama: 'Konstruksi' },
  G: { kode: 'G', nama: 'Perdagangan Besar dan Eceran' },
  H: { kode: 'H', nama: 'Transportasi dan Pergudangan' },
  I: { kode: 'I', nama: 'Akomodasi dan Makan Minum' },
  J: { kode: 'J', nama: 'Informasi dan Komunikasi' },
  K: { kode: 'K', nama: 'Aktivitas Keuangan dan Asuransi' },
  L: { kode: 'L', nama: 'Real Estate' },
  M: { kode: 'M', nama: 'Aktivitas Profesional, Ilmiah, Teknis' },
  N: { kode: 'N', nama: 'Aktivitas Penyewaan & Sewa Guna' },
  O: { kode: 'O', nama: 'Administrasi Pemerintahan' },
  P: { kode: 'P', nama: 'Pendidikan' },
  Q: { kode: 'Q', nama: 'Kesehatan Manusia dan Kegiatan Sosial' },
  R: { kode: 'R', nama: 'Seni, Hiburan, dan Rekreasi' },
  S: { kode: 'S', nama: 'Aktivitas Jasa Lainnya' },
  T: { kode: 'T', nama: 'Aktivitas Rumah Tangga' },
  U: { kode: 'U', nama: 'Aktivitas Organisasi Ekstrateritorial' },
};

// Mapping golongan (A-U) KBLI berdasarkan 2-digit pertama kode.
// Standar PDB Indonesia: A=01-03, B=05-09, C=10-33, D=35, E=36-39, F=41-43,
// G=45-47, H=49-53, I=55-56, J=58-63, K=64-66, L=68, M=69-75, N=77-82,
// O=84, P=85, Q=86-88, R=90-93, S=94-96, T=97-98, U=99.
const RANGE_GOLONGAN: Array<[number, number, Golongan]> = [
  [1, 3, 'A'],
  [5, 9, 'B'],
  [10, 33, 'C'],
  [35, 35, 'D'],
  [36, 39, 'E'],
  [41, 43, 'F'],
  [45, 47, 'G'],
  [49, 53, 'H'],
  [55, 56, 'I'],
  [58, 63, 'J'],
  [64, 66, 'K'],
  [68, 68, 'L'],
  [69, 75, 'M'],
  [77, 82, 'N'],
  [84, 84, 'O'],
  [85, 85, 'P'],
  [86, 88, 'Q'],
  [90, 93, 'R'],
  [94, 96, 'S'],
  [97, 98, 'T'],
  [99, 99, 'U'],
];

export function getGolonganByRange(kode: string): Golongan | null {
  const prefix = parseInt(kode.slice(0, 2), 10);
  for (const [lo, hi, g] of RANGE_GOLONGAN) {
    if (prefix >= lo && prefix <= hi) return g;
  }
  return null;
}

export const SKALA_LABELS: Record<keyof SkalaRisiko, string> = {
  mikro: 'Usaha Mikro',
  kecil: 'Usaha Kecil',
  menengah: 'Usaha Menengah',
  besar: 'Usaha Besar',
};

// Warna badge untuk tingkat risiko
export const RISIKO_COLOR: Record<string, string> = {
  'Rendah': 'low',
  'Menengah Rendah': 'mid-low',
  'Menengah Tinggi': 'mid-high',
  'Tinggi': 'high',
};
