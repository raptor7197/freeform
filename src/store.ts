import { create } from 'zustand';
import type { Widget, WidgetType } from './types';

let nextWidgetId = 4;

function widgetDefaults(type: WidgetType): Pick<Widget, 'width' | 'height' | 'config'> {
  switch (type) {
    case 'clock':
      return { width: 330, height: 210, config: {} };
    case 'weather':
      return { width: 330, height: 270, config: { city: 'San Francisco' } };
    case 'notes':
      return {
        width: 400,
        height: 480,
        config: { text: 'Quick notes\n\nDrag me by the header. Type here to jot things down.' },
      };
  }
}

function makeWidget(type: WidgetType, patch: Partial<Widget> = {}): Widget {
  const defaults = widgetDefaults(type);
  return {
    id: patch.id ?? `${type}-${nextWidgetId++}`,
    type,
    x: patch.x ?? 70,
    y: patch.y ?? 70,
    width: patch.width ?? defaults.width,
    height: patch.height ?? defaults.height,
    zIndex: patch.zIndex ?? 1,
    config: patch.config ?? defaults.config,
  };
}

// Phase-1 default layout. Subset of the PRD OOTB layout, placed at visually
// balanced coordinates.
const DEFAULT_WIDGETS: Widget[] = [
  makeWidget('clock', { id: 'clock-1', x: 50, y: 50, zIndex: 1 }),
  makeWidget('weather', { id: 'weather-1', x: 50, y: 280, zIndex: 2 }),
  makeWidget('notes', { id: 'notes-1', x: 400, y: 50, zIndex: 3 }),
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

interface DashboardState {
  widgets: Widget[];
  canvasBg: string | null; // data URL of an uploaded background image, or null for the grid
  canvasFilters: CanvasFilters;
  moveWidget: (id: string, x: number, y: number) => void;
  resizeWidget: (id: string, width: number, height: number) => void;
  removeWidget: (id: string) => void;
  addWidget: (type: WidgetType) => void;
  bringToFront: (id: string) => void;
  updateConfig: (id: string, patch: Record<string, unknown>) => void;
  setCanvasBg: (url: string | null) => void;
  setCanvasFilters: (patch: Partial<CanvasFilters>) => void;
  resetCanvasFilters: () => void;
}

export const useDashboard = create<DashboardState>((set) => ({
  widgets: DEFAULT_WIDGETS,
  canvasBg: null,
  canvasFilters: DEFAULT_FILTERS,

  setCanvasBg: (url) => set({ canvasBg: url }),

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
      const offset = s.widgets.length % 8;
      return {
        widgets: [
          ...s.widgets,
          makeWidget(type, {
            x: 80 + offset * 42,
            y: 80 + offset * 34,
            zIndex: max + 1,
          }),
        ],
      };
    }),

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
}));
