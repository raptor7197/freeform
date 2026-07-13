import { useMemo, useState } from 'react';
import { useDashboard } from './store';
import { CATALOG, CATEGORIES } from './catalog';
import type { CatalogEntry, Category } from './catalog/types';

// Full-screen widget market: search + category rail + add-to-canvas cards.

export function Marketplace() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="studio-button" type="button" onClick={() => setOpen(true)}>
        ✦ Widget Market
      </button>
      {open && <MarketModal onClose={() => setOpen(false)} />}
    </>
  );
}

function MarketModal({ onClose }: { onClose: () => void }) {
  const addWidget = useDashboard((s) => s.addWidget);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [added, setAdded] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (!q) return true;
      return [e.name, e.description, e.source, e.category, ...(e.tags ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [query, category]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of CATALOG) map.set(e.category, (map.get(e.category) ?? 0) + 1);
    return map;
  }, []);

  const add = (entry: CatalogEntry) => {
    addWidget(entry.id);
    setAdded(entry.id);
    window.setTimeout(() => setAdded((cur) => (cur === entry.id ? null : cur)), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 sm:p-8" onClick={onClose}>
      <div
        className="market-panel flex h-full w-full max-w-6xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Widget market"
      >
        <div className="flex-none flex flex-wrap items-center gap-3 border-b-[3px] border-brdr bg-bg px-4 py-3">
          <span className="brand-display text-[24px] leading-none">Widget Market</span>
          <span className="text-[11px] font-bold uppercase text-muted">{CATALOG.length} widgets — all free &amp; open APIs</span>
          <input
            autoFocus
            className="studio-input ml-auto w-full min-w-0 px-3 py-1.5 text-sm font-bold sm:w-72"
            placeholder="Search stocks, news, webhooks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="studio-button flex-none" onClick={onClose}>Close</button>
        </div>

        <div className="flex min-h-0 flex-1">
          <nav className="flex-none w-44 overflow-y-auto border-r-[3px] border-brdr bg-bg/60 p-2 hidden sm:block">
            {(['All', ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={`market-cat ${category === c ? 'market-cat-active' : ''}`}
                onClick={() => setCategory(c)}
              >
                <span className="min-w-0 flex-1 truncate text-left">{c}</span>
                <span className="flex-none text-[10px] opacity-70">{c === 'All' ? CATALOG.length : counts.get(c) ?? 0}</span>
              </button>
            ))}
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto bg-canvas p-4">
            {results.length === 0 ? (
              <div className="pt-16 text-center text-sm font-bold uppercase text-muted">No widgets match "{query}"</div>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {results.map((entry) => (
                  <article key={entry.id} className="market-card flex flex-col gap-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-black uppercase leading-tight text-ink">{entry.name}</span>
                        <span className="block truncate text-[10px] font-bold uppercase text-accent">{entry.source}</span>
                      </span>
                      <span className="market-badge flex-none">{entry.category}</span>
                    </div>
                    <p className="min-h-8 flex-1 text-[12px] font-bold leading-snug text-muted">{entry.description}</p>
                    <div className="flex items-center gap-1.5">
                      {(entry.tags ?? []).map((t) => (
                        <span key={t} className={`market-tag ${t === 'live' ? 'market-tag-live' : ''}`}>{t}</span>
                      ))}
                      <button type="button" className="studio-button ml-auto min-h-8 px-3 text-[11px]" onClick={() => add(entry)}>
                        {added === entry.id ? 'Added ✓' : '+ Add'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
