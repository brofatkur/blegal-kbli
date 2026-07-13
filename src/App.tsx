import { useEffect, useMemo, useState } from 'react';
import './App.css';
import type { KbliItem } from './types';
import { getGolonganByRange } from './types';
import { loadKbliData, search } from './lib/search';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SearchBar } from './components/SearchBar';
import { Filters, type FilterState } from './components/Filters';
import { ResultCard } from './components/ResultCard';
import { DetailModal } from './components/DetailModal';
import { AiAssistant } from './components/AiAssistant';
import { SettingsModal } from './components/SettingsModal';

const PAGE_SIZE = 24;

function App() {
  // Data state
  const [data, setData] = useState<KbliItem[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    golongan: 'all',
    risiko: 'all',
    skala: 'all',
    perubahan: 'all',
  });
  const [selected, setSelected] = useState<KbliItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [aiOpen, setAiOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiOnline, setAiOnline] = useState(false);

  // Load data on mount
  useEffect(() => {
    void (async () => {
      try {
        const d = await loadKbliData();
        setData(d);
      } catch (err) {
        console.error('Failed to load KBLI data', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Detect deep link: ?kode=XXXXX
  useEffect(() => {
    if (data.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const kode = params.get('kode');
    if (kode) {
      const item = data.find((d) => d.kode === kode);
      if (item) setSelected(item);
    }
  }, [data]);

  // Reset pagination on query/filter change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [submittedQuery, filters]);

  // Compute search + filter results
  const results = useMemo(() => {
    if (data.length === 0) return [];
    let base: KbliItem[];

    if (submittedQuery.trim()) {
      base = search(submittedQuery, 200).map((h) => h.item);
    } else {
      base = data;
    }

    // Apply filters
    return base.filter((item) => {
      // Golongan
      if (filters.golongan !== 'all') {
        const g = getGolonganByRange(item.kode);
        if (g !== filters.golongan) return false;
      }
      // Skala & Risiko (combined: cek apakah ada skala+risiko combo)
      if (filters.skala !== 'all' || filters.risiko !== 'all') {
        let found = false;
        const skalaKeys: Array<keyof KbliItem['skalaRisiko']> = [
          'mikro',
          'kecil',
          'menengah',
          'besar',
        ];
        for (const sk of skalaKeys) {
          if (filters.skala !== 'all' && sk !== filters.skala) continue;
          const arr = item.skalaRisiko[sk];
          if (filters.risiko !== 'all') {
            if (arr.includes(filters.risiko)) {
              found = true;
              break;
            }
          } else if (arr.length > 0) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
      // Perubahan
      if (filters.perubahan !== 'all') {
        const jp = item.jenisPerubahan || '-';
        if (jp !== filters.perubahan) return false;
      }
      return true;
    });
  }, [data, submittedQuery, filters]);

  const perubahanOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      const jp = d.jenisPerubahan || '-';
      if (jp) set.add(jp);
    });
    return Array.from(set).sort();
  }, [data]);

  const visibleResults = results.slice(0, visibleCount);
  const hasMore = visibleCount < results.length;

  const handleSubmit = () => setSubmittedQuery(query);

  const handleSelectItem = (item: KbliItem) => {
    setSelected(item);
  };

  return (
    <>
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleAi={() => setAiOnline((v) => !v)}
        aiOnline={aiOnline}
      />

      <main className="main">
        <Hero totalKbli={data.length} loading={loading} />

        <div className="search-section">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            onSelectItem={handleSelectItem}
            loading={loading}
          />

          {!loading && (
            <Filters
              state={filters}
              onChange={setFilters}
              resultCount={results.length}
              totalCount={data.length}
              perubahanOptions={perubahanOptions}
            />
          )}
        </div>

        <section className="results-section">
          {loading ? (
            <SkeletonGrid />
          ) : results.length === 0 ? (
            <EmptyState query={submittedQuery} />
          ) : (
            <>
              <div className="results-grid">
                {visibleResults.map((item) => (
                  <ResultCard
                    key={item.kode}
                    item={item}
                    query={submittedQuery}
                    onClick={handleSelectItem}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="load-more-wrap">
                  <button
                    className="load-more"
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  >
                    Tampilkan lebih banyak
                    <span className="more-count">
                      ({(results.length - visibleCount).toLocaleString('id-ID')} lagi)
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="footer">
          <p>
            <strong>Blegal</strong> — Platform Klasifikasi Baku Lapangan Usaha
            Indonesia (KBLI 2025).
          </p>
          <p className="footer-sub">
            Data per {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} •
            {' '}{data.length.toLocaleString('id-ID')} kode KBLI •
            {' '}Pencarian & AI terintegrasi
          </p>
        </footer>
      </main>

      {/* Floating AI button */}
      {!aiOpen && (
        <button
          className="ai-fab"
          onClick={() => setAiOpen(true)}
          aria-label="Buka AI Assistant"
          title="Tanya AI Assistant"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="fabgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              fill="url(#fabgrad)"
            />
            <circle cx="18.5" cy="5.5" r="1.5" fill="#fff" />
            <circle cx="5" cy="18" r="1" fill="#fff" />
          </svg>
        </button>
      )}

      <AiAssistant
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        online={aiOnline}
        onSelectItem={handleSelectItem}
      />

      <DetailModal item={selected} onClose={() => setSelected(null)} />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        online={aiOnline}
        onToggleOnline={setAiOnline}
      />
    </>
  );
}

function SkeletonGrid() {
  return (
    <div className="results-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="skeleton-card" key={i} style={{ animationDelay: `${i * 60}ms` }}>
          <div className="skel-line skel-short" />
          <div className="skel-line skel-title" />
          <div className="skel-line" />
          <div className="skel-line skel-80" />
          <div className="skel-badges">
            <div className="skel-badge" />
            <div className="skel-badge" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-icon">🔍</div>
      <h3>Tidak ada hasil ditemukan</h3>
      <p>
        {query
          ? `Tidak ada KBLI yang cocok dengan "${query}". Coba kata kunci lain atau`
          : 'Belum ada hasil. '}
        {' '}gunakan AI Assistant untuk pencarian natural.
      </p>
      <div className="empty-tips">
        <strong>💡 Tips pencarian:</strong>
        <ul>
          <li>Ketik kode 5-digit (mis. <code>01111</code>) atau sebagian kode</li>
          <li>Gunakan kata kunci jenis usaha (mis. <code>restoran</code>, <code>perdagangan</code>)</li>
          <li>Klik tombol AI di kanan bawah untuk tanya bahasa natural</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
