import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Widget, WidgetType } from './types';
import { CATALOG_BY_ID, defaultConfig } from './catalog';

let uidCounter = 0;
function uid(type: string): string {
  return `${type}-${Date.now().toString(36)}-${uidCounter++}`;
}

function makeWidget(type: WidgetType, patch: Partial<Widget> = {}): Widget {
  const entry = CATALOG_BY_ID[type];
  return {
    id: patch.id ?? uid(type),
    type,
    x: patch.x ?? 70,
    y: patch.y ?? 70,
    width: patch.width ?? entry?.defaultSize?.w ?? 360,
    height: patch.height ?? entry?.defaultSize?.h ?? 300,
    zIndex: patch.zIndex ?? 1,
    config: patch.config ?? (entry ? defaultConfig(entry) : {}),
  };
}

// Matches the canvas-stage size in Canvas.tsx.
const CANVAS_W = 4000;
const CANVAS_H = 3000;
const GRID_STEP = 24;
const GAP = 14; // breathing room between widgets

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  gap: number,
): boolean {
  return ax < bx + bw + gap && ax + aw + gap > bx && ay < by + bh + gap && ay + ah + gap > by;
}

/** First empty grid cell (scanning top-left to bottom-right) that fits w×h without overlapping any existing widget. */
function findFreeSpot(existing: Widget[], w: number, h: number): { x: number; y: number } {
  const maxX = Math.max(GRID_STEP, CANVAS_W - w - GRID_STEP);
  const maxY = Math.max(GRID_STEP, CANVAS_H - h - GRID_STEP);
  for (let y = GRID_STEP; y <= maxY; y += GRID_STEP) {
    for (let x = GRID_STEP; x <= maxX; x += GRID_STEP) {
      const free = existing.every((ex) => !rectsOverlap(x, y, w, h, ex.x, ex.y, ex.width, ex.height, GAP));
      if (free) return { x, y };
    }
  }
  // Canvas is packed solid — cascade so the widget still lands somewhere visible.
  const offset = existing.length % 10;
  return { x: GRID_STEP + offset * 40, y: GRID_STEP + offset * 32 };
}

// First-run layout: a taste of the catalog.
const DEFAULT_WIDGETS: Widget[] = [
  makeWidget('whiteboard', { id: 'whiteboard-1', x: 50, y: 50, zIndex: 1 }),
  makeWidget('clock', { id: 'clock-1', x: 800, y: 50, zIndex: 2 }),
  makeWidget('weather', { id: 'weather-1', x: 800, y: 290, zIndex: 3 }),
  makeWidget('notes', { id: 'notes-1', x: 1160, y: 50, zIndex: 4 }),
  makeWidget('crypto-price', { id: 'crypto-1', x: 50, y: 620, zIndex: 5 }),
  makeWidget('hn-top', { id: 'hn-1', x: 410, y: 620, zIndex: 6 }),
];

// CSS-filter knobs applied to the background image (not the widgets).
export interface CanvasFilters {
  blur: number; // px
  grayscale: number; // 0..1  (1 = full black & white)
  brightness: number; // 1 = unchanged
  contrast: number; // 1 = unchanged
  saturate: number; // 1 = unchanged
  hueRotate: number; // deg 0..360 (recolor)
}

export const DEFAULT_FILTERS: CanvasFilters = {
  blur: 0,
  grayscale: 0,
  brightness: 1,
  contrast: 1,
  saturate: 1,
  hueRotate: 0,
};

export function filtersToCss(f: CanvasFilters): string {
  return [
    `blur(${f.blur}px)`,
    `grayscale(${f.grayscale})`,
    `brightness(${f.brightness})`,
    `contrast(${f.contrast})`,
    `saturate(${f.saturate})`,
    `hue-rotate(${f.hueRotate}deg)`,
  ].join(' ');
}

export type CanvasBgKind = 'image' | 'video' | 'shader';

interface DashboardState {
  widgets: Widget[];
  canvasBg: string | null; // data URL (image) or object URL (video), or null for the grid
  canvasBgKind: CanvasBgKind;
  canvasFilters: CanvasFilters;
  moveWidget: (id: string, x: number, y: number) => void;
  resizeWidget: (id: string, width: number, height: number) => void;
  removeWidget: (id: string) => void;
  addWidget: (type: WidgetType) => void;
  togglePin: (id: string) => void;
  bringToFront: (id: string) => void;
  updateConfig: (id: string, patch: Record<string, unknown>) => void;
  setCanvasBg: (url: string | null, kind?: CanvasBgKind) => void;
  setCanvasFilters: (patch: Partial<CanvasFilters>) => void;
  resetCanvasFilters: () => void;
}

export const useDashboard = create<DashboardState>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      canvasBg: null,
      canvasBgKind: 'image',
      canvasFilters: DEFAULT_FILTERS,

      setCanvasBg: (url, kind = 'image') => set({ canvasBg: url, canvasBgKind: kind }),

      setCanvasFilters: (patch) =>
        set((s) => ({ canvasFilters: { ...s.canvasFilters, ...patch } })),

      resetCanvasFilters: () => set({ canvasFilters: DEFAULT_FILTERS }),

      moveWidget: (id, x, y) =>
        set((s) => ({
          widgets: s.widgets.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),

      resizeWidget: (id, width, height) =>
        set((s) => ({
          widgets: s.widgets.map((w) =>
            w.id === id
              ? {
                  ...w,
                  width: Math.max(240, Math.round(width)),
                  height: Math.max(170, Math.round(height)),
                }
              : w,
          ),
        })),

      removeWidget: (id) =>
        set((s) => ({
          widgets: s.widgets.filter((w) => w.id !== id),
        })),

      addWidget: (type) =>
        set((s) => {
          const max = Math.max(0, ...s.widgets.map((w) => w.zIndex));
          const entry = CATALOG_BY_ID[type];
          const w = entry?.defaultSize?.w ?? 360;
          const h = entry?.defaultSize?.h ?? 300;
          const { x, y } = findFreeSpot(s.widgets, w, h);
          return {
            widgets: [...s.widgets, makeWidget(type, { x, y, zIndex: max + 1 })],
          };
        }),

      togglePin: (id) =>
        set((s) => ({
          widgets: s.widgets.map((w) => (w.id === id ? { ...w, pinned: !w.pinned } : w)),
        })),

      bringToFront: (id) =>
        set((s) => {
          const max = Math.max(0, ...s.widgets.map((w) => w.zIndex));
          const w = s.widgets.find((x) => x.id === id);
          if (!w || w.zIndex === max) return s; // already on top — no state churn
          return {
            widgets: s.widgets.map((x) => (x.id === id ? { ...x, zIndex: max + 1 } : x)),
          };
        }),

      updateConfig: (id, patch) =>
        set((s) => ({
          widgets: s.widgets.map((w) =>
            w.id === id ? { ...w, config: { ...w.config, ...patch } } : w,
          ),
        })),
    }),
    {
      name: 'freeform-dashboard-v1',
      partialize: (s) => ({
        widgets: s.widgets,
        // Video backgrounds are large blob/object URLs that die on reload
        // anyway, so only images persist across sessions.
        canvasBg: s.canvasBgKind === 'video' ? null : s.canvasBg,
        canvasBgKind: s.canvasBgKind === 'video' ? 'image' : s.canvasBgKind,
        canvasFilters: s.canvasFilters,
      }),
    },
  ),
);
