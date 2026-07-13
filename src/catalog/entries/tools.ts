import type { CatalogEntry } from '../types';

// Local productivity widgets (no network) and the integration toolkit:
// custom REST calls, webhooks, WebSockets, RSS, embeds, and uptime checks.

export const PRODUCTIVITY: CatalogEntry[] = [
  {
    id: 'whiteboard', name: 'Whiteboard', category: 'Productivity', source: 'Excalidraw',
    description: 'Full sketching canvas — shapes, arrows, text, freehand. Export to PNG/SVG from its own menu.',
    builtin: 'whiteboard', defaultSize: { w: 720, h: 540 },
  },
  {
    id: 'clock', name: 'Clock', category: 'Productivity', source: 'local',
    description: 'Analog + digital clock, any time zone.',
    builtin: 'clock',
    fields: [{ key: 'timeZone', label: 'Time zone', type: 'text', placeholder: 'e.g. Asia/Kolkata (blank = local)' }],
    defaultSize: { w: 330, h: 210 },
  },
  {
    id: 'world-clock', name: 'World Clock', category: 'Productivity', source: 'local',
    description: 'Several time zones side by side.',
    builtin: 'worldclock',
    fields: [{ key: 'zones', label: 'Zones (comma-separated)', type: 'text', default: 'America/New_York, Europe/London, Asia/Kolkata, Asia/Tokyo' }],
    defaultSize: { w: 360, h: 320 },
  },
  {
    id: 'notes', name: 'Quick Notes', category: 'Productivity', source: 'local',
    description: 'Ruled paper for fast jottings — saved locally.',
    builtin: 'notes', defaultSize: { w: 400, h: 480 },
  },
  {
    id: 'todo', name: 'To-Do List', category: 'Productivity', source: 'local',
    description: 'Checklist with add/complete/remove — saved locally.',
    builtin: 'todo', defaultSize: { w: 360, h: 420 },
  },
  {
    id: 'countdown', name: 'Countdown', category: 'Productivity', source: 'local',
    description: 'Days/hours/minutes until a date that matters.',
    builtin: 'countdown',
    fields: [
      { key: 'target', label: 'Target date & time', type: 'text', default: '2027-01-01T00:00', help: 'YYYY-MM-DDTHH:MM' },
      { key: 'label', label: 'Label', type: 'text', default: 'New Year' },
    ],
    defaultSize: { w: 360, h: 240 },
  },
  {
    id: 'pomodoro', name: 'Pomodoro Timer', category: 'Productivity', source: 'local',
    description: 'Classic 25/5 focus timer with pause and reset.',
    builtin: 'pomodoro',
    fields: [
      { key: 'work', label: 'Work minutes', type: 'number', default: 25 },
      { key: 'rest', label: 'Break minutes', type: 'number', default: 5 },
    ],
    defaultSize: { w: 330, h: 260 },
  },
  {
    id: 'stopwatch', name: 'Stopwatch', category: 'Productivity', source: 'local',
    description: 'Start/stop/lap stopwatch.',
    builtin: 'stopwatch', defaultSize: { w: 330, h: 260 },
  },
  {
    id: 'calendar', name: 'Month Calendar', category: 'Productivity', source: 'local',
    description: 'Current month at a glance with today highlighted.',
    builtin: 'calendar', defaultSize: { w: 360, h: 340 },
  },
  {
    id: 'links', name: 'Link Board', category: 'Productivity', source: 'local',
    description: 'Pin your most-used links — one per line.',
    builtin: 'links',
    fields: [{ key: 'raw', label: 'Links (Name | URL per line)', type: 'textarea', default: 'GitHub | https://github.com\nGmail | https://mail.google.com\nCalendar | https://calendar.google.com' }],
    defaultSize: { w: 340, h: 340 },
  },
  {
    id: 'tally', name: 'Tally Counter', category: 'Productivity', source: 'local',
    description: 'Click counter for anything worth counting.',
    builtin: 'tally',
    fields: [{ key: 'label', label: 'Counting what?', type: 'text', default: 'Coffees' }],
    defaultSize: { w: 300, h: 240 },
  },
];

export const INTEGRATIONS: CatalogEntry[] = [
  {
    id: 'custom-api', name: 'Custom API Call', category: 'Integrations', source: 'your endpoint',
    description: 'Call ANY REST endpoint — method, headers, body, JSON-path extraction, optional CORS proxy. The universal connector.',
    builtin: 'customapi',
    fields: [
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/v1/status' },
      { key: 'method', label: 'Method', type: 'select', default: 'GET', options: [
        { value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' }, { value: 'DELETE', label: 'DELETE' },
      ] },
      { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer …"}' },
      { key: 'body', label: 'Request body', type: 'textarea', placeholder: '{"query": "…"} (POST/PUT only)' },
      { key: 'path', label: 'JSON path to display', type: 'text', placeholder: 'data.items.0.name (blank = whole response)' },
      { key: 'label', label: 'Value label', type: 'text', placeholder: 'What is this number?' },
      { key: 'refreshSec', label: 'Refresh (seconds)', type: 'number', default: 60 },
      { key: 'proxy', label: 'Route via CORS proxy', type: 'checkbox', default: false },
    ],
    defaultSize: { w: 420, h: 340 }, tags: ['universal'],
  },
  {
    id: 'webhook-button', name: 'Webhook Buttons', category: 'Integrations', source: 'your endpoint',
    description: 'One-click buttons that POST to any webhook — Slack, Discord, Zapier, IFTTT, n8n, Make, Home Assistant.',
    builtin: 'webhook',
    fields: [
      { key: 'buttons', label: 'Buttons (Name | URL | JSON body per line)', type: 'textarea',
        default: 'Ping team | https://hooks.slack.com/services/XXX | {"text":"Ping from Freeform"}',
        help: 'One button per line: label | webhook URL | JSON payload' },
    ],
    defaultSize: { w: 380, h: 300 }, tags: ['universal'],
  },
  {
    id: 'websocket-feed', name: 'WebSocket Live Feed', category: 'Integrations', source: 'your stream',
    description: 'Subscribe to any wss:// stream and watch messages live. Optional JSON path + subscribe message.',
    builtin: 'wslive',
    fields: [
      { key: 'url', label: 'WebSocket URL', type: 'text', placeholder: 'wss://stream.example.com/feed' },
      { key: 'sub', label: 'Subscribe message (sent on open)', type: 'textarea', placeholder: '{"op":"subscribe","channel":"ticker"}' },
      { key: 'path', label: 'JSON path to display', type: 'text', placeholder: 'data.price (blank = raw message)' },
      { key: 'label', label: 'Label', type: 'text', placeholder: 'Live value' },
    ],
    defaultSize: { w: 400, h: 300 }, tags: ['live', 'universal'],
  },
  {
    id: 'rss-reader', name: 'RSS / Atom Reader', category: 'Integrations', source: 'any feed',
    description: 'Read any RSS or Atom feed — blogs, podcasts, releases, status pages.',
    builtin: 'rss',
    fields: [{ key: 'url', label: 'Feed URL', type: 'text', placeholder: 'https://example.com/feed.xml' }],
    defaultSize: { w: 400, h: 440 }, tags: ['universal'],
  },
  {
    id: 'embed', name: 'Website Embed', category: 'Integrations', source: 'any URL',
    description: 'Embed a live web page — Grafana panels, Google Sheets, YouTube, docs. (Some sites refuse framing.)',
    builtin: 'embed',
    fields: [{ key: 'url', label: 'Page URL', type: 'text', placeholder: 'https://…' }],
    defaultSize: { w: 520, h: 420 }, tags: ['universal'],
  },
  {
    id: 'status-monitor', name: 'Uptime Monitor', category: 'Integrations', source: 'your services',
    description: 'Ping your sites/APIs from the browser and show reachability + latency.',
    builtin: 'statusmon',
    fields: [
      { key: 'targets', label: 'Targets (Name | URL per line)', type: 'textarea',
        default: 'Example | https://example.com\nGitHub | https://github.com' },
      { key: 'refreshSec', label: 'Check every (seconds)', type: 'number', default: 60 },
    ],
    defaultSize: { w: 380, h: 340 },
  },
];
