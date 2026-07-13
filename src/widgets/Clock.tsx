import { useEffect, useState } from 'react';
import type { Widget } from '../types';

export function Clock({ widget }: { widget: Widget }) {
  let timeZone = (widget.config.timeZone as string) || undefined;
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Guard against a bad zone typed into settings.
  try {
    now.toLocaleTimeString('en-US', { timeZone });
  } catch {
    timeZone = undefined;
  }

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone,
  });
  const [clockTime, period] = time.split(' ');
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone,
  });

  // Hand angles from the zone-adjusted wall time.
  const [h, m, s] = now
    .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone })
    .split(':')
    .map(Number);
  const hourDeg = (h % 12) * 30 + m * 0.5;
  const minuteDeg = m * 6 + s * 0.1;
  const secondDeg = s * 6;

  return (
    <div className="h-full min-h-0 grid grid-cols-[88px_minmax(0,1fr)] items-center gap-4">
      <div className="analog-clock flex-none" aria-hidden="true">
        <div className="clock-hand clock-hand-hour" style={{ transform: `translate(-50%, -100%) rotate(${hourDeg}deg)` }} />
        <div className="clock-hand clock-hand-minute" style={{ transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)` }} />
        <div className="clock-hand clock-hand-second" style={{ transform: `translate(-50%, -100%) rotate(${secondDeg}deg)` }} />
      </div>
      <div className="min-w-0 text-left">
        <div className="brand-display whitespace-nowrap text-[30px] leading-none tabular-nums">
          {clockTime}
          <span className="ml-2 text-[20px]">{period}</span>
        </div>
        <div className="mt-3 border-t-2 border-brdr pt-2 text-[12px] font-bold uppercase leading-snug text-muted">
          {date}
        </div>
        {timeZone && (
          <div className="mt-2 text-[11px] font-black uppercase text-accent">{timeZone}</div>
        )}
      </div>
    </div>
  );
}
