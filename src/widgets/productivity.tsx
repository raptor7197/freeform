import { useEffect, useMemo, useState } from 'react';
import { useDashboard } from '../store';
import type { Widget } from '../types';

// Local, no-network widgets: world clock, todo, countdown, pomodoro,
// stopwatch, calendar, link board, tally counter, moon phase.

function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function WorldClock({ widget }: { widget: Widget }) {
  const now = useNow();
  const zones = String(widget.config.zones ?? 'UTC')
    .split(',')
    .map((z) => z.trim())
    .filter(Boolean)
    .slice(0, 8);

  return (
    <table className="w-full border-collapse">
      <tbody>
        {zones.map((zone) => {
          let time = '—';
          try {
            time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: zone });
          } catch {
            time = 'bad zone';
          }
          return (
            <tr key={zone} className="border-b border-brdr/25 last:border-0">
              <td className="py-1.5 pr-2 text-[11px] font-black uppercase text-muted">{zone.split('/').pop()?.replace(/_/g, ' ')}</td>
              <td className="py-1.5 text-right text-[16px] font-bold tabular-nums text-ink">{time}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface TodoItem { text: string; done: boolean }

export function Todo({ widget }: { widget: Widget }) {
  const updateConfig = useDashboard((s) => s.updateConfig);
  const items = (widget.config.items as TodoItem[] | undefined) ?? [];
  const [draft, setDraft] = useState('');

  const save = (next: TodoItem[]) => updateConfig(widget.id, { items: next });

  return (
    <div className="h-full flex flex-col gap-2">
      <form
        className="flex-none flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (text) {
            save([...items, { text, done: false }]);
            setDraft('');
          }
        }}
      >
        <input className="studio-input flex-1 min-w-0 px-2 py-1.5 text-sm font-bold" value={draft} placeholder="Add a task…" onChange={(e) => setDraft(e.target.value)} />
        <button type="submit" className="studio-button flex-none px-2.5">+</button>
      </form>
      <ul className="flex-1 min-h-0 overflow-auto">
        {items.map((item, i) => (
          <li key={i} className="group flex items-center gap-2 border-b border-brdr/25 py-1.5 last:border-0">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => save(items.map((it, j) => (j === i ? { ...it, done: !it.done } : it)))}
              className="h-4 w-4 flex-none accent-[var(--color-accent)]"
            />
            <span className={`min-w-0 flex-1 text-[14px] font-bold leading-tight ${item.done ? 'text-muted line-through' : 'text-ink'}`}>
              {item.text}
            </span>
            <button
              type="button"
              aria-label={`Delete ${item.text}`}
              className="flex-none text-[11px] font-black uppercase text-muted opacity-0 hover:text-accent group-hover:opacity-100"
              onClick={() => save(items.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </li>
        ))}
        {!items.length && <li className="pt-4 text-center text-[12px] font-bold uppercase text-muted">All clear</li>}
      </ul>
    </div>
  );
}

export function Countdown({ widget }: { widget: Widget }) {
  const now = useNow();
  const target = new Date(String(widget.config.target ?? '2027-01-01T00:00'));
  const label = String(widget.config.label ?? 'Countdown');
  const ms = target.getTime() - now.getTime();
  const past = ms < 0;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86_400_000);
  const h = Math.floor((abs % 86_400_000) / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1000);

  if (Number.isNaN(target.getTime())) {
    return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Set a valid date in settings</div>;
  }
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
      <div className="text-[11px] font-black uppercase tracking-wide text-accent">{label}{past ? ' — elapsed' : ''}</div>
      <div className="brand-display text-[30px] leading-none tabular-nums">
        {d}d {h}h {m}m {s}s
      </div>
      <div className="border-t-2 border-brdr pt-2 text-[11px] font-bold uppercase text-muted">
        {target.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
      </div>
    </div>
  );
}

export function Pomodoro({ widget }: { widget: Widget }) {
  const workMin = Math.max(1, Number(widget.config.work) || 25);
  const restMin = Math.max(1, Number(widget.config.rest) || 5);
  const [mode, setMode] = useState<'work' | 'rest'>('work');
  const [left, setLeft] = useState(workMin * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((v) => {
        if (v > 1) return v - 1;
        // Phase flip
        setMode((prev) => {
          const next = prev === 'work' ? 'rest' : 'work';
          setLeft((next === 'work' ? workMin : restMin) * 60);
          return next;
        });
        return v;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, workMin, restMin]);

  const reset = () => {
    setRunning(false);
    setMode('work');
    setLeft(workMin * 60);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className={`text-[11px] font-black uppercase tracking-wide ${mode === 'work' ? 'text-accent' : 'text-up'}`}>
        {mode === 'work' ? 'Focus' : 'Break'}
      </div>
      <div className="brand-display text-[44px] leading-none tabular-nums">
        {String(Math.floor(left / 60)).padStart(2, '0')}:{String(left % 60).padStart(2, '0')}
      </div>
      <div className="flex gap-2">
        <button type="button" className="studio-button" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button type="button" className="studio-button" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

export function Stopwatch(_: { widget: Widget }) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  useEffect(() => {
    if (!running) return;
    const started = Date.now() - elapsed;
    const id = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const t = Math.floor((ms % 1000) / 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${t}`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="brand-display text-[40px] leading-none tabular-nums">{fmt(elapsed)}</div>
      <div className="flex gap-2">
        <button type="button" className="studio-button" onClick={() => setRunning((r) => !r)}>
          {running ? 'Stop' : 'Start'}
        </button>
        <button type="button" className="studio-button" onClick={() => (running ? setLaps((l) => [elapsed, ...l].slice(0, 5)) : (setElapsed(0), setLaps([])))}>
          {running ? 'Lap' : 'Clear'}
        </button>
      </div>
      {laps.length > 0 && (
        <div className="text-[11px] font-bold uppercase tabular-nums text-muted">
          {laps.map((l, i) => <div key={i}>Lap {laps.length - i}: {fmt(l)}</div>)}
        </div>
      )}
    </div>
  );
}

export function MonthCalendar(_: { widget: Widget }) {
  const now = useNow(60_000);
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const startPad = first.getDay();
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none pb-2 text-center text-[13px] font-black uppercase text-accent">
        {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid flex-1 grid-cols-7 gap-y-1 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-[10px] font-black uppercase text-muted">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`flex items-center justify-center text-[13px] font-bold tabular-nums ${
              day === now.getDate()
                ? 'mx-auto h-7 w-7 rounded-full border-2 border-accent text-accent'
                : 'text-ink'
            }`}
          >
            {day ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LinkBoard({ widget }: { widget: Widget }) {
  const lines = String(widget.config.raw ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) {
    return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Add links in settings</div>;
  }
  return (
    <ul className="flex flex-col">
      {lines.map((line, i) => {
        const [name, url] = line.split('|').map((p) => p.trim());
        const href = url ?? name;
        return (
          <li key={i} className="border-b border-brdr/25 last:border-0">
            <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 py-2 hover:bg-accent/10">
              <span className="widget-picker-icon !h-7 !w-7 !text-[13px]" aria-hidden="true">{(name || '?').slice(0, 1).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black text-ink">{name}</span>
                <span className="block truncate text-[10px] font-bold text-muted">{href}</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function Tally({ widget }: { widget: Widget }) {
  const updateConfig = useDashboard((s) => s.updateConfig);
  const count = Number(widget.config.count) || 0;
  const label = String(widget.config.label ?? 'Count');

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="text-[11px] font-black uppercase tracking-wide text-accent">{label}</div>
      <div className="brand-display text-[48px] leading-none tabular-nums">{count}</div>
      <div className="flex gap-2">
        <button type="button" className="studio-button px-4" onClick={() => updateConfig(widget.id, { count: count + 1 })}>+1</button>
        <button type="button" className="studio-button" onClick={() => updateConfig(widget.id, { count: Math.max(0, count - 1) })}>−1</button>
        <button type="button" className="studio-button" onClick={() => updateConfig(widget.id, { count: 0 })}>Reset</button>
      </div>
    </div>
  );
}

// Moon phase computed from the synodic month — no network.
export function MoonPhase(_: { widget: Widget }) {
  const { name, emoji, illumination } = useMemo(() => {
    const synodic = 29.530588853;
    // Reference new moon: 2000-01-06 18:14 UTC
    const days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86_400_000;
    const age = ((days % synodic) + synodic) % synodic;
    const phase = age / synodic;
    const illum = Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
    const table: [number, string, string][] = [
      [0.0625, 'New Moon', '🌑'], [0.1875, 'Waxing Crescent', '🌒'], [0.3125, 'First Quarter', '🌓'],
      [0.4375, 'Waxing Gibbous', '🌔'], [0.5625, 'Full Moon', '🌕'], [0.6875, 'Waning Gibbous', '🌖'],
      [0.8125, 'Last Quarter', '🌗'], [0.9375, 'Waning Crescent', '🌘'], [1.01, 'New Moon', '🌑'],
    ];
    const hit = table.find(([t]) => phase < t)!;
    return { name: hit[1], emoji: hit[2], illumination: illum };
  }, []);

  return (
    <div className="h-full flex items-center justify-center gap-4">
      <span className="text-[56px] leading-none" aria-hidden="true">{emoji}</span>
      <div className="text-left">
        <div className="text-[15px] font-black uppercase text-ink">{name}</div>
        <div className="mt-2 border-t-2 border-brdr pt-2 text-[11px] font-bold uppercase text-muted">
          {illumination}% illuminated
        </div>
      </div>
    </div>
  );
}
