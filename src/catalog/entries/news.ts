import type { CatalogEntry } from '../types';

// News, feeds, and developer sources. RSS presets reuse the bespoke RSS
// reader builtin with a preconfigured feed URL (fetched via CORS proxy).

function rssPreset(id: string, name: string, url: string, description: string): CatalogEntry {
  return {
    id, name, category: 'News', source: 'RSS', description,
    builtin: 'rss',
    fields: [{ key: 'url', label: 'Feed URL', type: 'text', default: url }],
    defaultSize: { w: 380, h: 420 },
  };
}

const HN_LINK = '=https://news.ycombinator.com/item?id={objectID}';

export const NEWS: CatalogEntry[] = [
  {
    id: 'hn-top', name: 'Hacker News Front Page', category: 'News', source: 'HN Algolia',
    description: 'Current Hacker News front-page stories with points.',
    api: {
      url: 'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10', refresh: 300,
      map: { kind: 'list', root: 'hits', title: 'title', sub: 'author', value: 'points', link: HN_LINK },
    },
    defaultSize: { w: 400, h: 440 }, tags: ['no key'],
  },
  {
    id: 'hn-new', name: 'Hacker News Newest', category: 'News', source: 'HN Algolia',
    description: 'Newest stories as they land on Hacker News.',
    api: {
      url: 'https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=10', refresh: 120,
      map: { kind: 'list', root: 'hits', title: 'title', sub: 'author', value: 'points', link: HN_LINK },
    },
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'hn-ask', name: 'Ask HN', category: 'News', source: 'HN Algolia',
    description: 'Latest Ask HN discussion threads.',
    api: {
      url: 'https://hn.algolia.com/api/v1/search?tags=ask_hn&hitsPerPage=10', refresh: 300,
      map: { kind: 'list', root: 'hits', title: 'title', sub: 'author', value: 'points', link: HN_LINK },
    },
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'hn-show', name: 'Show HN', category: 'News', source: 'HN Algolia',
    description: 'Latest Show HN launches and projects.',
    api: {
      url: 'https://hn.algolia.com/api/v1/search?tags=show_hn&hitsPerPage=10', refresh: 300,
      map: { kind: 'list', root: 'hits', title: 'title', sub: 'author', value: 'points', link: HN_LINK },
    },
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'hn-search', name: 'HN Keyword Tracker', category: 'News', source: 'HN Algolia',
    description: 'Track any keyword or company across Hacker News.',
    api: {
      url: 'https://hn.algolia.com/api/v1/search_by_date?query={query}&tags=story&hitsPerPage=10', refresh: 300,
      map: { kind: 'list', root: 'hits', title: 'title', sub: 'author', value: 'points', link: HN_LINK },
    },
    fields: [{ key: 'query', label: 'Keyword', type: 'text', default: 'anthropic' }],
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'reddit-hot', name: 'Subreddit Feed', category: 'News', source: 'Reddit',
    description: 'Hot posts from any public subreddit.',
    api: {
      url: 'https://www.reddit.com/r/{sub}/hot.json?limit=10&raw_json=1', refresh: 300,
      map: { kind: 'list', root: 'data.children', title: 'data.title', sub: 'data.author', value: 'data.score', link: '=https://reddit.com{data.permalink}' },
    },
    fields: [{ key: 'sub', label: 'Subreddit', type: 'text', default: 'programming' }],
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'devto', name: 'DEV Community', category: 'News', source: 'dev.to',
    description: 'Top dev.to articles for any tag.',
    api: {
      url: 'https://dev.to/api/articles?tag={tag}&per_page=8&top=7', refresh: 600,
      map: { kind: 'list', root: '', title: 'title', sub: 'user.name', value: 'positive_reactions_count', link: 'url' },
    },
    fields: [{ key: 'tag', label: 'Tag', type: 'text', default: 'javascript' }],
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'guardian', name: 'The Guardian', category: 'News', source: 'Guardian Open Platform',
    description: 'Latest Guardian headlines by section (works with the shared "test" key).',
    api: {
      url: 'https://content.guardianapis.com/search?section={section}&api-key={key}&page-size=10', refresh: 600,
      map: { kind: 'list', root: 'response.results', title: 'webTitle', sub: 'sectionName', link: 'webUrl' },
    },
    fields: [
      { key: 'section', label: 'Section', type: 'select', default: 'world', options: [
        { value: 'world', label: 'World' }, { value: 'technology', label: 'Technology' },
        { value: 'business', label: 'Business' }, { value: 'sport', label: 'Sport' },
        { value: 'science', label: 'Science' }, { value: 'culture', label: 'Culture' },
      ] },
      { key: 'key', label: 'API key', type: 'text', default: 'test' },
    ],
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'gdelt-news', name: 'Global News Search', category: 'News', source: 'GDELT Project',
    description: 'Search worldwide news coverage for any topic, updated every 15 min.',
    api: {
      url: 'https://api.gdeltproject.org/api/v2/doc/doc?query={query}&mode=artlist&format=json&maxrecords=10&sort=datedesc',
      refresh: 900,
      map: { kind: 'list', root: 'articles', title: 'title', sub: 'domain', link: 'url' },
    },
    fields: [{ key: 'query', label: 'Search query', type: 'text', default: 'artificial intelligence' }],
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'spaceflight-news', name: 'Spaceflight News', category: 'News', source: 'Spaceflight News API',
    description: 'Latest spaceflight and rocketry headlines.',
    api: {
      url: 'https://api.spaceflightnewsapi.net/v4/articles/?limit=8', refresh: 600,
      map: { kind: 'list', root: 'results', title: 'title', sub: 'news_site', link: 'url' },
    },
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'wiki-onthisday', name: 'On This Day', category: 'News', source: 'Wikipedia',
    description: 'Historical events that happened on today\'s date.',
    api: {
      url: 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/{_mm}/{_dd}', refresh: 3600,
      map: { kind: 'list', root: 'events', title: 'text', sub: 'year', limit: 6 },
    },
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'wiki-featured', name: 'Wikipedia Featured Article', category: 'News', source: 'Wikipedia',
    description: 'Today\'s featured article from Wikipedia.',
    api: {
      url: 'https://api.wikimedia.org/feed/v1/wikipedia/en/featured/{_yyyy}/{_mm}/{_dd}', refresh: 3600,
      map: { kind: 'text', text: 'tfa.extract', attribution: 'tfa.titles.normalized' },
    },
    defaultSize: { w: 400, h: 340 },
  },
  rssPreset('rss-bbc-world', 'BBC World News', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC World Service headlines.'),
  rssPreset('rss-bbc-tech', 'BBC Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml', 'BBC technology headlines.'),
  rssPreset('rss-verge', 'The Verge', 'https://www.theverge.com/rss/index.xml', 'Tech, science, and culture from The Verge.'),
  rssPreset('rss-ars', 'Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'In-depth tech reporting from Ars Technica.'),
  rssPreset('rss-wired', 'WIRED', 'https://www.wired.com/feed/rss', 'WIRED stories on tech and society.'),
  rssPreset('rss-techcrunch', 'TechCrunch', 'https://techcrunch.com/feed/', 'Startup and VC news from TechCrunch.'),
  rssPreset('rss-npr', 'NPR News', 'https://feeds.npr.org/1001/rss.xml', 'Top stories from NPR.'),
  rssPreset('rss-aljazeera', 'Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'Global coverage from Al Jazeera.'),
  rssPreset('rss-engadget', 'Engadget', 'https://www.engadget.com/rss.xml', 'Consumer tech news from Engadget.'),
  rssPreset('rss-espn', 'ESPN Top Stories', 'https://www.espn.com/espn/rss/news', 'Sports headlines from ESPN.'),
];

export const DEV: CatalogEntry[] = [
  {
    id: 'github-repo', name: 'GitHub Repo Stats', category: 'Developer', source: 'GitHub API',
    description: 'Stars, forks, and open issues for any public repository.',
    api: {
      url: 'https://api.github.com/repos/{owner}/{repo}', refresh: 600,
      map: { kind: 'table', rows: [
        { label: 'Stars', path: 'stargazers_count' },
        { label: 'Forks', path: 'forks_count' },
        { label: 'Open issues', path: 'open_issues_count' },
        { label: 'Language', path: 'language' },
        { label: 'Last push', path: 'pushed_at' },
      ] },
    },
    fields: [
      { key: 'owner', label: 'Owner', type: 'text', default: 'facebook' },
      { key: 'repo', label: 'Repository', type: 'text', default: 'react' },
    ],
    defaultSize: { w: 360, h: 320 }, tags: ['no key'],
  },
  {
    id: 'github-user', name: 'GitHub Profile', category: 'Developer', source: 'GitHub API',
    description: 'Follower and repo counts for any GitHub user.',
    api: {
      url: 'https://api.github.com/users/{user}', refresh: 600,
      map: { kind: 'table', rows: [
        { label: 'Name', path: 'name' },
        { label: 'Public repos', path: 'public_repos' },
        { label: 'Followers', path: 'followers' },
        { label: 'Following', path: 'following' },
      ] },
    },
    fields: [{ key: 'user', label: 'Username', type: 'text', default: 'torvalds' }],
    defaultSize: { w: 360, h: 300 },
  },
  {
    id: 'github-trending', name: 'Hot New Repos', category: 'Developer', source: 'GitHub Search',
    description: 'Most-starred repositories created in the last week.',
    api: {
      url: 'https://api.github.com/search/repositories?q=created:%3E{_d7}&sort=stars&order=desc&per_page=8', refresh: 3600,
      map: { kind: 'list', root: 'items', title: 'full_name', sub: 'description', value: 'stargazers_count', link: 'html_url' },
    },
    defaultSize: { w: 420, h: 440 },
  },
  {
    id: 'github-zen', name: 'GitHub Zen', category: 'Developer', source: 'GitHub API',
    description: 'A random GitHub zen proverb.',
    api: { url: 'https://api.github.com/zen', refresh: 3600, parse: 'text', map: { kind: 'text', text: '' } },
    defaultSize: { w: 330, h: 200 },
  },
  {
    id: 'npm-package', name: 'npm Package', category: 'Developer', source: 'npm registry',
    description: 'Version, license, and weekly downloads for any npm package.',
    api: { url: '', refresh: 3600, adapter: 'npmPackage' },
    fields: [{ key: 'pkg', label: 'Package name', type: 'text', default: 'react' }],
    defaultSize: { w: 360, h: 300 },
  },
  {
    id: 'npm-downloads-chart', name: 'npm Downloads Chart', category: 'Developer', source: 'npm registry',
    description: '30-day download trend for any npm package.',
    api: {
      url: 'https://api.npmjs.org/downloads/range/last-month/{pkg}', refresh: 3600,
      map: { kind: 'chart', points: 'downloads', pointsKey: 'downloads', label: '=<pkg> — daily downloads' },
    },
    fields: [{ key: 'pkg', label: 'Package name', type: 'text', default: 'react' }],
    defaultSize: { w: 420, h: 260 },
  },
  {
    id: 'pypi-package', name: 'PyPI Package', category: 'Developer', source: 'PyPI',
    description: 'Latest version and summary for any Python package.',
    api: {
      url: 'https://pypi.org/pypi/{pkg}/json', refresh: 3600,
      map: { kind: 'table', rows: [
        { label: 'Package', path: 'info.name' },
        { label: 'Version', path: 'info.version' },
        { label: 'Summary', path: 'info.summary' },
        { label: 'Requires Python', path: 'info.requires_python' },
      ] },
    },
    fields: [{ key: 'pkg', label: 'Package name', type: 'text', default: 'requests' }],
    defaultSize: { w: 360, h: 300 },
  },
  {
    id: 'crates-package', name: 'Rust Crate', category: 'Developer', source: 'crates.io',
    description: 'Downloads and latest version for any Rust crate.',
    api: {
      url: 'https://crates.io/api/v1/crates/{name}', refresh: 3600,
      map: { kind: 'table', rows: [
        { label: 'Crate', path: 'crate.name' },
        { label: 'Version', path: 'crate.max_version' },
        { label: 'Total downloads', path: 'crate.downloads' },
        { label: 'Recent downloads', path: 'crate.recent_downloads' },
      ] },
    },
    fields: [{ key: 'name', label: 'Crate name', type: 'text', default: 'serde' }],
    defaultSize: { w: 360, h: 300 },
  },
  {
    id: 'bundlephobia', name: 'Bundle Size', category: 'Developer', source: 'Bundlephobia',
    description: 'Gzipped bundle cost of any npm package.',
    api: {
      url: 'https://bundlephobia.com/api/size?package={pkg}', refresh: 3600, transform: 'bundlephobia',
      map: { kind: 'stat', value: 'kb', sub: 'sub', suffix: ' kB gzipped', format: 'raw' },
    },
    fields: [{ key: 'pkg', label: 'Package name', type: 'text', default: 'lodash' }],
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'stackoverflow-tag', name: 'Stack Overflow Feed', category: 'Developer', source: 'Stack Exchange API',
    description: 'Newest active questions for any tag.',
    api: {
      url: 'https://api.stackexchange.com/2.3/questions?order=desc&sort=activity&tagged={tag}&site=stackoverflow&pagesize=8',
      refresh: 600, transform: 'decodeTitles',
      map: { kind: 'list', root: 'items', title: 'title', value: 'score', link: 'link' },
    },
    fields: [{ key: 'tag', label: 'Tag', type: 'text', default: 'typescript' }],
    defaultSize: { w: 420, h: 440 },
  },
];
