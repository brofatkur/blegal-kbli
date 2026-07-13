// AI Online: panggil LLM (Gemini/OpenAI) via API key yang user simpan lokal.
// Data KBLI diinjek sebagai konteks (RAG sederhana) untuk jawaban akurat.
import type { KbliItem } from '../types';
import { matchKbli } from './ai-matcher';

export type AiProvider = 'gemini' | 'openai';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model?: string;
}

const STORAGE_KEY = 'kbli-ai-config';

export function loadAiConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as AiConfig;
    if (!cfg.apiKey || !cfg.provider) return null;
    return cfg;
  } catch {
    return null;
  }
}

export function saveAiConfig(cfg: AiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearAiConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Bangun konteks KBLI untuk LLM: ambil top-N match relevan
function buildContext(query: string, data: KbliItem[], n = 8): string {
  const matches = matchKbli(query, data, n);
  if (matches.length === 0) {
    // Fallback: ambil sample beragam
    const sample = data.slice(0, 10);
    return sample
      .map(
        (it) =>
          `- ${it.kode}: ${it.judul}. ${it.uraian.slice(0, 150)}`,
      )
      .join('\n');
  }
  return matches
    .map(
      (m) =>
        `- ${m.item.kode}: ${m.item.judul}. ${m.item.uraian.slice(0, 200)}`,
    )
    .join('\n');
}

const SYSTEM_PROMPT = `Anda adalah asisten AI ahli klasifikasi KBLI 2025 (Klasifikasi Baku Lapangan Usaha Indonesia).
Tugas: bantu user menemukan kode KBLI 2025 yang tepat untuk usaha mereka, jelaskan skala usaha, tingkat risiko, perizinan, dan padanan KBLI 2020.

ATURAN:
- Jawab dalam Bahasa Indonesia yang jelas dan ramah.
- Selalu sertakan kode 5-digit + judul resmi KBLI 2025.
- Jika ada beberapa KBLI yang cocok, sebutkan semuanya dengan ringkas.
- Tekankan ketika ada perubahan dari KBLI 2020 (Pecah/Gabung/Recoding kode).
- Jika pertanyaan di luar topik KBLI, arahkan kembali ke topik usaha/perizinan.
- Jawaban ringkas, maksimal 5 paragraf. Gunakan format markdown ringan.`;

export async function askOnline(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  data: KbliItem[],
  config: AiConfig,
  signal?: AbortSignal,
): Promise<string> {
  const context = buildContext(query, data);

  if (config.provider === 'gemini') {
    return askGemini(query, history, context, config, signal);
  }
  return askOpenAI(query, history, context, config, signal);
}

async function askGemini(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: string,
  config: AiConfig,
  signal?: AbortSignal,
): Promise<string> {
  const model = config.model || 'gemini-2.0-flash';
  // Gemini pakai "contents" array; systemInstruction untuk persona.
  const contents = [
    ...history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [
        {
          text: `KONTEKS DATA KBLI 2025 (referensi resmi, gunakan untuk menjawab):\n${context}\n\nPERTANYAAN USER: ${query}`,
        },
      ],
    },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('') || '';
  if (!text) throw new Error('Gemini: respons kosong');
  return text;
}

async function askOpenAI(
  query: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: string,
  config: AiConfig,
  signal?: AbortSignal,
): Promise<string> {
  const model = config.model || 'gpt-4o-mini';
  const baseUrl = 'https://api.openai.com/v1/chat/completions';

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'system',
      content: `KONTEKS DATA KBLI 2025 (referensi resmi):\n${context}`,
    },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: query },
  ];

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenAI: respons kosong');
  return text;
}
