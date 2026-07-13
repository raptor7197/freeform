import { useState } from 'react';
import { useDashboard } from './store';
import type { Widget } from './types';
import type { CatalogEntry, ConfigField } from './catalog/types';

// Per-widget settings, driven by the catalog entry's field schema. Edits are
// buffered locally and committed on Apply so API widgets don't refetch on
// every keystroke.

export function ConfigPanel({ widget, entry, onClose }: { widget: Widget; entry: CatalogEntry; onClose: () => void }) {
  const updateConfig = useDashboard((s) => s.updateConfig);
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...widget.config });

  const fields: ConfigField[] = [
    { key: 'title', label: 'Widget title', type: 'text', placeholder: entry.name },
    ...(entry.fields ?? []),
  ];
  if (entry.api && !entry.fields?.some((f) => f.key === 'refreshSec')) {
    fields.push({ key: 'refreshSec', label: 'Refresh (seconds)', type: 'number', placeholder: String(entry.api.refresh) });
  }

  const set = (key: string, value: unknown) => setDraft((d) => ({ ...d, [key]: value }));

  const apply = () => {
    updateConfig(widget.id, draft);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col overflow-hidden bg-card">
      <div className="flex-none flex items-center justify-between border-b-2 border-brdr px-3 py-2">
        <span className="text-[11px] font-black uppercase text-accent">Settings — {entry.name}</span>
        <button type="button" className="text-[11px] font-bold uppercase text-muted hover:text-accent" onClick={onClose}>
          Cancel
        </button>
      </div>
      <form
        className="flex-1 min-h-0 overflow-auto p-3"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase text-muted">{f.label}</span>
              {f.type === 'select' ? (
                <select
                  className="studio-input px-2 py-1.5 text-sm font-bold"
                  value={String(draft[f.key] ?? f.default ?? '')}
                  onChange={(e) => set(f.key, e.target.value)}
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === 'textarea' ? (
                <textarea
                  className="studio-textarea min-h-20 px-2 py-1.5 text-[13px] font-bold"
                  value={String(draft[f.key] ?? '')}
                  placeholder={f.placeholder}
                  spellCheck={false}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : f.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--color-accent)]"
                  checked={Boolean(draft[f.key])}
                  onChange={(e) => set(f.key, e.target.checked)}
                />
              ) : (
                <input
                  className="studio-input px-2 py-1.5 text-sm font-bold"
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={draft[f.key] === undefined ? '' : String(draft[f.key])}
                  placeholder={f.placeholder}
                  spellCheck={false}
                  onChange={(e) => set(f.key, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                />
              )}
              {f.help && <span className="text-[10px] font-bold text-muted/80">{f.help}</span>}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="submit" className="studio-button">Apply</button>
        </div>
      </form>
    </div>
  );
}
