import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import type { Widget } from '../types';

// Full Excalidraw editor: shapes, arrows, text, freehand, and its own
// built-in export dialog (PNG / SVG / clipboard) via the menu in the
// top-left — no custom export code needed, it already does this.
export function Whiteboard(_: { widget: Widget }) {
  return (
    <div className="h-full w-full">
      <Excalidraw />
    </div>
  );
}
