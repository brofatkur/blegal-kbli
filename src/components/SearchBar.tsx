import { useEffect, useRef, useState } from 'react';
import type { KbliItem } from '../types';
import { suggest } from '../lib/search';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSelectItem: (item: KbliItem) => void;
  loading: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  onSelectItem,
  loading,
}: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<KbliItem[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced suggestions
  useEffect(() => {
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      setSuggestions(suggest(value, 6));
    }, 120);
    return () => clearTimeout(t);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowSug(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
      setShowSug(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        e.preventDefault();
        onSelectItem(suggestions[activeIdx]);
        setShowSug(false);
        setActiveIdx(-1);
      } else {
        onSubmit();
        setShowSug(false);
      }
    } else if (e.key === 'Escape') {
      setShowSug(false);
      setActiveIdx(-1);
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-box">
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Cari kode atau judul KBLI… (mis. 01111, restoran, perangkat lunak)"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSug(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setShowSug(true)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />

        {loading && (
          <div className="search-loader" title="Memuat index…">
            <div className="mini-spinner" />
          </div>
        )}

        {value && !loading && (
          <button
            className="clear-btn"
            onClick={handleClear}
            aria-label="Bersihkan"
            title="Bersihkan"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <button className="search-submit" onClick={onSubmit}>
          Cari
        </button>
      </div>

      {showSug && suggestions.length > 0 && (
        <ul className="suggestions scale-in">
          {suggestions.map((s, i) => (
            <li
              key={s.kode}
              className={`sug-item ${i === activeIdx ? 'active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectItem(s);
                setShowSug(false);
                setActiveIdx(-1);
              }}
            >
              <span className="sug-kode">{s.kode}</span>
              <span className="sug-judul">{s.judul}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
