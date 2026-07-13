import { useCallback, useEffect, useRef, useState } from 'react';
import type { Widget } from '../types';
import { CORS_PROXY } from '../catalog/fetch';
import { getPath, getString } from '../catalog/paths';

// Integration widgets: the universal connectors. Custom REST calls, webhook
// buttons, live WebSockets, RSS feeds, page embeds, and an uptime pinger.

// ---------------------------------------------------------------------------
// Custom API — call any endpoint, extract any value
// ---------------------------------------------------------------------------

export function CustomApi({ widget }: { widget: Widget }) {
  const [result, setResult] = useState<unknown>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const configKey = JSON.stringify(widget.config);

  useEffect(() => {
    const url = String(widget.config.url ?? '').trim();
    if (!url) return;
    const ctrl = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        let headers: Record<string, string> | undefined;
        const rawHeaders = String(widget.config.headers ?? '').trim();
        if (rawHeaders) headers = JSON.parse(rawHeaders);
        const method = String(widget.config.method ?? 'GET');
        const body = String(widget.config.body ?? '').trim();
        const target = widget.config.proxy ? CORS_PROXY + encodeURIComponent(url) : url;
        const res = await fetch(target, {
          method,
          headers,
          body: method === 'GET' || method === 'DELETE' || !body ? undefined : body,
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const text = await res.text();
        let json: unknown = text;
        try { json = JSON.parse(text); } catch { /* keep as text */ }
        const path = String(widget.config.path ?? '').trim();
        if (!cancelled) {
          setResult(path ? getPath(json, path) : json);
          setUpdatedAt(Date.now());
        }
      } catch (e) {
        if (!cancelled && e instanceof Error && e.name !== 'AbortError') {
          setError(e.message === 'Failed to fetch' ? 'Fetch failed — endpoint may block CORS. Try the proxy option in settings.' : e.message);
        }
      }
    };

    void load();
    const sec = Math.max(5, Number(widget.config.refreshSec) || 60);
    const timer = window.setInterval(load, sec * 1000);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  if (!String(widget.config.url ?? '').trim()) {
    return <div className="h-full flex items-center justify-center px-3 text-center text-sm font-bold uppercase text-muted">Set an endpoint URL in settings (gear icon)</div>;
  }
  if (error) return <div className="h-full flex items-center justify-center px-2 text-center text-sm font-bold text-muted">{error}</div>;
  if (result === undefined) return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Loading…</div>;

  const isScalar = typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean';
  return (
    <div className="h-full flex flex-col">
      {widget.config.label != null && String(widget.config.label) !== '' && (
        <div className="flex-none text-[11px] font-black uppercase tracking-wide text-accent">{String(widget.config.label)}</div>
      )}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-auto">
        {isScalar ? (
          <span className="brand-display break-all text-center text-[34px] leading-tight tabular-nums">{String(result)}</span>
        ) : (
          <pre className="h-full w-full overflow-auto whitespace-pre-wrap break-all text-[12px] font-bold leading-relaxed text-ink">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
      {updatedAt !== null && (
        <div className="flex-none pt-1 text-right text-[10px] font-bold uppercase text-muted/80">
          updated {new Date(updatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Webhook buttons — POST to Slack/Discord/Zapier/IFTTT/n8n/anything
// ---------------------------------------------------------------------------

export function WebhookButtons({ widget }: { widget: Widget }) {
  const [status, setStatus] = useState<Record<number, string>>({});
  const lines = String(widget.config.buttons ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const fire = async (i: number, url: string, body: string) => {
    setStatus((s) => ({ ...s, [i]: 'sending…' }));
    const payload = body || '{}';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      setStatus((s) => ({ ...s, [i]: res.ok ? `sent ✓ (${res.status})` : `HTTP ${res.status}` }));
    } catch {
      // Many webhook hosts (Slack, IFTTT) don't send CORS headers; the request
      // still goes through in no-cors mode — we just can't read the response.
      try {
        await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: payload });
        setStatus((s) => ({ ...s, [i]: 'sent ✓ (opaque)' }));
      } catch {
        setStatus((s) => ({ ...s, [i]: 'failed' }));
      }
    }
  };

  if (!lines.length) {
    return <div className="h-full flex items-center justify-center px-3 text-center text-sm font-bold uppercase text-muted">Add webhook buttons in settings</div>;
  }
  return (
    <div className="flex flex-col gap-2.5">
      {lines.map((line, i) => {
        const [name, url, ...rest] = line.split('|').map((p) => p.trim());
        const body = rest.join('|');
        return (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              className="studio-button flex-1 justify-start"
              disabled={!url}
              onClick={() => url && fire(i, url, body)}
            >
              ⚡ {name || 'Webhook'}
            </button>
            <span className="flex-none w-24 truncate text-right text-[10px] font-bold uppercase text-muted">{status[i] ?? ''}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WebSocket live feed — Binance preset (config.symbol) or fully custom URL
// ---------------------------------------------------------------------------

export function WsLive({ widget }: { widget: Widget }) {
  const [value, setValue] = useState<string | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const [state, setState] = useState<'connecting' | 'live' | 'closed' | 'error'>('connecting');
  const [log, setLog] = useState<string[]>([]);
  const configKey = JSON.stringify(widget.config);
  const prev = useRef<number | null>(null);

  const symbol = String(widget.config.symbol ?? '').trim();
  const customUrl = String(widget.config.url ?? '').trim();
  const isBinance = !!symbol && !customUrl;

  useEffect(() => {
    const url = isBinance
      ? `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`
      : customUrl;
    if (!url) return;
    setState('connecting');
    setValue(null);
    prev.current = null;
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      setState('error');
      return;
    }

    ws.onopen = () => {
      setState('live');
      const sub = String(widget.config.sub ?? '').trim();
      if (sub) ws.send(sub);
    };
    ws.onclose = () => setState('closed');
    ws.onerror = () => setState('error');
    ws.onmessage = (ev) => {
      const raw = typeof ev.data === 'string' ? ev.data : '';
      let json: unknown = raw;
      try { json = JSON.parse(raw); } catch { /* raw text */ }
      if (isBinance) {
        const price = parseFloat(getString(json, 'c') ?? '');
        const pct = parseFloat(getString(json, 'P') ?? '');
        if (Number.isFinite(price)) {
          setValue(price.toLocaleString('en-US', { maximumFractionDigits: price >= 100 ? 2 : 6 }));
          if (Number.isFinite(pct)) setDelta(pct);
          prev.current = price;
        }
      } else {
        const path = String(widget.config.path ?? '').trim();
        const v = path ? getString(json, path) : raw;
        if (v !== undefined) {
          setValue(v.length > 200 ? `${v.slice(0, 200)}…` : v);
          setLog((l) => [v.length > 120 ? `${v.slice(0, 120)}…` : v, ...l].slice(0, 6));
        }
      }
    };
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configKey]);

  if (!symbol && !customUrl) {
    return <div className="h-full flex items-center justify-center px-3 text-center text-sm font-bold uppercase text-muted">Set a Binance pair or a wss:// URL in settings</div>;
  }

  const dot = state === 'live' ? 'bg-up' : state === 'connecting' ? 'bg-accent' : 'bg-down';
  return (
    <div className="h-full flex flex-col">
      <div className="flex-none flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot} ${state === 'live' ? 'animate-pulse' : ''}`} aria-hidden="true" />
        <span className="text-[11px] font-black uppercase tracking-wide text-accent">
          {String(widget.config.label ?? '') || (isBinance ? symbol.toUpperCase() : 'Live feed')}
        </span>
        <span className="ml-auto text-[10px] font-bold uppercase text-muted">{state}</span>
      </div>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 overflow-hidden">
        {value === null ? (
          <span className="text-sm font-bold uppercase text-muted">waiting for data…</span>
        ) : (
          <>
            <span className="brand-display break-all text-center text-[34px] leading-tight tabular-nums">{value}</span>
            {delta !== null && (
              <span className={`text-[13px] font-black tabular-nums ${delta > 0 ? 'text-up' : delta < 0 ? 'text-down' : 'text-muted'}`}>
                {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '■ '}{delta.toFixed(2)}% 24h
              </span>
            )}
          </>
        )}
      </div>
      {!isBinance && log.length > 1 && (
        <div className="flex-none max-h-20 overflow-hidden border-t-2 border-brdr pt-1 text-[10px] font-bold leading-relaxed text-muted">
          {log.slice(1).map((l, i) => <div key={i} className="truncate">{l}</div>)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RSS / Atom reader — fetched via CORS proxy, parsed with DOMParser
// ---------------------------------------------------------------------------

interface FeedItem { title: string; link?: string; date?: string }

export function RssReader({ widget }: { widget: Widget }) {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = String(widget.config.url ?? '').trim();

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const res = await fetch(CORS_PROXY + encodeURIComponent(url), { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const xml = new DOMParser().parseFromString(await res.text(), 'text/xml');
        if (xml.querySelector('parsererror')) throw new Error('Not a valid RSS/Atom feed');
        const nodes = [...xml.querySelectorAll('item, entry')].slice(0, 10);
        const parsed = nodes.map((n) => ({
          title: n.querySelector('title')?.textContent?.trim() ?? 'Untitled',
          link: n.querySelector('link')?.getAttribute('href') ?? n.querySelector('link')?.textContent?.trim() ?? undefined,
          date: (n.querySelector('pubDate, published, updated')?.textContent ?? '').slice(0, 25),
        }));
        if (!cancelled) setItems(parsed);
      } catch (e) {
        if (!cancelled && e instanceof Error && e.name !== 'AbortError') setError(e.message);
      }
    };

    void load();
    const timer = window.setInterval(load, 600_000);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearInterval(timer);
    };
  }, [url]);

  if (!url) return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Set a feed URL in settings</div>;
  if (error) return <div className="h-full flex items-center justify-center px-2 text-center text-sm font-bold text-muted">{error}</div>;
  if (!items) return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Loading feed…</div>;

  return (
    <ul className="flex flex-col">
      {items.map((item, i) => (
        <li key={i} className="border-b border-brdr/25 last:border-0">
          <a href={item.link} target="_blank" rel="noreferrer" className="block py-1.5 hover:bg-accent/10">
            <span className="block text-[13px] font-bold leading-tight text-ink">{item.title}</span>
            {item.date && <span className="block pt-0.5 text-[10px] font-bold uppercase text-muted">{item.date}</span>}
          </a>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Website embed
// ---------------------------------------------------------------------------

export function Embed({ widget }: { widget: Widget }) {
  const url = String(widget.config.url ?? '').trim();
  if (!url) return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Set a URL in settings</div>;
  return (
    <iframe
      src={url}
      title="Embedded page"
      className="h-full w-full rounded border-2 border-brdr bg-white"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      loading="lazy"
    />
  );
}

// ---------------------------------------------------------------------------
// Uptime monitor — browser-side reachability probe
// ---------------------------------------------------------------------------

interface ProbeResult { state: 'up' | 'down' | 'checking'; ms?: number }

export function StatusMonitor({ widget }: { widget: Widget }) {
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const targets = String(widget.config.targets ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((line) => {
      const [name, url] = line.split('|').map((p) => p.trim());
      return { name: name || url, url: url || name };
    });
  const targetKey = JSON.stringify(targets);

  const probe = useCallback(async () => {
    for (const t of targets) {
      if (!t.url) continue;
      setResults((r) => ({ ...r, [t.url]: { state: 'checking' } }));
      const start = performance.now();
      try {
        // no-cors: opaque response, but resolving at all means the host answered.
        await fetch(t.url, { mode: 'no-cors', cache: 'no-store' });
        const ms = Math.round(performance.now() - start);
        setResults((r) => ({ ...r, [t.url]: { state: 'up', ms } }));
      } catch {
        setResults((r) => ({ ...r, [t.url]: { state: 'down' } }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  useEffect(() => {
    void probe();
    const sec = Math.max(15, Number(widget.config.refreshSec) || 60);
    const timer = window.setInterval(probe, sec * 1000);
    return () => window.clearInterval(timer);
  }, [probe, widget.config.refreshSec]);

  if (!targets.length) {
    return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Add targets in settings</div>;
  }
  return (
    <div className="h-full flex flex-col">
      <ul className="flex-1 min-h-0 overflow-auto">
        {targets.map((t) => {
          const r = results[t.url];
          const color = r?.state === 'up' ? 'bg-up' : r?.state === 'down' ? 'bg-down' : 'bg-grid';
          return (
            <li key={t.url} className="flex items-center gap-2.5 border-b border-brdr/25 py-2 last:border-0">
              <span className={`h-3 w-3 flex-none rounded-full border-2 border-brdr ${color}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-black text-ink">{t.name}</span>
                <span className="block truncate text-[10px] font-bold text-muted">{t.url}</span>
              </span>
              <span className="flex-none text-[11px] font-bold uppercase tabular-nums text-muted">
                {r?.state === 'up' ? `${r.ms} ms` : r?.state ?? '—'}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="flex-none pt-1 text-[9px] font-bold uppercase leading-tight text-muted/70">
        Browser probe: "up" = host reachable (CORS-opaque)
      </div>
    </div>
  );
}
