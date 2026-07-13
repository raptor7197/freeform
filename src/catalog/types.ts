// Catalog & data-driven widget engine types.
//
// A catalog entry either points at a bespoke React component (`builtin`) or
// declares an HTTP API (`api`) that the generic engine fetches and maps into
// one of a small set of display shapes (stat / list / table / text / image /
// chart) rendered by ApiWidget.

export type Category =
  | 'Markets'
  | 'Crypto'
  | 'News'
  | 'Developer'
  | 'Weather'
  | 'Space & Science'
  | 'Sports'
  | 'Fun'
  | 'Food & Drink'
  | 'Knowledge'
  | 'Images'
  | 'Productivity'
  | 'Integrations';

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  default?: unknown;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
}

export type Format = 'number' | 'currency' | 'percent' | 'raw';

interface BaseMap {
  format?: Format;
  prefix?: string;
  suffix?: string;
  digits?: number;
}

export interface StatMap extends BaseMap {
  kind: 'stat';
  value: string; // json path
  label?: string; // json path or literal via "=Some text"
  sub?: string;
  delta?: string; // path to a number; sign decides direction
  deltaSuffix?: string;
}

export interface ListMap extends BaseMap {
  kind: 'list';
  root: string; // path to array
  title: string; // paths relative to each item
  sub?: string;
  value?: string;
  link?: string;
  image?: string;
  limit?: number;
}

export interface TableMap {
  kind: 'table';
  rows: { label: string; path: string; suffix?: string; digits?: number }[];
}

export interface TextMap {
  kind: 'text';
  text: string; // path
  attribution?: string;
}

export interface ImageMap {
  kind: 'image';
  src: string; // path, or with direct:true a URL template
  caption?: string;
  link?: string;
  direct?: boolean; // no fetch: src is a templated URL rendered straight into <img>
}

export interface ChartMap extends BaseMap {
  kind: 'chart';
  points: string; // path to an array
  /** If the array holds objects/tuples, path within each element to the number. */
  pointsKey?: string;
  label?: string; // path or "=literal"
  current?: string; // path to headline value
}

export type DisplayMap = StatMap | ListMap | TableMap | TextMap | ImageMap | ChartMap;

// Normalized data handed to the renderers.
export type DisplayData =
  | { kind: 'stat'; value: string; label?: string; sub?: string; delta?: { text: string; dir: 'up' | 'down' | 'flat' } }
  | { kind: 'list'; items: { title: string; sub?: string; value?: string; link?: string; image?: string }[] }
  | { kind: 'table'; rows: [string, string][] }
  | { kind: 'text'; text: string; attribution?: string }
  | { kind: 'image'; src: string; caption?: string; link?: string }
  | { kind: 'chart'; points: number[]; label?: string; current?: string };

export interface ApiSpec {
  /** URL template; {key} substitutes config values, {_ts} a cache-buster. */
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  /** Seconds between refreshes. */
  refresh: number;
  /** Route through the public CORS proxy (for APIs without CORS headers). */
  proxy?: boolean;
  parse?: 'json' | 'text';
  /** Named transform from TRANSFORMS applied to the raw payload before mapping. */
  transform?: string;
  /** Named adapter from ADAPTERS that fully replaces fetch+map. */
  adapter?: string;
  adapterParams?: Record<string, unknown>;
  map?: DisplayMap;
}

export interface CatalogEntry {
  id: string;
  name: string;
  category: Category;
  description: string;
  /** Human-readable data source, shown on the marketplace card. */
  source: string;
  builtin?: string; // key into BUILTIN component registry
  api?: ApiSpec;
  fields?: ConfigField[];
  defaultSize?: { w: number; h: number };
  /** Marketplace badges, e.g. 'live', 'key required'. */
  tags?: string[];
}
