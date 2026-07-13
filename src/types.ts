// A widget's `type` is a catalog entry id (see src/catalog). The original
// three ('clock' | 'weather' | 'notes') are still valid ids.
export type WidgetType = string;

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  /** Pinned widgets can't be dragged or resized. */
  pinned?: boolean;
  config: Record<string, unknown>;
}
