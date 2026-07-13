import { useCallback, useEffect, useRef, useState } from 'react';
import type { Widget } from '../types';
import type { CatalogEntry } from '../catalog/types';
import type { DisplayData } from '../catalog/types';
import { runApi } from '../catalog/fetch';

// Generic renderer for every declarative catalog entry. Fetches on mount and
// on an interval, then renders one of: stat / list / table / text / image / chart.

export function useApiData(entry: CatalogEntry, widget: Widget) {
  const [data, setData] = useState<DisplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  // Re-fetch when any config value changes.
  const configKey = JSON.stringify(widget.config);

  useEffect(() => {
    if (!entry.api) return;
    const ctrl = new AbortController();
    let timer: number | undefined;
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const d = await runApi(entry.api!, widget.config, ctrl.signal);
        if (!cancelled) {
          setData(d);
          setUpdatedAt(Date.now());
        }
      } catch (e) {
        if (!cancelled && e instanceof Error && e.name !== 'AbortError') setError(e.message);
      }
    };

    void load();
    const overrideSec = Number(widget.config.refreshSec);
    const sec = Number.isFinite(overrideSec) && overrideSec >= 5 ? overrideSec : entry.api.refresh;
    if (sec > 0) timer = window.setInterval(load, sec * 1000);

    return () => {
      cancelled = true;
      ctrl.abort();
      if (timer) window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id, configKey, nonce]);

  return { data, error, updatedAt, refresh };
}

export function ApiWidget({ widget, entry }: { widget: Widget; entry: CatalogEntry }) {
  const { data, error, updatedAt, refresh } = useApiData(entry, widget);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
        <div className="border-y-2 border-brdr px-2 py-3 text-sm font-bold text-muted">{error}</div>
        <button type="button" className="studio-button" onClick={refresh}>Retry</button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <DisplayBody data={data} />
      </div>
      {updatedAt !== null && entry.api && entry.api.refresh <= 600 && (
        <div className="flex-none pt-1 text-right text-[10px] font-bold uppercase text-muted/80">
          updated {new Date(updatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

export function DisplayBody({ data }: { data: DisplayData }) {
  switch (data.kind) {
    case 'stat':
      return <StatView data={data} />;
    case 'list':
      return <ListView data={data} />;
    case 'table':
      return <TableView data={data} />;
    case 'text':
      return <TextView data={data} />;
    case 'image':
      return <ImageView data={data} />;
    case 'chart':
      return <Sparkline data={data} />;
  }
}

function DeltaBadge({ delta }: { delta: { text: string; dir: 'up' | 'down' | 'flat' } }) {
  const arrow = delta.dir === 'up' ? '▲' : delta.dir === 'down' ? '▼' : '■';
  const cls = delta.dir === 'up' ? 'text-up' : delta.dir === 'down' ? 'text-down' : 'text-muted';
  return (
    <span className={`text-[13px] font-black tabular-nums ${cls}`}>
      {arrow} {delta.text}
    </span>
  );
}

function StatView({ data }: { data: Extract<DisplayData, { kind: 'stat' }> }) {
  return (
    <div className="h-full flex flex-col items-start justify-center gap-1">
      {data.label && (
        <div className="text-[11px] font-black uppercase tracking-wide text-accent">{data.label}</div>
      )}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="brand-display text-[38px] leading-none tabular-nums break-all">{data.value}</span>
        {data.delta && <DeltaBadge delta={data.delta} />}
      </div>
      {data.sub && (
        <div className="mt-2 w-full border-t-2 border-brdr pt-2 text-[11px] font-bold uppercase leading-snug text-muted">
          {data.sub}
        </div>
      )}
    </div>
  );
}

function ListView({ data }: { data: Extract<DisplayData, { kind: 'list' }> }) {
  if (!data.items.length) {
    return <div className="text-sm font-bold uppercase text-muted">Nothing to show</div>;
  }
  return (
    <ul className="flex flex-col">
      {data.items.map((item, i) => {
        const inner = (
          <>
            {item.image && <img src={item.image} alt="" className="h-7 w-7 flex-none rounded-full border-2 border-brdr object-cover" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-bold leading-tight text-ink">{item.title}</span>
              {item.sub && <span className="block truncate text-[11px] font-bold uppercase text-muted">{item.sub}</span>}
            </span>
            {item.value !== undefined && (
              <span className="flex-none text-[13px] font-black tabular-nums text-ink">{item.value}</span>
            )}
          </>
        );
        return (
          <li key={i} className="border-b border-brdr/25 last:border-0">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 py-1.5 hover:bg-accent/10">
                {inner}
              </a>
            ) : (
              <span className="flex items-center gap-2.5 py-1.5">{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function TableView({ data }: { data: Extract<DisplayData, { kind: 'table' }> }) {
  return (
    <table className="w-full border-collapse">
      <tbody>
        {data.rows.map(([label, value], i) => (
          <tr key={i} className="border-b border-brdr/25 last:border-0">
            <td className="py-1.5 pr-3 text-[11px] font-black uppercase text-muted">{label}</td>
            <td className="py-1.5 text-right text-[13px] font-bold tabular-nums text-ink break-all">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TextView({ data }: { data: Extract<DisplayData, { kind: 'text' }> }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="border-l-[6px] border-accent/80 pl-3 text-[15px] font-bold leading-relaxed text-ink whitespace-pre-line overflow-auto">
        {data.text}
      </div>
      {data.attribution && (
        <div className="mt-2 pl-3 text-[11px] font-black uppercase text-muted">— {data.attribution}</div>
      )}
    </div>
  );
}

function ImageView({ data }: { data: Extract<DisplayData, { kind: 'image' }> }) {
  const img = (
    <img
      src={data.src}
      alt={data.caption ?? 'widget image'}
      className="h-full w-full rounded border-2 border-brdr object-cover"
    />
  );
  return (
    <figure className="h-full flex flex-col gap-2">
      <div className="flex-1 min-h-0">
        {data.link ? (
          <a href={data.link} target="_blank" rel="noreferrer" className="block h-full">{img}</a>
        ) : img}
      </div>
      {data.caption && (
        <figcaption className="flex-none truncate text-[11px] font-bold uppercase text-muted">{data.caption}</figcaption>
      )}
    </figure>
  );
}

// Single-series sparkline: 2px ink line, soft accent area, accent end dot,
// no grid (the widget is the frame). Hover shows a crosshair + value readout.
function Sparkline({ data }: { data: Extract<DisplayData, { kind: 'chart' }> }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { points } = data;

  if (points.length < 2) {
    return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Not enough data</div>;
  }

  const W = 100;
  const H = 40;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const px = (i: number) => (i / (points.length - 1)) * W;
  const py = (v: number) => H - 4 - ((v - min) / span) * (H - 8);
  const path = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(2)},${py(v).toFixed(2)}`).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  const last = points[points.length - 1];
  const hoverIdx = hover === null ? null : Math.max(0, Math.min(points.length - 1, hover));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    setHover(Math.round(((e.clientX - rect.left) / rect.width) * (points.length - 1)));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] font-black uppercase text-accent">{data.label ?? ''}</span>
        <span className="brand-display text-[22px] leading-none tabular-nums">
          {hoverIdx !== null ? points[hoverIdx].toLocaleString('en-US', { maximumFractionDigits: 4 }) : (data.current ?? last.toLocaleString('en-US', { maximumFractionDigits: 4 }))}
        </span>
      </div>
      <div className="flex-1 min-h-0 mt-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-full w-full touch-none"
          role="img"
          aria-label={`${data.label ?? 'chart'}: ${points.length} points from ${min} to ${max}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          <path d={area} fill="var(--color-accent)" opacity="0.12" />
          <path d={path} fill="none" stroke="var(--color-ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          {hoverIdx !== null && (
            <line x1={px(hoverIdx)} x2={px(hoverIdx)} y1="0" y2={H} stroke="var(--color-muted)" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
          )}
          <circle
            cx={px(hoverIdx ?? points.length - 1)}
            cy={py(points[hoverIdx ?? points.length - 1])}
            r="2.6"
            fill="var(--color-accent)"
            stroke="var(--color-card)"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div className="flex-none flex justify-between text-[10px] font-bold uppercase tabular-nums text-muted">
        <span>lo {min.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
        <span>hi {max.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
}
