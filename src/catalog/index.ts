import type { CatalogEntry, Category } from './types';
import { CRYPTO, MARKETS } from './entries/markets';
import { DEV, NEWS } from './entries/news';
import { SPACE, WEATHER } from './entries/science';
import { FOOD, FUN, SPORTS } from './entries/lifestyle';
import { IMAGES, KNOWLEDGE } from './entries/knowledge';
import { INTEGRATIONS, PRODUCTIVITY } from './entries/tools';

export const CATALOG: CatalogEntry[] = [
  ...PRODUCTIVITY,
  ...INTEGRATIONS,
  ...MARKETS,
  ...CRYPTO,
  ...NEWS,
  ...DEV,
  ...WEATHER,
  ...SPACE,
  ...SPORTS,
  ...FUN,
  ...FOOD,
  ...KNOWLEDGE,
  ...IMAGES,
];

export const CATALOG_BY_ID: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((e) => [e.id, e]),
);

export const CATEGORIES: Category[] = [
  'Productivity',
  'Integrations',
  'Markets',
  'Crypto',
  'News',
  'Developer',
  'Weather',
  'Space & Science',
  'Sports',
  'Fun',
  'Food & Drink',
  'Knowledge',
  'Images',
];

/** Default config for a fresh widget: every field's default value. */
export function defaultConfig(entry: CatalogEntry): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const f of entry.fields ?? []) {
    if (f.default !== undefined) config[f.key] = f.default;
  }
  return config;
}

export type { CatalogEntry, Category, ConfigField, DisplayData } from './types';
