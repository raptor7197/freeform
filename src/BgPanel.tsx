import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
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
  const canvasBgKind = useDashboard((s) => s.canvasBgKind);
  const setCanvasBg = useDashboard((s) => s.setCanvasBg);
  const filters = useDashboard((s) => s.canvasFilters);
  const setCanvasFilters = useDashboard((s) => s.setCanvasFilters);
  const resetCanvasFilters = useDashboard((s) => s.resetCanvasFilters);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const onPickImage = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // let the same file be re-picked later
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCanvasBg(reader.result as string, 'image');
      setOpen(true);
    };
    reader.readAsDataURL(f);
  };

  const onPickVideo = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (canvasBgKind === 'video' && canvasBg) URL.revokeObjectURL(canvasBg);
    setCanvasBg(URL.createObjectURL(f), 'video');
    setOpen(true);
  };

  const clear = () => {
    if (canvasBgKind === 'video' && canvasBg) URL.revokeObjectURL(canvasBg);
    setCanvasBg(null);
  };

  const [videoUrl, setVideoUrl] = useState('');
  const onVideoUrl = (e: FormEvent) => {
    e.preventDefault();
    const url = videoUrl.trim();
    if (!url) return;
    if (canvasBgKind === 'video' && canvasBg?.startsWith('blob:')) URL.revokeObjectURL(canvasBg);
    setCanvasBg(url, 'video');
    setOpen(true);
  };

  const set = (key: keyof CanvasFilters, v: number) =>
    setCanvasFilters({ [key]: v } as Partial<CanvasFilters>);

  return (
    <div className="relative flex items-center gap-2">
      <button className={btn} onClick={() => fileRef.current?.click()}>
        Image
      </button>
      <button className={btn} onClick={() => videoRef.current?.click()}>
        Video
      </button>
      <button className={btn} onClick={() => setCanvasBg('shader-gradient', 'shader')}>
        Shader
      </button>
      {canvasBg && (
        <>
          <button className={btn} onClick={() => setOpen((o) => !o)}>
            Adjust
          </button>
          <button className={btn} onClick={clear}>
            Clear
          </button>
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={onPickVideo} />

      {open && canvasBg && (
        <div className="studio-popover absolute right-0 top-full z-50 mt-3 w-72 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-accent">
              Background {canvasBgKind !== 'image' ? `(${canvasBgKind})` : ''}
            </span>
            <button
              className="text-[11px] font-bold uppercase text-muted hover:text-accent"
              onClick={resetCanvasFilters}
            >
              Reset
            </button>
          </div>

          <form className="mb-3 flex gap-2" onSubmit={onVideoUrl}>
            <input
              className="studio-input min-w-0 flex-1 px-2 py-1.5 text-[12px] font-bold"
              placeholder="Video URL (mp4, webm)…"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <button type="submit" className="studio-button flex-none px-2.5 text-[11px]">
              Set
            </button>
          </form>

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
