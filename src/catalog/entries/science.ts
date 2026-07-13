import type { CatalogEntry } from '../types';

// Weather & environment (Open-Meteo, USGS, NWS) and space & science
// (NASA, ISS trackers, Launch Library, Nobel).

const CITY = (def = 'San Francisco') => [{ key: 'city', label: 'City', type: 'text' as const, default: def }];
const OM = 'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}';

export const WEATHER: CatalogEntry[] = [
  {
    id: 'weather', name: 'Weather', category: 'Weather', source: 'Open-Meteo',
    description: 'Current conditions for any city — temperature, sky, wind.',
    builtin: 'weather', fields: CITY(), defaultSize: { w: 330, h: 270 }, tags: ['no key'],
  },
  {
    id: 'forecast-7d', name: '7-Day Forecast', category: 'Weather', source: 'Open-Meteo',
    description: 'Daily highs and lows for the week ahead.',
    api: {
      url: '', refresh: 1800, adapter: 'openMeteo',
      adapterParams: {
        url: `${OM}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`,
        transform: 'forecastDays',
        map: { kind: 'list', root: 'items', title: 'title', value: 'value', format: 'raw' },
      },
    },
    fields: CITY(), defaultSize: { w: 360, h: 400 },
  },
  {
    id: 'air-quality', name: 'Air Quality', category: 'Weather', source: 'Open-Meteo',
    description: 'Live AQI, PM2.5, PM10, and ozone for any city.',
    api: {
      url: '', refresh: 1800, adapter: 'openMeteo',
      adapterParams: {
        url: 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=us_aqi,pm2_5,pm10,ozone',
        map: { kind: 'table', rows: [
          { label: 'US AQI', path: 'current.us_aqi' },
          { label: 'PM2.5', path: 'current.pm2_5', suffix: ' µg/m³' },
          { label: 'PM10', path: 'current.pm10', suffix: ' µg/m³' },
          { label: 'Ozone', path: 'current.ozone', suffix: ' µg/m³' },
          { label: 'Location', path: '_place' },
        ] },
      },
    },
    fields: CITY('Delhi'), defaultSize: { w: 360, h: 320 },
  },
  {
    id: 'uv-index', name: 'UV Index', category: 'Weather', source: 'Open-Meteo',
    description: 'Current UV index with location.',
    api: {
      url: '', refresh: 1800, adapter: 'openMeteo',
      adapterParams: {
        url: `${OM}&current=uv_index`,
        map: { kind: 'stat', value: 'current.uv_index', label: '=UV Index', sub: '_place' },
      },
    },
    fields: CITY(), defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'wind-now', name: 'Wind Conditions', category: 'Weather', source: 'Open-Meteo',
    description: 'Wind speed, gusts, and direction right now.',
    api: {
      url: '', refresh: 1800, adapter: 'openMeteo',
      adapterParams: {
        url: `${OM}&current=wind_speed_10m,wind_gusts_10m,wind_direction_10m&wind_speed_unit=kmh`,
        map: { kind: 'table', rows: [
          { label: 'Wind', path: 'current.wind_speed_10m', suffix: ' km/h' },
          { label: 'Gusts', path: 'current.wind_gusts_10m', suffix: ' km/h' },
          { label: 'Direction', path: 'current.wind_direction_10m', suffix: '°' },
          { label: 'Location', path: '_place' },
        ] },
      },
    },
    fields: CITY(), defaultSize: { w: 330, h: 280 },
  },
  {
    id: 'temp-chart', name: 'Temperature (24h)', category: 'Weather', source: 'Open-Meteo',
    description: 'Hourly temperature sparkline for the next 24 hours.',
    api: {
      url: '', refresh: 1800, adapter: 'openMeteo',
      adapterParams: {
        url: `${OM}&hourly=temperature_2m&forecast_days=1`,
        map: { kind: 'chart', points: 'hourly.temperature_2m', label: '_place', suffix: '°C' },
      },
    },
    fields: CITY(), defaultSize: { w: 420, h: 260 },
  },
  {
    id: 'sun-times', name: 'Sunrise & Sunset', category: 'Weather', source: 'Open-Meteo',
    description: 'Today\'s sunrise, sunset, and daylight for any city.',
    api: {
      url: '', refresh: 3600, adapter: 'openMeteo',
      adapterParams: {
        url: `${OM}&daily=sunrise,sunset,daylight_duration&forecast_days=1&timezone=auto`,
        map: { kind: 'table', rows: [
          { label: 'Sunrise', path: 'daily.sunrise.0' },
          { label: 'Sunset', path: 'daily.sunset.0' },
          { label: 'Location', path: '_place' },
        ] },
      },
    },
    fields: CITY(), defaultSize: { w: 360, h: 260 },
  },
  {
    id: 'marine-waves', name: 'Ocean Waves', category: 'Weather', source: 'Open-Meteo Marine',
    description: 'Wave height and period at any coastal coordinates.',
    api: {
      url: 'https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&current=wave_height,wave_period',
      refresh: 1800,
      map: { kind: 'table', rows: [
        { label: 'Wave height', path: 'current.wave_height', suffix: ' m' },
        { label: 'Wave period', path: 'current.wave_period', suffix: ' s' },
      ] },
    },
    fields: [
      { key: 'lat', label: 'Latitude', type: 'number', default: 21.6 },
      { key: 'lon', label: 'Longitude', type: 'number', default: -158.1 },
    ],
    defaultSize: { w: 330, h: 240 },
  },
  {
    id: 'earthquakes', name: 'Recent Earthquakes', category: 'Weather', source: 'USGS',
    description: 'Magnitude 2.5+ quakes worldwide in the last 24 hours.',
    api: {
      url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', refresh: 300,
      map: { kind: 'list', root: 'features', title: 'properties.place', value: 'properties.mag', link: 'properties.url', format: 'raw' },
    },
    defaultSize: { w: 400, h: 400 },
  },
  {
    id: 'nws-alerts', name: 'US Weather Alerts', category: 'Weather', source: 'National Weather Service',
    description: 'Active severe-weather alerts for a US state.',
    api: {
      url: 'https://api.weather.gov/alerts/active?area={state}', refresh: 600,
      map: { kind: 'list', root: 'features', title: 'properties.event', sub: 'properties.areaDesc', limit: 6 },
    },
    fields: [{ key: 'state', label: 'State code', type: 'text', default: 'CA' }],
    defaultSize: { w: 400, h: 360 },
  },
  {
    id: 'uk-carbon', name: 'UK Grid Carbon', category: 'Weather', source: 'National Grid ESO',
    description: 'Live carbon intensity of Great Britain\'s power grid.',
    api: {
      url: 'https://api.carbonintensity.org.uk/intensity', refresh: 900,
      map: { kind: 'stat', value: 'data.0.intensity.actual', label: 'data.0.intensity.index', sub: '=gCO₂/kWh — GB grid' },
    },
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'moon-phase', name: 'Moon Phase', category: 'Weather', source: 'computed locally',
    description: 'Current moon phase and illumination — no network needed.',
    builtin: 'moon', defaultSize: { w: 330, h: 240 },
  },
];

export const SPACE: CatalogEntry[] = [
  {
    id: 'nasa-apod', name: 'NASA Picture of the Day', category: 'Space & Science', source: 'NASA APOD',
    description: 'Astronomy Picture of the Day (DEMO_KEY works out of the box).',
    api: {
      url: 'https://api.nasa.gov/planetary/apod?api_key={key}&thumbs=true', refresh: 3600,
      map: { kind: 'image', src: 'url', caption: 'title', link: 'hdurl' },
    },
    fields: [{ key: 'key', label: 'NASA API key', type: 'text', default: 'DEMO_KEY' }],
    defaultSize: { w: 460, h: 400 },
  },
  {
    id: 'iss-position', name: 'ISS Live Tracker', category: 'Space & Science', source: 'Where The ISS At',
    description: 'Live position, altitude, and speed of the International Space Station — updates every 5 s.',
    api: {
      url: 'https://api.wheretheiss.at/v1/satellites/25544', refresh: 5,
      map: { kind: 'table', rows: [
        { label: 'Latitude', path: 'latitude', digits: 2, suffix: '°' },
        { label: 'Longitude', path: 'longitude', digits: 2, suffix: '°' },
        { label: 'Altitude', path: 'altitude', digits: 0, suffix: ' km' },
        { label: 'Speed', path: 'velocity', digits: 0, suffix: ' km/h' },
        { label: 'Visibility', path: 'visibility' },
      ] },
    },
    defaultSize: { w: 340, h: 320 }, tags: ['live', 'no key'],
  },
  {
    id: 'astros', name: 'Humans in Space', category: 'Space & Science', source: 'Open Notify',
    description: 'Who is in space right now, and on which craft.',
    api: {
      url: 'http://api.open-notify.org/astros.json', refresh: 3600, proxy: true,
      map: { kind: 'list', root: 'people', title: 'name', sub: 'craft', limit: 14 },
    },
    defaultSize: { w: 340, h: 400 },
  },
  {
    id: 'launches', name: 'Upcoming Launches', category: 'Space & Science', source: 'Launch Library 2',
    description: 'Next five rocket launches worldwide.',
    api: {
      url: 'https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&mode=list', refresh: 3600,
      map: { kind: 'list', root: 'results', title: 'name', sub: 'net', limit: 5 },
    },
    defaultSize: { w: 420, h: 360 },
  },
  {
    id: 'mars-photo', name: 'Mars Rover Photo', category: 'Space & Science', source: 'NASA Mars Rovers',
    description: 'Latest photo beamed back by the Curiosity rover.',
    api: {
      url: 'https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key={key}', refresh: 3600,
      map: { kind: 'image', src: 'latest_photos.0.img_src', caption: '=Curiosity — {latest_photos.0.camera.full_name}' },
    },
    fields: [{ key: 'key', label: 'NASA API key', type: 'text', default: 'DEMO_KEY' }],
    defaultSize: { w: 460, h: 400 },
  },
  {
    id: 'neo-today', name: 'Near-Earth Objects', category: 'Space & Science', source: 'NASA NeoWs',
    description: 'Count of asteroids passing near Earth today.',
    api: {
      url: 'https://api.nasa.gov/neo/rest/v1/feed?start_date={_today}&end_date={_today}&api_key={key}', refresh: 3600,
      map: { kind: 'stat', value: 'element_count', label: '=Near-Earth objects today', sub: '=Tracked by NASA JPL' },
    },
    fields: [{ key: 'key', label: 'NASA API key', type: 'text', default: 'DEMO_KEY' }],
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'solar-body', name: 'Planet Facts', category: 'Space & Science', source: 'Solar System OpenData',
    description: 'Gravity, radius, and orbit facts for any solar-system body.',
    api: {
      url: 'https://api.le-systeme-solaire.net/rest/bodies/{body}', refresh: 86400,
      map: { kind: 'table', rows: [
        { label: 'Body', path: 'englishName' },
        { label: 'Gravity', path: 'gravity', suffix: ' m/s²' },
        { label: 'Mean radius', path: 'meanRadius', suffix: ' km' },
        { label: 'Orbital period', path: 'sideralOrbit', suffix: ' days' },
        { label: 'Moons', path: 'moons.length' },
      ] },
    },
    fields: [{ key: 'body', label: 'Body', type: 'text', default: 'mars' }],
    defaultSize: { w: 360, h: 320 },
  },
  {
    id: 'nobel-prizes', name: 'Nobel Prizes', category: 'Space & Science', source: 'Nobel Prize API',
    description: 'Most recent Nobel Prize awards and laureates.',
    api: {
      url: 'https://api.nobelprize.org/2.1/nobelPrizes?limit=6&sort=desc', refresh: 86400,
      map: { kind: 'list', root: 'nobelPrizes', title: '={category.en} {awardYear}', sub: 'laureates.0.knownName.en', limit: 6 },
    },
    defaultSize: { w: 400, h: 380 },
  },
  {
    id: 'world-gdp', name: 'Country GDP', category: 'Space & Science', source: 'World Bank',
    description: 'Latest GDP figure for any country (World Bank open data).',
    api: {
      url: 'https://api.worldbank.org/v2/country/{cc}/indicator/NY.GDP.MKTP.CD?format=json&mrv=1', refresh: 86400,
      map: { kind: 'stat', value: '1.0.value', label: '1.0.country.value', sub: '=GDP, current US$ ({1.0.date})', prefix: '$' },
    },
    fields: [{ key: 'cc', label: 'Country code', type: 'text', default: 'IN', help: 'ISO-2, e.g. US, IN, DE' }],
    defaultSize: { w: 360, h: 220 },
  },
];
