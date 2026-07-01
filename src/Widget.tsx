import { useEffect, useRef, type ComponentType } from 'react';
import interact from 'interactjs';
import { useDashboard } from './store';
import type { Widget as WidgetModel, WidgetType } from './types';
import { Clock } from './widgets/Clock';
import { Weather } from './widgets/Weather';
import { Notes } from './widgets/Notes';

const BODIES: Record<WidgetType, ComponentType<{ widget: WidgetModel }>> = {
  clock: Clock,
  weather: Weather,
  notes: Notes,
};

const TITLES: Record<WidgetType, string> = {
  clock: 'Clock',
  weather: 'Weather',
  notes: 'Quick Notes',
};

const ICONS: Record<WidgetType, JSX.Element> = {
  clock: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  ),
  weather: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M8 18h9a4 4 0 0 0 0-8 5 5 0 0 0-9.7 1.6A3.4 3.4 0 0 0 8 18Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M6 4h10l2 2v14H6Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M9 10h6M9 14h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
    </svg>
  ),
};

export function WidgetFrame({ widget }: { widget: WidgetModel }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: widget.x, y: widget.y });
  const size = useRef({ width: widget.width, height: widget.height });
  const moveWidget = useDashboard((s) => s.moveWidget);
  const resizeWidget = useDashboard((s) => s.resizeWidget);
  const removeWidget = useDashboard((s) => s.removeWidget);
  const bringToFront = useDashboard((s) => s.bringToFront);

  // Keep the drag baseline in sync with the committed store position so a
  // drag always starts from where the widget currently is.
  pos.current.x = widget.x;
  pos.current.y = widget.y;
  size.current.width = widget.width;
  size.current.height = widget.height;

  useEffect(() => {
    const el = ref.current!;
    const interactable = interact(el)
      .draggable({
        // Only the header bar starts a move; body content (inputs, text) is free.
        allowFrom: '.widget-header',
        ignoreFrom: 'button, input, textarea, .resize-handle',
        listeners: {
          move(event) {
            pos.current.x += event.dx;
            pos.current.y += event.dy;
            el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
          },
          end() {
            moveWidget(widget.id, Math.round(pos.current.x), Math.round(pos.current.y));
          },
        },
      })
      .resizable({
        edges: { right: true, bottom: true },
        margin: 10,
        modifiers: [
          interact.modifiers.restrictSize({
            min: { width: 240, height: 170 },
            max: { width: 900, height: 720 },
          }),
        ],
        listeners: {
          move(event) {
            size.current.width = event.rect.width;
            size.current.height = event.rect.height;
            el.style.width = `${event.rect.width}px`;
            el.style.height = `${event.rect.height}px`;
          },
          end() {
            resizeWidget(widget.id, size.current.width, size.current.height);
          },
        },
      });
    return () => interactable.unset();
  }, [widget.id, moveWidget, resizeWidget]);

  const Body = BODIES[widget.type];

  return (
    <div
      ref={ref}
      className="widget-shell absolute top-0 left-0 flex flex-col overflow-hidden touch-none"
      style={{
        transform: `translate(${widget.x}px, ${widget.y}px)`,
        width: widget.width,
        height: widget.height,
        zIndex: widget.zIndex,
      }}
      onPointerDown={() => bringToFront(widget.id)}
    >
      <div className="widget-header flex-none flex items-center justify-between gap-3 border-b-2 border-brdr bg-card px-3 py-2">
        <span className="widget-tab">
          {ICONS[widget.type]}
          {TITLES[widget.type]}
        </span>
        <div className="flex items-center gap-3">
          <span className="widget-drag-dots" aria-hidden="true" />
          <button
            type="button"
            className="widget-action widget-close-mark"
            aria-label={`Close ${TITLES[widget.type]}`}
            onClick={(event) => {
              event.stopPropagation();
              removeWidget(widget.id);
            }}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <Body widget={widget} />
      </div>
      <div className="resize-handle" aria-hidden="true" />
    </div>
  );
}
