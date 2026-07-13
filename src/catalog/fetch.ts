// Generic fetch engine for API-driven widgets: URL templating, optional CORS
// proxy, named transforms for awkward payloads, and full adapters for
// multi-step sources (geocoding, Yahoo Finance via proxy, watchlists, ...).

import type { ApiSpec, DisplayData, DisplayMap } from './types';
import { cfgPath, formatValue, getNumber, getPath, getString, resolveStr, template } from './paths';

export const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export function proxied(url: string): string {
  return CORS_PROXY + encodeURIComponent(url);
}

type Cfg = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Declarative mapping: raw JSON -> DisplayData
// ---------------------------------------------------------------------------

function toDelta(n: number | undefined, suffix = '%'): { text: string; dir: 'up' | 'down' | 'flat' } | undefined {
  if (n === undefined) return undefined;
  const dir = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  return { text: `${n > 0 ? '+' : ''}${formatValue(n, { digits: 2 })}${suffix}`, dir };
}

export function mapData(map: DisplayMap, json: unknown, config: Cfg): DisplayData {
  const r = (spec: string | undefined) => resolveStr(json, spec === undefined ? undefined : cfgPath(spec, config));

  switch (map.kind) {
    case 'stat': {
      const raw = getPath(json, cfgPath(map.value, config));
      return {
        kind: 'stat',
        value: formatValue(raw, map),
        label: r(map.label),
        sub: r(map.sub),
        delta: toDelta(getNumber(json, map.delta ? cfgPath(map.delta, config) : undefined), map.deltaSuffix),
      };
    }
    case 'list': {
      const arr = getPath(json, cfgPath(map.root, config));
      const items = (Array.isArray(arr) ? arr : []).slice(0, map.limit ?? 8).map((item) => ({
        title: resolveStr(item, map.title) ?? '—',
        sub: resolveStr(item, map.sub),
        value: map.value !== undefined ? formatValue(getPath(item, map.value), map) : undefined,
        link: resolveStr(item, map.link),
        image: resolveStr(item, map.image),
      }));
      return { kind: 'list', items };
    }
    case 'table': {
      const rows = map.rows.map((row): [string, string] => {
        const raw = getPath(json, cfgPath(row.path, config));
        const val = typeof raw === 'number' ? formatValue(raw, { digits: row.digits }) : (resolveStr(json, cfgPath(row.path, config)) ?? '—');
        return [row.label, `${val}${row.suffix ?? ''}`];
      });
      return { kind: 'table', rows };
    }
    case 'text':
      return { kind: 'text', text: r(map.text) ?? '—', attribution: r(map.attribution) };
    case 'image':
      return { kind: 'image', src: r(map.src) ?? '', caption: r(map.caption), link: r(map.link) };
    case 'chart': {
      const arr = getPath(json, cfgPath(map.points, config));
      const points = (Array.isArray(arr) ? arr : [])
        .map((p) => (typeof p === 'number' ? p : getNumber(p, map.pointsKey ?? '')))
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
      const cur = map.current ? getPath(json, cfgPath(map.current, config)) : points[points.length - 1];
      return {
        kind: 'chart',
        points,
        label: r(map.label),
        current: cur === undefined ? undefined : formatValue(cur, map),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Transforms: reshape awkward payloads before declarative mapping
// ---------------------------------------------------------------------------

function decodeEntities(s: string): string {
  const doc = new DOMParser().parseFromString(s, 'text/html');
  return doc.documentElement.textContent ?? s;
}

const TRANSFORMS: Record<string, (json: unknown, config: Cfg) => unknown> = {
  // { result: { XXBTZUSD: {...} } } -> first value of result
  firstResult(json) {
    const result = getPath(json, 'result') as Record<string, unknown> | undefined;
    const first = result ? Object.values(result)[0] : undefined;
    return first ?? {};
  },
  // frankfurter latest: rates object -> items array
  fxRates(json) {
    const rates = (getPath(json, 'rates') ?? {}) as Record<string, number>;
    const base = getString(json, 'base') ?? '';
    return { items: Object.entries(rates).map(([k, v]) => ({ title: k, value: v, sub: `per 1 ${base}` })) };
  },
  // frankfurter time series: rates {date: {TO: v}} -> points sorted by date
  fxSeries(json, config) {
    const rates = (getPath(json, 'rates') ?? {}) as Record<string, Record<string, number>>;
    const to = String(config.to ?? 'USD');
    const days = Object.keys(rates).sort();
    const points = days.map((d) => rates[d]?.[to]).filter((n) => typeof n === 'number');
    return { points, current: points[points.length - 1], label: `${config.from ?? ''}/${to} — 30 days` };
  },
  // opentdb: decode HTML entities into a Q/A text
  trivia(json) {
    const q = getString(json, 'results.0.question');
    const a = getString(json, 'results.0.correct_answer');
    const cat = getString(json, 'results.0.category');
    return { text: q ? `${decodeEntities(q)}\n\nAnswer: ${decodeEntities(a ?? '')}` : 'No question', attribution: cat };
  },
  // DefiLlama /v2/chains: top chains by TVL
  llamaChains(json) {
    const arr = (Array.isArray(json) ? json : []) as { name: string; tvl: number }[];
    const top = [...arr].sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0)).slice(0, 10);
    return { items: top.map((c) => ({ title: c.name, value: c.tvl })) };
  },
  // ESPN scoreboard -> list of games with scores
  espnScores(json) {
    const events = (getPath(json, 'events') ?? []) as unknown[];
    return {
      items: events.slice(0, 8).map((ev) => {
        const comps = (getPath(ev, 'competitions.0.competitors') ?? []) as unknown[];
        const score = comps
          .map((c) => `${getString(c, 'team.abbreviation') ?? '?'} ${getString(c, 'score') ?? ''}`)
          .join(' — ');
        return {
          title: getString(ev, 'shortName') ?? getString(ev, 'name') ?? 'Game',
          value: score,
          sub: getString(ev, 'status.type.detail'),
        };
      }),
    };
  },
  // bundlephobia bytes -> KB stat
  bundlephobia(json, config) {
    const gzip = getNumber(json, 'gzip') ?? 0;
    const size = getNumber(json, 'size') ?? 0;
    return {
      kb: (gzip / 1024).toFixed(1),
      sub: `${(size / 1024).toFixed(1)} kB minified — ${config.pkg ?? ''}`,
    };
  },
  // Art Institute of Chicago search -> IIIF image URL
  articImage(json) {
    const hit = getPath(json, 'data.0');
    const imageId = getString(hit, 'image_id');
    return {
      src: imageId ? `https://www.artic.edu/iiif/2/${imageId}/full/600,/0/default.jpg` : '',
      caption: `${getString(hit, 'title') ?? ''} — ${getString(hit, 'artist_display') ?? ''}`,
    };
  },
  // StackExchange titles carry HTML entities
  decodeTitles(json) {
    const items = (getPath(json, 'items') ?? []) as Record<string, unknown>[];
    return { items: items.map((it) => ({ ...it, title: decodeEntities(String(it.title ?? '')) })) };
  },
  // Open-Meteo daily forecast: zip parallel arrays into list items
  forecastDays(json) {
    const time = (getPath(json, 'daily.time') ?? []) as string[];
    const max = (getPath(json, 'daily.temperature_2m_max') ?? []) as number[];
    const min = (getPath(json, 'daily.temperature_2m_min') ?? []) as number[];
    return {
      items: time.map((d, i) => ({
        title: new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        value: `${Math.round(max[i])}° / ${Math.round(min[i])}°`,
      })),
    };
  },
};

// ---------------------------------------------------------------------------
// Adapters: full custom fetch flows
// ---------------------------------------------------------------------------

async function fetchJson(url: string, signal: AbortSignal, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function geocode(city: string, signal: AbortSignal): Promise<{ lat: number; lon: number; place: string }> {
  const geo = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
    signal,
  );
  const hit = getPath(geo, 'results.0');
  if (!hit) throw new Error(`Couldn't find "${city}"`);
  return {
    lat: getNumber(hit, 'latitude')!,
    lon: getNumber(hit, 'longitude')!,
    place: [getString(hit, 'name'), getString(hit, 'country_code')].filter(Boolean).join(', '),
  };
}

async function yahooChart(symbol: string, range: string, interval: string, signal: AbortSignal): Promise<unknown> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const json = await fetchJson(proxied(url), signal);
  const result = getPath(json, 'chart.result.0');
  if (!result) throw new Error(getString(json, 'chart.error.description') ?? 'No data for symbol');
  return result;
}

const ADAPTERS: Record<string, (config: Cfg, params: Cfg, signal: AbortSignal) => Promise<DisplayData>> = {
  // Geocode config.city, then fetch an Open-Meteo URL template and map it.
  // params: { url (with {lat}/{lon}), map }
  async openMeteo(config, params, signal) {
    const city = String(config.city ?? 'San Francisco');
    const { lat, lon, place } = await geocode(city, signal);
    const url = template(String(params.url), { ...config, lat, lon });
    let json = (await fetchJson(url, signal)) as Record<string, unknown>;
    if (params.transform) json = TRANSFORMS[String(params.transform)](json, config) as Record<string, unknown>;
    json._place = place;
    return mapData(params.map as DisplayMap, json, config);
  },

  // Yahoo Finance quote via CORS proxy. params: { mode: 'stat' | 'chart' }
  async yahoo(config, params, signal) {
    const symbol = String(config.symbol ?? 'AAPL');
    if (params.mode === 'chart') {
      const result = await yahooChart(symbol, String(config.range ?? '1mo'), String(config.range ?? '1mo') === '1d' ? '5m' : '1d', signal);
      const closes = ((getPath(result, 'indicators.quote.0.close') ?? []) as (number | null)[])
        .filter((n): n is number => typeof n === 'number');
      const price = getNumber(result, 'meta.regularMarketPrice');
      return {
        kind: 'chart',
        points: closes,
        label: `${getString(result, 'meta.symbol') ?? symbol} — ${config.range ?? '1mo'}`,
        current: price !== undefined ? formatValue(price, {}) : undefined,
      };
    }
    const result = await yahooChart(symbol, '1d', '5m', signal);
    const price = getNumber(result, 'meta.regularMarketPrice');
    const prev = getNumber(result, 'meta.chartPreviousClose') ?? getNumber(result, 'meta.previousClose');
    const pct = price !== undefined && prev ? ((price - prev) / prev) * 100 : undefined;
    return {
      kind: 'stat',
      value: formatValue(price, {}),
      label: getString(result, 'meta.symbol') ?? symbol,
      sub: [getString(result, 'meta.fullExchangeName') ?? getString(result, 'meta.exchangeName'), getString(result, 'meta.currency')]
        .filter(Boolean)
        .join(' — '),
      delta: pct === undefined ? undefined : { text: `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%`, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' },
    };
  },

  // Comma-separated symbols -> list of quotes (Yahoo via proxy).
  async watchlist(config, _params, signal) {
    const symbols = String(config.symbols ?? 'AAPL,MSFT,GOOG')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 8);
    const results = await Promise.allSettled(symbols.map((s) => yahooChart(s, '1d', '1d', signal)));
    return {
      kind: 'list',
      items: results.map((r, i) => {
        if (r.status === 'rejected') return { title: symbols[i], sub: 'no data' };
        const price = getNumber(r.value, 'meta.regularMarketPrice');
        const prev = getNumber(r.value, 'meta.chartPreviousClose');
        const pct = price !== undefined && prev ? ((price - prev) / prev) * 100 : undefined;
        return {
          title: symbols[i],
          value: formatValue(price, {}),
          sub: pct === undefined ? undefined : `${pct > 0 ? '▲ +' : pct < 0 ? '▼ ' : ''}${pct.toFixed(2)}%`,
        };
      }),
    };
  },

  // npm registry + weekly downloads, two calls.
  async npmPackage(config, _params, signal) {
    const pkg = String(config.pkg ?? 'react');
    const [meta, dl] = await Promise.all([
      fetchJson(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, signal),
      fetchJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(pkg)}`, signal).catch(() => null),
    ]);
    return {
      kind: 'table',
      rows: [
        ['Package', getString(meta, 'name') ?? pkg],
        ['Latest', getString(meta, 'dist-tags.latest') ?? '—'],
        ['Weekly downloads', formatValue(getNumber(dl, 'downloads'), {})],
        ['License', getString(meta, 'license') ?? '—'],
      ],
    };
  },

  // Met Museum: random artwork with an image, two calls.
  async metArt(config, _params, signal) {
    const q = String(config.query ?? 'painting');
    const search = await fetchJson(
      `https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q=${encodeURIComponent(q)}`,
      signal,
    );
    const ids = (getPath(search, 'objectIDs') ?? []) as number[];
    if (!ids.length) throw new Error('No artworks found');
    const id = ids[Math.floor(Math.random() * Math.min(ids.length, 80))];
    const obj = await fetchJson(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`, signal);
    const src = getString(obj, 'primaryImageSmall') || getString(obj, 'primaryImage');
    if (!src) throw new Error('Artwork has no image — refresh');
    return {
      kind: 'image',
      src,
      caption: [getString(obj, 'title'), getString(obj, 'artistDisplayName')].filter(Boolean).join(' — '),
      link: getString(obj, 'objectURL'),
    };
  },
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function runApi(api: ApiSpec, config: Cfg, signal: AbortSignal): Promise<DisplayData> {
  if (api.adapter) {
    const adapter = ADAPTERS[api.adapter];
    if (!adapter) throw new Error(`Unknown adapter ${api.adapter}`);
    return adapter(config, api.adapterParams ?? {}, signal);
  }

  // Direct image: no fetch at all, src is a URL template.
  if (api.map?.kind === 'image' && api.map.direct) {
    return { kind: 'image', src: template(api.map.src, config), caption: api.map.caption ? template(api.map.caption, config) : undefined };
  }

  let url = template(api.url, config);
  if (api.proxy) url = proxied(url);

  const res = await fetch(url, {
    method: api.method ?? 'GET',
    headers: api.headers,
    body: api.body ? template(api.body, config) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  let json: unknown = api.parse === 'text' ? await res.text() : await res.json();
  if (api.transform) {
    const t = TRANSFORMS[api.transform];
    if (!t) throw new Error(`Unknown transform ${api.transform}`);
    json = t(json, config);
  }
  if (!api.map) throw new Error('Entry has no display map');
  return mapData(api.map, json, config);
}
