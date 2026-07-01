import { useRef, useState, type ChangeEvent } from 'react';
import { useDashboard, type CanvasFilters } from './store';

const SLIDERS: {
  key: keyof CanvasFilters;
  label: string;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
}[] = [
  { key: 'blur', label: 'Blur', min: 0, max: 20, step: 0.5, fmt: (v) => `${v}px` },
  { key: 'grayscale', label: 'Black & white', min: 0, max: 1, step: 0.05, fmt: pct },
  { key: 'brightness', label: 'Brightness', min: 0.2, max: 2, step: 0.05, fmt: pct },
  { key: 'contrast', label: 'Contrast', min: 0.2, max: 2, step: 0.05, fmt: pct },
  { key: 'saturate', label: 'Saturation', min: 0, max: 3, step: 0.05, fmt: pct },
  { key: 'hueRotate', label: 'Hue', min: 0, max: 360, step: 1, fmt: (v) => `${Math.round(v)}°` },
];

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

const btn =
  'studio-button';

export function BgPanel() {
  const canvasBg = useDashboard((s) => s.canvasBg);
  const setCanvasBg = useDashboard((s) => s.setCanvasBg);
  const filters = useDashboard((s) => s.canvasFilters);
  const setCanvasFilters = useDashboard((s) => s.setCanvasFilters);
  const resetCanvasFilters = useDashboard((s) => s.resetCanvasFilters);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // let the same file be re-picked later
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCanvasBg(reader.result as string);
      setOpen(true);
    };
    reader.readAsDataURL(f);
  };

  const set = (key: keyof CanvasFilters, v: number) =>
    setCanvasFilters({ [key]: v } as Partial<CanvasFilters>);

  return (
    <div className="relative flex items-center gap-2">
      <button className={btn} onClick={() => fileRef.current?.click()}>
        Upload
      </button>
      {canvasBg && (
        <>
          <button className={btn} onClick={() => setOpen((o) => !o)}>
            Adjust
          </button>
          <button className={btn} onClick={() => setCanvasBg(null)}>
            Clear
          </button>
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />

      {open && canvasBg && (
        <div className="studio-popover absolute right-0 top-full z-50 mt-3 w-72 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-accent">
              Background
            </span>
            <button
              className="text-[11px] font-bold uppercase text-muted hover:text-accent"
              onClick={resetCanvasFilters}
            >
              Reset
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {SLIDERS.map((s) => (
              <label key={s.key} className="flex flex-col gap-1.5">
                <span className="flex justify-between text-[12px] font-bold uppercase text-muted">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-ink">{s.fmt(filters[s.key])}</span>
                </span>
                <input
                  type="range"
                  className="accent-accent"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={filters[s.key]}
                  onChange={(e) => set(s.key, Number(e.target.value))}
                />
              </label>
            ))}
          </div>

          <button
            className="studio-button mt-4 w-full"
            onClick={() => set('grayscale', filters.grayscale >= 1 ? 0 : 1)}
          >
            {filters.grayscale >= 1 ? 'Restore color' : 'Black & white'}
          </button>
        </div>
      )}
    </div>
  );
}
