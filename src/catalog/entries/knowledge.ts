import type { CatalogEntry } from '../types';

// Reference/knowledge lookups and image widgets. Image entries with
// `direct: true` render a templated URL straight into <img> — no fetch.

export const KNOWLEDGE: CatalogEntry[] = [
  {
    id: 'dictionary', name: 'Dictionary', category: 'Knowledge', source: 'Free Dictionary API',
    description: 'Definition for any English word.',
    api: {
      url: 'https://api.dictionaryapi.dev/api/v2/entries/en/{word}', refresh: 86400,
      map: { kind: 'text', text: '0.meanings.0.definitions.0.definition', attribution: '=<word> ({0.meanings.0.partOfSpeech})' },
    },
    fields: [{ key: 'word', label: 'Word', type: 'text', default: 'serendipity' }],
    defaultSize: { w: 380, h: 260 },
  },
  {
    id: 'related-words', name: 'Related Words', category: 'Knowledge', source: 'Datamuse',
    description: 'Words with similar meaning to any word.',
    api: {
      url: 'https://api.datamuse.com/words?ml={word}&max=10', refresh: 86400,
      map: { kind: 'list', root: '', title: 'word', value: 'score', limit: 10 },
    },
    fields: [{ key: 'word', label: 'Word', type: 'text', default: 'dashboard' }],
    defaultSize: { w: 340, h: 400 },
  },
  {
    id: 'wiki-summary', name: 'Wikipedia Summary', category: 'Knowledge', source: 'Wikipedia',
    description: 'Intro paragraph for any Wikipedia topic.',
    api: {
      url: 'https://en.wikipedia.org/api/rest_v1/page/summary/{topic}', refresh: 86400,
      map: { kind: 'text', text: 'extract', attribution: 'title' },
    },
    fields: [{ key: 'topic', label: 'Topic', type: 'text', default: 'Dashboard_(computing)' }],
    defaultSize: { w: 420, h: 320 },
  },
  {
    id: 'wiki-random', name: 'Random Wikipedia', category: 'Knowledge', source: 'Wikipedia',
    description: 'A random Wikipedia article on every refresh.',
    api: {
      url: 'https://en.wikipedia.org/api/rest_v1/page/random/summary', refresh: 900,
      map: { kind: 'text', text: 'extract', attribution: 'title' },
    },
    defaultSize: { w: 420, h: 320 },
  },
  {
    id: 'book-search', name: 'Book Lookup', category: 'Knowledge', source: 'Open Library',
    description: 'Find books by title with author and year.',
    api: {
      url: 'https://openlibrary.org/search.json?title={title}&limit=6', refresh: 86400,
      map: { kind: 'list', root: 'docs', title: 'title', sub: '={author_name.0} · {first_publish_year}', limit: 6 },
    },
    fields: [{ key: 'title', label: 'Title', type: 'text', default: 'Dune' }],
    defaultSize: { w: 400, h: 380 },
  },
  {
    id: 'gutenberg', name: 'Free eBooks', category: 'Knowledge', source: 'Project Gutenberg',
    description: 'Search Project Gutenberg\'s public-domain library.',
    api: {
      url: 'https://gutendex.com/books?search={q}', refresh: 86400,
      map: { kind: 'list', root: 'results', title: 'title', sub: 'authors.0.name', value: 'download_count', limit: 6 },
    },
    fields: [{ key: 'q', label: 'Search', type: 'text', default: 'sherlock holmes' }],
    defaultSize: { w: 400, h: 380 },
  },
  {
    id: 'country-info', name: 'Country Facts', category: 'Knowledge', source: 'REST Countries',
    description: 'Capital, population, and region for any country.',
    api: {
      url: 'https://restcountries.com/v3.1/name/{country}?fields=name,capital,population,region,subregion',
      refresh: 86400,
      map: { kind: 'table', rows: [
        { label: 'Country', path: '0.name.common' },
        { label: 'Capital', path: '0.capital.0' },
        { label: 'Population', path: '0.population' },
        { label: 'Region', path: '0.region' },
        { label: 'Subregion', path: '0.subregion' },
      ] },
    },
    fields: [{ key: 'country', label: 'Country', type: 'text', default: 'Japan' }],
    defaultSize: { w: 360, h: 320 },
  },
  {
    id: 'public-holidays', name: 'Public Holidays', category: 'Knowledge', source: 'Nager.Date',
    description: 'Upcoming public holidays for any country.',
    api: {
      url: 'https://date.nager.at/api/v3/NextPublicHolidays/{cc}', refresh: 86400,
      map: { kind: 'list', root: '', title: 'name', sub: 'date', limit: 8 },
    },
    fields: [{ key: 'cc', label: 'Country code', type: 'text', default: 'IN', help: 'ISO-2, e.g. US, IN, GB' }],
    defaultSize: { w: 380, h: 400 },
  },
  {
    id: 'universities', name: 'University Finder', category: 'Knowledge', source: 'Hipolabs',
    description: 'Universities in any country.',
    api: {
      url: 'https://universities.hipolabs.com/search?country={country}&limit=8', refresh: 86400,
      map: { kind: 'list', root: '', title: 'name', sub: 'web_pages.0', limit: 8 },
    },
    fields: [{ key: 'country', label: 'Country', type: 'text', default: 'India' }],
    defaultSize: { w: 400, h: 400 },
  },
  {
    id: 'zip-lookup', name: 'ZIP Code Lookup', category: 'Knowledge', source: 'Zippopotam.us',
    description: 'City and state for any postal code.',
    api: {
      url: 'https://api.zippopotam.us/{cc}/{zip}', refresh: 86400,
      map: { kind: 'table', rows: [
        { label: 'Place', path: 'places.0.place name' },
        { label: 'State', path: 'places.0.state' },
        { label: 'Country', path: 'country' },
        { label: 'Coordinates', path: '=({places.0.latitude}, {places.0.longitude})' },
      ] },
    },
    fields: [
      { key: 'cc', label: 'Country', type: 'text', default: 'us' },
      { key: 'zip', label: 'Postal code', type: 'text', default: '94105' },
    ],
    defaultSize: { w: 340, h: 300 },
  },
  {
    id: 'my-ip', name: 'My IP & Location', category: 'Knowledge', source: 'ipapi.co',
    description: 'Your public IP, city, and network provider.',
    api: {
      url: 'https://ipapi.co/json/', refresh: 3600,
      map: { kind: 'table', rows: [
        { label: 'IP', path: 'ip' },
        { label: 'City', path: 'city' },
        { label: 'Region', path: 'region' },
        { label: 'Country', path: 'country_name' },
        { label: 'Provider', path: 'org' },
      ] },
    },
    defaultSize: { w: 360, h: 320 },
  },
  {
    id: 'random-user', name: 'Random Identity', category: 'Knowledge', source: 'randomuser.me',
    description: 'A generated person card — handy for design mockups.',
    api: {
      url: 'https://randomuser.me/api/?t={_ts}', refresh: 900,
      map: { kind: 'image', src: 'results.0.picture.large', caption: '={results.0.name.first} {results.0.name.last} — {results.0.location.country}' },
    },
    defaultSize: { w: 320, h: 340 },
  },
  {
    id: 'fbi-wanted', name: 'FBI Most Wanted', category: 'Knowledge', source: 'FBI API',
    description: 'Current entries from the FBI\'s wanted list.',
    api: {
      url: 'https://api.fbi.gov/wanted/v1/list?pageSize=8', refresh: 86400,
      map: { kind: 'list', root: 'items', title: 'title', sub: 'description', limit: 8 },
    },
    defaultSize: { w: 400, h: 400 },
  },
];

export const IMAGES: CatalogEntry[] = [
  {
    id: 'random-dog', name: 'Random Dog', category: 'Images', source: 'Dog CEO',
    description: 'A new dog photo on every refresh.',
    api: {
      url: 'https://dog.ceo/api/breeds/image/random?t={_ts}', refresh: 600,
      map: { kind: 'image', src: 'message' },
    },
    defaultSize: { w: 360, h: 340 },
  },
  {
    id: 'random-cat', name: 'Random Cat', category: 'Images', source: 'TheCatAPI',
    description: 'A new cat photo on every refresh.',
    api: {
      url: 'https://api.thecatapi.com/v1/images/search?t={_ts}', refresh: 600,
      map: { kind: 'image', src: '0.url' },
    },
    defaultSize: { w: 360, h: 340 },
  },
  {
    id: 'random-fox', name: 'Random Fox', category: 'Images', source: 'randomfox.ca',
    description: 'A new fox photo on every refresh.',
    api: {
      url: 'https://randomfox.ca/floof/?t={_ts}', refresh: 600,
      map: { kind: 'image', src: 'image' },
    },
    defaultSize: { w: 360, h: 340 },
  },
  {
    id: 'met-artwork', name: 'Museum Artwork (Met)', category: 'Images', source: 'The Met Museum',
    description: 'Random artwork from the Metropolitan Museum\'s open collection.',
    api: { url: '', refresh: 900, adapter: 'metArt' },
    fields: [{ key: 'query', label: 'Theme', type: 'text', default: 'landscape' }],
    defaultSize: { w: 420, h: 420 },
  },
  {
    id: 'artic-artwork', name: 'Museum Artwork (Chicago)', category: 'Images', source: 'Art Institute of Chicago',
    description: 'Artwork from the Art Institute of Chicago matching a theme.',
    api: {
      url: 'https://api.artic.edu/api/v1/artworks/search?q={query}&fields=image_id,title,artist_display&limit=1',
      refresh: 900, transform: 'articImage',
      map: { kind: 'image', src: 'src', caption: 'caption' },
    },
    fields: [{ key: 'query', label: 'Theme', type: 'text', default: 'impressionism' }],
    defaultSize: { w: 420, h: 420 },
  },
  {
    id: 'picsum', name: 'Random Photo', category: 'Images', source: 'Lorem Picsum',
    description: 'A random high-quality photo, new on each refresh.',
    api: { url: '', refresh: 600, map: { kind: 'image', direct: true, src: 'https://picsum.photos/seed/{_ts}/640/480' } },
    defaultSize: { w: 400, h: 340 },
  },
  {
    id: 'http-cat', name: 'HTTP Status Cat', category: 'Images', source: 'http.cat',
    description: 'The cat picture for any HTTP status code.',
    api: { url: '', refresh: 86400, map: { kind: 'image', direct: true, src: 'https://http.cat/{code}' } },
    fields: [{ key: 'code', label: 'Status code', type: 'text', default: '418' }],
    defaultSize: { w: 360, h: 320 },
  },
  {
    id: 'dicebear-avatar', name: 'Avatar Generator', category: 'Images', source: 'DiceBear',
    description: 'Deterministic avatar from any seed text, in nine styles.',
    api: { url: '', refresh: 86400, map: { kind: 'image', direct: true, src: 'https://api.dicebear.com/9.x/{style}/svg?seed={seed}' } },
    fields: [
      { key: 'seed', label: 'Seed', type: 'text', default: 'freeform' },
      { key: 'style', label: 'Style', type: 'select', default: 'bottts', options: [
        { value: 'bottts', label: 'Robots' }, { value: 'pixel-art', label: 'Pixel art' },
        { value: 'identicon', label: 'Identicon' }, { value: 'shapes', label: 'Shapes' },
        { value: 'thumbs', label: 'Thumbs' },
      ] },
    ],
    defaultSize: { w: 300, h: 320 },
  },
  {
    id: 'qr-code', name: 'QR Code', category: 'Images', source: 'goqr.me',
    description: 'QR code for any text or URL.',
    api: { url: '', refresh: 86400, map: { kind: 'image', direct: true, src: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={text}' } },
    fields: [{ key: 'text', label: 'Text / URL', type: 'text', default: 'https://example.com' }],
    defaultSize: { w: 300, h: 320 },
  },
  {
    id: 'image-url', name: 'Image from URL', category: 'Images', source: 'your URL',
    description: 'Display any image URL — logos, webcams, generated charts.',
    api: { url: '', refresh: 300, map: { kind: 'image', direct: true, src: '{src}' } },
    fields: [{ key: 'src', label: 'Image URL', type: 'text', placeholder: 'https://…/image.png' }],
    defaultSize: { w: 400, h: 340 },
  },
];
