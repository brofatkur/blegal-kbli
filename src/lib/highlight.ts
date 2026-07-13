// Helper untuk highlight teks query di hasil pencarian.
export function highlightText(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map(escapeRegex);
  if (tokens.length === 0) return escapeHtml(text);

  const re = new RegExp(`(${tokens.join('|')})`, 'gi');
  return escapeHtml(text).replace(
    re,
    '<mark class="hl">$1</mark>',
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
