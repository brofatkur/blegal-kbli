# Blegal — Pencarian KBLI 2025 + AI Assistant

Web modern untuk pencarian **KBLI 2025** (Klasifikasi Baku Lapangan Usaha Indonesia) dengan
AI Assistant terintegrasi. Lebih cepat & lebih cerdas dari referensi.

## ✨ Fitur

- ⚡ **Pencarian instan** — FlexSearch index dengan fuzzy matching & auto-suggest
- 🤖 **AI Assistant hybrid**:
  - **Offline (default)**: NLP keyword matcher dengan kamus sinonim bisnis Indonesia. Gratis, tanpa API key.
  - **Online (opsional)**: Chat LLM penuh via API key Anda (Google Gemini / OpenAI) dengan RAG konteks KBLI.
- 📊 **Detail lengkap** — Uraian, skala usaha × tingkat risiko, perizinan (NIB/Izin/Sertifikat Standar), jangka waktu, padanan KBLI 2020
- 🎯 **Filter canggih** — Golongan (A-U), skala usaha, tingkat risiko, jenis perubahan
- 🎨 **Desain modern** — Glassmorphism, gradient, dark/light mode otomatis, fully responsive
- 🔗 **Deep linking** — Share URL `?kode=XXXXX` langsung ke detail KBLI
- 🔒 **Privasi** — API key disimpan di `localStorage` browser, tidak ada server perantara

## 🚀 Menjalankan

```bash
npm install
npm run dev          # development (http://localhost:5173)
```

## 🏗️ Build Production

```bash
npm run build        # regenerate data JSON + build ke dist/
npm run preview      # preview hasil build secara lokal
```

Output statis di folder `dist/` — bisa di-deploy ke Netlify, Vercel, GitHub Pages, Cloudflare Pages, atau hosting statis mana pun.

### Deploy ke subpath (mis. GitHub Pages)

```bash
VITE_BASE_PATH="/repo-name/" npm run build
```

## 📊 Update Data

Letakkan file CSV terbaru di `data-source/KBLI-2025-Lengkap.csv` lalu jalankan:

```bash
npm run build:data   # generate ulang public/data/kbli.json
```

Format CSV harus punya header:
`Kode KBLI 2025, Judul KBLI 2025, Uraian KBLI 2025, Padanan KBLI 2020, Jenis Perubahan, Skala Usaha → Tingkat Risiko, Perizinan Berusaha, Jangka Waktu Penerbitan`

Field `Skala Usaha`, `Perizinan`, dan `Jangka Waktu` boleh multi-baris (akan di-normalize otomatis).

## 🤖 Mengaktifkan AI Online

1. Klik tombol **⚙️ Settings** di header.
2. Pilih mode **Online (LLM)**.
3. Pilih provider: **Google Gemini** (gratis via AI Studio) atau **OpenAI**.
4. Tempel API key Anda (disimpan lokal di browser).
5. Klik **Simpan**.

Tanpa API key, AI Assistant tetap berfungsi mode **Offline (Smart Matcher)** — tidak perlu konfigurasi apa pun.

## 🛠️ Tech Stack

- **Vite + React 19 + TypeScript** — modern, cepat, type-safe
- **FlexSearch** — search engine client-side, sub-50ms untuk 1.500+ record
- **CSS custom properties** — design system tanpa framework UI berat
- **Zero backend** — 100% client-side, privasi penuh

## 📁 Struktur

```
src/
├── components/         # UI components (Header, SearchBar, Filters, cards, modals)
├── lib/                # Logika (search engine, AI matcher, AI online, highlight)
├── types.ts            # Type definitions & data mapping (golongan, skala)
└── App.tsx             # Root component
scripts/
└── build-data.mjs      # CSV → JSON converter + tokenizer
data-source/            # CSV mentah (sumber)
public/data/            # JSON output (di-serve statis)
```

## 📈 Statistik Data

- **1.559** kode KBLI 2025
- **8** kolom data per record
- **2,1 MB** JSON (di-gzip ~89 KB saat dikirim)
- Pencarian rata-rata **< 30ms**

---

Dibuat sebagai alternatif modern & cepat untuk dpb.unpad.ac.id/kbli2025.
