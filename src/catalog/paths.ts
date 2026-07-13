// Tiny JSON-path getter + URL templating + number formatting for the widget
// engine. Paths are dot/bracket chains: "results.0.name" or "results[0].name".
// A leading "=" makes the string a literal instead of a path.

export function getPath(obj: unknown, path: string): unknown {
  if (path === '' || path === '$') return obj;
  if (path.startsWith('=')) return path.slice(1);
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function getString(obj: unknown, path: string | undefined): string | undefined {
  if (path === undefined) return undefined;
  const v = getPath(obj, path);
  if (v === undefined || v === null) return undefined;
  return typeof v === 'string' ? v : String(v);
}

export function getNumber(obj: unknown, path: string | undefined): number | undefined {
  if (path === undefined) return undefined;
  const v = getPath(obj, path);
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

function isoDay(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/**
 * Substitute {key} with encoded config values. Built-in vars: {_ts} cache
 * buster, {_today}/{_d7}/{_d30} ISO dates, {_yyyy}/{_mm}/{_dd} today's parts.
 */
export function template(str: string, config: Record<string, unknown>): string {
  return str.replace(/\{(\w+)\}/g, (_, key: string) => {
    switch (key) {
      case '_ts': return String(Date.now());
      case '_today': return isoDay();
      case '_d7': return isoDay(-7);
      case '_d30': return isoDay(-30);
      case '_yyyy': return isoDay().slice(0, 4);
      case '_mm': return isoDay().slice(5, 7);
      case '_dd': return isoDay().slice(8, 10);
    }
    const v = config[key];
    return v === undefined || v === null ? '' : encodeURIComponent(String(v));
  });
}

/** Substitute <key> with raw (unencoded) config values — used inside JSON paths. */
export function cfgPath(spec: string, config: Record<string, unknown>): string {
  return spec.replace(/<(\w+)>/g, (_, key: string) => String(config[key] ?? ''));
}

/**
 * Resolve a string spec against a JSON object:
 *  - "=literal text"        → literal (may contain {path} templates)
 *  - "Hello {a.b}, {c}"     → template, each {path} looked up in obj
 *  - "a.b.c"                → plain path lookup
 */
export function resolveStr(obj: unknown, spec: string | undefined): string | undefined {
  if (spec === undefined) return undefined;
  let s = spec;
  if (s.startsWith('=')) {
    s = s.slice(1);
    if (!s.includes('{')) return s;
  }
  if (s.includes('{')) {
    return s.replace(/\{([^}]+)\}/g, (_, p: string) => getString(obj, p) ?? '');
  }
  return getString(obj, s);
}

export function fmtNumber(n: number, digits?: number): string {
  const abs = Math.abs(n);
  if (digits === undefined) {
    if (abs >= 1_000_000) return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
    digits = abs >= 100 ? 0 : abs >= 1 ? 2 : 4;
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n);
}

export function formatValue(
  raw: unknown,
  opts: { format?: string; prefix?: string; suffix?: string; digits?: number } = {},
): string {
  let out: string;
  const n = typeof raw === 'string' ? parseFloat(raw) : (raw as number);
  if (opts.format === 'raw' || typeof n !== 'number' || !Number.isFinite(n)) {
    out = raw === undefined || raw === null ? '—' : String(raw);
  } else if (opts.format === 'percent') {
    out = `${fmtNumber(n, opts.digits ?? 2)}%`;
  } else {
    out = fmtNumber(n, opts.digits);
  }
  return `${opts.prefix ?? ''}${out}${opts.suffix ?? ''}`;
}
