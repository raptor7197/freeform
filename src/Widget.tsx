import { useEffect, useRef, useState, type ComponentType } from 'react';
import interact from 'interactjs';
import { useDashboard } from './store';
import type { Widget as WidgetModel } from './types';
import { CATALOG_BY_ID } from './catalog';
import type { Category } from './catalog/types';
import { Clock } from './widgets/Clock';
import { Weather } from './widgets/Weather';
import { Notes } from './widgets/Notes';
import { ApiWidget } from './widgets/ApiWidget';
import {
  Countdown, LinkBoard, MonthCalendar, MoonPhase, Pomodoro, Stopwatch, Tally, Todo, WorldClock,
} from './widgets/productivity';
import { CustomApi, Embed, RssReader, StatusMonitor, WebhookButtons, WsLive } from './widgets/integrations';
import { Whiteboard } from './widgets/Whiteboard';
import { ConfigPanel } from './ConfigPanel';

// Bespoke widget bodies, keyed by CatalogEntry.builtin.
const BUILTIN: Record<string, ComponentType<{ widget: WidgetModel }>> = {
  whiteboard: Whiteboard,
  clock: Clock,
  weather: Weather,
  notes: Notes,
  worldclock: WorldClock,
  todo: Todo,
  countdown: Countdown,
  pomodoro: Pomodoro,
  stopwatch: Stopwatch,
  calendar: MonthCalendar,
  links: LinkBoard,
  tally: Tally,
  moon: MoonPhase,
  customapi: CustomApi,
  webhook: WebhookButtons,
  wslive: WsLive,
  rss: RssReader,
  embed: Embed,
  statusmon: StatusMonitor,
};

const CATEGORY_GLYPH: Record<Category, string> = {
  Markets: '↗',
  Crypto: '₿',
  News: '¶',
  Developer: '</>',
  Weather: '☂',
  'Space & Science': '✦',
  Sports: '◉',
  Fun: '☻',
  'Food & Drink': '♨',
  Knowledge: '?',
  Images: '▣',
  Productivity: '✎',
  Integrations: '⚡',
};

export function WidgetFrame({ widget }: { widget: WidgetModel }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: widget.x, y: widget.y });
  const size = useRef({ width: widget.width, height: widget.height });
  const moveWidget = useDashboard((s) => s.moveWidget);
  const resizeWidget = useDashboard((s) => s.resizeWidget);
  const removeWidget = useDashboard((s) => s.removeWidget);
  const togglePin = useDashboard((s) => s.togglePin);
  const bringToFront = useDashboard((s) => s.bringToFront);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Keep the drag baseline in sync with the committed store position so a
  // drag always starts from where the widget currently is.
  pos.current.x = widget.x;
  pos.current.y = widget.y;
  size.current.width = widget.width;
  size.current.height = widget.height;

  useEffect(() => {
    if (widget.pinned) return; // pinned: no drag, no resize
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
            max: { width: 1400, height: 1000 },
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
  }, [widget.id, widget.pinned, moveWidget, resizeWidget]);

  const entry = CATALOG_BY_ID[widget.type];
  const title = (widget.config.title as string) || entry?.name || widget.type;
  const glyph = entry ? CATEGORY_GLYPH[entry.category] : '?';
  const configurable = !!entry && (!!entry.fields?.length || !!entry.api);
  const bare = entry?.builtin === 'whiteboard'; // owns its own canvas/toolbar chrome

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
      <div
        className={`widget-header flex-none flex items-center justify-between gap-3 border-b-2 border-brdr bg-card px-3 py-2 ${widget.pinned ? '!cursor-default' : ''}`}
      >
        <span className="widget-tab min-w-0">
          <span className="flex-none" aria-hidden="true">{glyph}</span>
          <span className="truncate">{title}</span>
        </span>
        <div className="flex flex-none items-center gap-2.5">
          {!widget.pinned && <span className="widget-drag-dots" aria-hidden="true" />}
          <button
            type="button"
            className={`widget-action widget-gear widget-pin ${widget.pinned ? 'widget-pin-active' : ''}`}
            aria-label={widget.pinned ? `Unpin ${title}` : `Pin ${title}`}
            aria-pressed={widget.pinned ?? false}
            title={widget.pinned ? 'Unpin (allow move/resize)' : 'Pin in place (lock move/resize)'}
            onClick={(event) => {
              event.stopPropagation();
              togglePin(widget.id);
            }}
          >
            📌
          </button>
          {configurable && (
            <button
              type="button"
              className="widget-action widget-gear"
              aria-label={`Settings for ${title}`}
              title="Widget settings"
              onClick={(event) => {
                event.stopPropagation();
                setSettingsOpen((v) => !v);
              }}
            >
              ⚙
            </button>
          )}
          <button
            type="button"
            className="widget-action widget-close-mark"
            aria-label={`Close ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              removeWidget(widget.id);
            }}
          />
        </div>
      </div>
      <div className={`relative flex-1 min-h-0 ${bare ? 'overflow-hidden' : 'overflow-auto p-4'}`}>
        {settingsOpen && entry && (
          <ConfigPanel widget={widget} entry={entry} onClose={() => setSettingsOpen(false)} />
        )}
        <WidgetBody widget={widget} />
      </div>
      {!widget.pinned && <div className="resize-handle" aria-hidden="true" />}
    </div>
  );
}

function WidgetBody({ widget }: { widget: WidgetModel }) {
  const entry = CATALOG_BY_ID[widget.type];
  if (!entry) {
    return (
      <div className="h-full flex items-center justify-center text-center text-sm font-bold uppercase text-muted">
        Unknown widget "{widget.type}"
      </div>
    );
  }
  if (entry.builtin) {
    const Body = BUILTIN[entry.builtin];
    if (Body) return <Body widget={widget} />;
  }
  if (entry.api) return <ApiWidget widget={widget} entry={entry} />;
  return <div className="h-full flex items-center justify-center text-sm font-bold uppercase text-muted">Widget has no body</div>;
}
