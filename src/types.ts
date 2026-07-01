export type WidgetType = 'clock' | 'weather' | 'notes';

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  config: Record<string, unknown>;
}
