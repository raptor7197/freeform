import { useState } from 'react';
import { useDashboard } from './store';
import type { WidgetType } from './types';

const OPTIONS: { type: WidgetType; title: string; detail: string }[] = [
  { type: 'clock', title: 'Clock', detail: 'Local time panel' },
  { type: 'weather', title: 'Weather', detail: 'City forecast panel' },
  { type: 'notes', title: 'Quick Notes', detail: 'Ruled writing panel' },
];

export function WidgetPicker() {
  const addWidget = useDashboard((s) => s.addWidget);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button className="studio-button" type="button" onClick={() => setOpen((v) => !v)}>
        Widgets
      </button>

      {open && (
        <div className="studio-popover absolute right-0 top-full z-50 mt-3 w-72 p-3">
          <div className="mb-2 flex items-center justify-between border-b-2 border-brdr pb-2">
            <span className="text-xs font-black uppercase text-accent">Add widget</span>
            <button
              className="text-[11px] font-bold uppercase text-muted hover:text-accent"
              type="button"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                className="widget-picker-item"
                onClick={() => {
                  addWidget(option.type);
                  setOpen(false);
                }}
              >
                <span className="widget-picker-icon" aria-hidden="true">
                  {option.title.slice(0, 1)}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-[13px] font-black uppercase text-ink">
                    {option.title}
                  </span>
                  <span className="block text-[11px] font-bold uppercase leading-snug text-muted">
                    {option.detail}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
