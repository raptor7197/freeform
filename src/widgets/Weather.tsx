import { useEffect, useState } from 'react';
import { useDashboard } from '../store';
import type { Widget } from '../types';

// WMO weather interpretation codes -> label.
// https://open-meteo.com/en/docs
const CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

interface WeatherData {
  place: string;
  temp: number;
  wind: number;
  code: number;
}

export function Weather({ widget }: { widget: Widget }) {
  const city = (widget.config.city as string) || 'San Francisco';
  const updateConfig = useDashboard((s) => s.updateConfig);
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState(city);

  useEffect(() => {
    const ctrl = new AbortController();
    setData(null);
    setError(null);

    (async () => {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city,
          )}&count=1&language=en&format=json`,
          { signal: ctrl.signal },
        );
        const geo = await geoRes.json();
        const hit = geo?.results?.[0];
        if (!hit) throw new Error(`Couldn't find "${city}"`);

        const fRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}` +
            `&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`,
          { signal: ctrl.signal },
        );
        const f = await fRes.json();
        const cur = f?.current;
        if (!cur) throw new Error('No weather data');

        setData({
          place: [hit.name, hit.country_code].filter(Boolean).join(', '),
          temp: Math.round(cur.temperature_2m),
          wind: Math.round(cur.wind_speed_10m),
          code: cur.weather_code,
        });
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') setError(e.message);
      }
    })();

    return () => ctrl.abort();
  }, [city]);

  const label = data ? (CODES[data.code] ?? 'Weather') : '';

  const commit = () => {
    const next = draft.trim();
    if (next && next !== city) updateConfig(widget.id, { city: next });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex items-center justify-center text-center">
        {error ? (
          <div className="border-y-2 border-brdr py-3 text-sm font-bold text-muted">{error}</div>
        ) : !data ? (
          <div className="text-sm font-bold uppercase text-muted">Loading weather...</div>
        ) : (
          <div className="grid w-full grid-cols-[88px_minmax(0,1fr)] items-center gap-4">
            <div className="weather-line-icon" aria-hidden="true" />
            <div className="min-w-0 text-left">
              <div className="brand-display whitespace-nowrap text-[34px] leading-none tabular-nums">
                {data.temp}°F
              </div>
              <div className="mt-1 text-[13px] font-black uppercase leading-tight text-ink">{label}</div>
              <div className="mt-3 border-t-2 border-brdr pt-2 text-[11px] font-bold uppercase leading-snug text-muted">
                {data.place} / wind {data.wind} mph
              </div>
            </div>
          </div>
        )}
      </div>
      <form
        className="flex-none flex gap-2 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
      >
        <input
          className="studio-input flex-1 min-w-0 px-2 py-1.5 text-sm font-bold"
          value={draft}
          placeholder="Enter a city..."
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className="studio-button flex-none px-2.5"
        >
          Go
        </button>
      </form>
    </div>
  );
}
