import { useState } from 'react';
import { useDashboard } from '../store';
import type { Widget } from '../types';

export function Notes({ widget }: { widget: Widget }) {
  const updateConfig = useDashboard((s) => s.updateConfig);
  // Local state drives the textarea for snappy typing; store is kept in sync
  // so the text is ready to persist once Phase 2 wiring lands.
  const [text, setText] = useState((widget.config.text as string) ?? '');

  return (
    <div className="note-paper h-full border-l-[6px] border-accent/80 pl-4">
      <textarea
        className="studio-textarea h-full w-full resize-none border-0 bg-transparent px-1 py-0 text-[15px] font-bold leading-8 text-ink shadow-none placeholder:text-muted focus:border-0 focus:outline-none"
        value={text}
        spellCheck={false}
        placeholder="Type a note..."
        onChange={(e) => {
          setText(e.target.value);
          updateConfig(widget.id, { text: e.target.value });
        }}
      />
    </div>
  );
}
