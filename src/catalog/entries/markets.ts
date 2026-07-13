import type { CatalogEntry } from '../types';

// Markets & Crypto. Stocks/indices/commodities go through Yahoo Finance via a
// public CORS proxy (no key). Crypto uses CoinGecko/Binance/Coinbase/Kraken
// public endpoints directly. Key-based real-time quotes (Finnhub, Twelve Data)
// are included for users with free API keys.

const SYM = (def: string) => [{ key: 'symbol', label: 'Ticker symbol', type: 'text' as const, default: def }];

export const MARKETS: CatalogEntry[] = [
  {
    id: 'stock-quote', name: 'Stock Quote', category: 'Markets', source: 'Yahoo Finance',
    description: 'Price and daily change for any stock, ETF, index, or future.',
    api: { url: '', refresh: 60, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: SYM('AAPL'), defaultSize: { w: 330, h: 220 }, tags: ['no key'],
  },
  {
    id: 'stock-chart', name: 'Stock Chart', category: 'Markets', source: 'Yahoo Finance',
    description: 'Sparkline price history for any ticker — intraday to a year.',
    api: { url: '', refresh: 120, adapter: 'yahoo', adapterParams: { mode: 'chart' } },
    fields: [
      ...SYM('AAPL'),
      { key: 'range', label: 'Range', type: 'select', default: '1mo', options: [
        { value: '1d', label: '1 day' }, { value: '5d', label: '5 days' }, { value: '1mo', label: '1 month' },
        { value: '6mo', label: '6 months' }, { value: '1y', label: '1 year' },
      ] },
    ],
    defaultSize: { w: 420, h: 260 }, tags: ['no key'],
  },
  {
    id: 'watchlist', name: 'Stock Watchlist', category: 'Markets', source: 'Yahoo Finance',
    description: 'Track up to 8 tickers with price and daily % change.',
    api: { url: '', refresh: 90, adapter: 'watchlist' },
    fields: [{ key: 'symbols', label: 'Symbols (comma-separated)', type: 'text', default: 'AAPL,MSFT,NVDA,TSLA' }],
    defaultSize: { w: 360, h: 360 }, tags: ['no key'],
  },
  {
    id: 'index-sp500', name: 'S&P 500', category: 'Markets', source: 'Yahoo Finance',
    description: 'S&P 500 index level and daily change.',
    api: { url: '', refresh: 60, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: '^GSPC' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'index-nasdaq', name: 'NASDAQ Composite', category: 'Markets', source: 'Yahoo Finance',
    description: 'NASDAQ Composite index and daily change.',
    api: { url: '', refresh: 60, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: '^IXIC' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'index-dow', name: 'Dow Jones', category: 'Markets', source: 'Yahoo Finance',
    description: 'Dow Jones Industrial Average and daily change.',
    api: { url: '', refresh: 60, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: '^DJI' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'index-nifty', name: 'NIFTY 50', category: 'Markets', source: 'Yahoo Finance',
    description: 'India NIFTY 50 index and daily change.',
    api: { url: '', refresh: 60, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: '^NSEI' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'index-sensex', name: 'BSE Sensex', category: 'Markets', source: 'Yahoo Finance',
    description: 'Bombay Stock Exchange Sensex and daily change.',
    api: { url: '', refresh: 60, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: '^BSESN' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'vix', name: 'VIX Volatility', category: 'Markets', source: 'Yahoo Finance',
    description: 'CBOE VIX fear index — market volatility gauge.',
    api: { url: '', refresh: 120, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: '^VIX' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'oil-wti', name: 'Crude Oil (WTI)', category: 'Markets', source: 'Yahoo Finance',
    description: 'WTI crude oil futures price.',
    api: { url: '', refresh: 120, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: 'CL=F' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'gold-futures', name: 'Gold Price', category: 'Markets', source: 'Yahoo Finance',
    description: 'Gold futures (COMEX) price per troy ounce.',
    api: { url: '', refresh: 120, adapter: 'yahoo', adapterParams: { mode: 'stat' } },
    fields: [{ key: 'symbol', label: 'Symbol', type: 'text', default: 'GC=F' }], defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'fx-rate', name: 'Exchange Rate', category: 'Markets', source: 'Frankfurter (ECB)',
    description: 'Live central-bank exchange rate between two currencies.',
    api: {
      url: 'https://api.frankfurter.app/latest?base={from}&symbols={to}', refresh: 3600,
      map: { kind: 'stat', value: 'rates.<to>', label: '=<from> → <to>', sub: 'date', digits: 4 },
    },
    fields: [
      { key: 'from', label: 'From currency', type: 'text', default: 'USD' },
      { key: 'to', label: 'To currency', type: 'text', default: 'INR' },
    ],
    defaultSize: { w: 330, h: 220 }, tags: ['no key'],
  },
  {
    id: 'fx-table', name: 'Currency Rates', category: 'Markets', source: 'Frankfurter (ECB)',
    description: 'Table of major currency rates against a base of your choice.',
    api: {
      url: 'https://api.frankfurter.app/latest?base={base}&symbols=USD,EUR,GBP,JPY,INR,AUD,CAD,CHF',
      refresh: 3600, transform: 'fxRates',
      map: { kind: 'list', root: 'items', title: 'title', value: 'value', sub: 'sub', digits: 4 },
    },
    fields: [{ key: 'base', label: 'Base currency', type: 'text', default: 'USD' }],
    defaultSize: { w: 340, h: 380 },
  },
  {
    id: 'fx-chart', name: 'FX 30-Day Chart', category: 'Markets', source: 'Frankfurter (ECB)',
    description: '30-day history sparkline for a currency pair.',
    api: {
      url: 'https://api.frankfurter.app/{_d30}..?base={from}&symbols={to}', refresh: 3600,
      transform: 'fxSeries',
      map: { kind: 'chart', points: 'points', current: 'current', label: 'label', digits: 4 },
    },
    fields: [
      { key: 'from', label: 'From', type: 'text', default: 'EUR' },
      { key: 'to', label: 'To', type: 'text', default: 'USD' },
    ],
    defaultSize: { w: 420, h: 260 },
  },
  {
    id: 'fx-convert', name: 'Currency Converter', category: 'Markets', source: 'Frankfurter (ECB)',
    description: 'Convert a fixed amount between currencies, updated daily.',
    api: {
      url: 'https://api.frankfurter.app/latest?amount={amount}&base={from}&symbols={to}', refresh: 3600,
      map: { kind: 'stat', value: 'rates.<to>', label: '=<amount> <from> in <to>', sub: 'date' },
    },
    fields: [
      { key: 'amount', label: 'Amount', type: 'number', default: 100 },
      { key: 'from', label: 'From', type: 'text', default: 'USD' },
      { key: 'to', label: 'To', type: 'text', default: 'EUR' },
    ],
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'twelvedata-quote', name: 'Real-Time Quote (Twelve Data)', category: 'Markets', source: 'Twelve Data',
    description: 'Real-time stock quote with change — free API key (800 req/day).',
    api: {
      url: 'https://api.twelvedata.com/quote?symbol={symbol}&apikey={key}', refresh: 30,
      map: { kind: 'stat', value: 'close', label: 'symbol', sub: 'name', delta: 'percent_change' },
    },
    fields: [...SYM('AAPL'), { key: 'key', label: 'API key', type: 'text', placeholder: 'free at twelvedata.com' }],
    defaultSize: { w: 330, h: 220 }, tags: ['key required', 'real-time'],
  },
  {
    id: 'finnhub-quote', name: 'Real-Time Quote (Finnhub)', category: 'Markets', source: 'Finnhub',
    description: 'Real-time US stock quote — free API key (60 req/min).',
    api: {
      url: 'https://finnhub.io/api/v1/quote?symbol={symbol}&token={key}', refresh: 15,
      map: { kind: 'stat', value: 'c', label: '=<symbol>', sub: '=Prev close {pc}', delta: 'dp' },
    },
    fields: [...SYM('AAPL'), { key: 'key', label: 'API key', type: 'text', placeholder: 'free at finnhub.io' }],
    defaultSize: { w: 330, h: 220 }, tags: ['key required', 'real-time'],
  },
];

const COIN = (def: string) => [{ key: 'coin', label: 'Coin (CoinGecko id)', type: 'text' as const, default: def, help: 'e.g. bitcoin, ethereum, solana' }];

export const CRYPTO: CatalogEntry[] = [
  {
    id: 'crypto-price', name: 'Crypto Price', category: 'Crypto', source: 'CoinGecko',
    description: 'Spot price and 24h change for any of 10,000+ coins.',
    api: {
      url: 'https://api.coingecko.com/api/v3/simple/price?ids={coin}&vs_currencies={cur}&include_24hr_change=true',
      refresh: 60,
      map: { kind: 'stat', value: '<coin>.<cur>', label: '=<coin>', sub: '=vs <cur>', delta: '<coin>.<cur>_24h_change' },
    },
    fields: [...COIN('bitcoin'), { key: 'cur', label: 'Currency', type: 'text', default: 'usd' }],
    defaultSize: { w: 330, h: 220 }, tags: ['no key'],
  },
  {
    id: 'crypto-markets', name: 'Top 10 Crypto', category: 'Crypto', source: 'CoinGecko',
    description: 'Top coins by market cap with live prices.',
    api: {
      url: 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1',
      refresh: 120,
      map: { kind: 'list', root: '', title: 'name', sub: 'symbol', value: 'current_price', image: 'image', prefix: '$' },
    },
    defaultSize: { w: 360, h: 420 },
  },
  {
    id: 'crypto-trending', name: 'Trending Coins', category: 'Crypto', source: 'CoinGecko',
    description: 'Coins trending in CoinGecko searches right now.',
    api: {
      url: 'https://api.coingecko.com/api/v3/search/trending', refresh: 300,
      map: { kind: 'list', root: 'coins', title: 'item.name', sub: 'item.symbol', value: 'item.market_cap_rank', image: 'item.small', prefix: '#', format: 'raw' },
    },
    defaultSize: { w: 340, h: 380 },
  },
  {
    id: 'crypto-global', name: 'Crypto Market Stats', category: 'Crypto', source: 'CoinGecko',
    description: 'Global market cap, volume, and BTC dominance.',
    api: {
      url: 'https://api.coingecko.com/api/v3/global', refresh: 300,
      map: { kind: 'table', rows: [
        { label: 'Market cap (USD)', path: 'data.total_market_cap.usd' },
        { label: '24h volume (USD)', path: 'data.total_volume.usd' },
        { label: 'BTC dominance', path: 'data.market_cap_percentage.btc', suffix: '%', digits: 1 },
        { label: 'Active coins', path: 'data.active_cryptocurrencies' },
      ] },
    },
    defaultSize: { w: 360, h: 280 },
  },
  {
    id: 'crypto-chart', name: 'Crypto 7-Day Chart', category: 'Crypto', source: 'CoinGecko',
    description: 'Week-long price sparkline for any coin.',
    api: {
      url: 'https://api.coingecko.com/api/v3/coins/{coin}/market_chart?vs_currency=usd&days=7', refresh: 600,
      map: { kind: 'chart', points: 'prices', pointsKey: '1', label: '=<coin> — 7 days', prefix: '$' },
    },
    fields: COIN('bitcoin'), defaultSize: { w: 420, h: 260 },
  },
  {
    id: 'binance-ticker', name: 'Binance 24h Ticker', category: 'Crypto', source: 'Binance',
    description: '24-hour stats for any Binance trading pair.',
    api: {
      url: 'https://api.binance.com/api/v3/ticker/24hr?symbol={symbol}', refresh: 30,
      map: { kind: 'stat', value: 'lastPrice', label: '=<symbol>', sub: '=24h vol {volume}', delta: 'priceChangePercent' },
    },
    fields: [{ key: 'symbol', label: 'Pair', type: 'text', default: 'BTCUSDT' }],
    defaultSize: { w: 330, h: 220 }, tags: ['no key'],
  },
  {
    id: 'btc-live', name: 'Bitcoin Live (WebSocket)', category: 'Crypto', source: 'Binance stream',
    description: 'True real-time BTC price over a live WebSocket — ticks every second.',
    builtin: 'wslive',
    fields: [{ key: 'symbol', label: 'Binance pair', type: 'text', default: 'BTCUSDT' }],
    defaultSize: { w: 330, h: 220 }, tags: ['live', 'no key'],
  },
  {
    id: 'eth-live', name: 'Ethereum Live (WebSocket)', category: 'Crypto', source: 'Binance stream',
    description: 'Real-time ETH price streamed over WebSocket.',
    builtin: 'wslive',
    fields: [{ key: 'symbol', label: 'Binance pair', type: 'text', default: 'ETHUSDT' }],
    defaultSize: { w: 330, h: 220 }, tags: ['live', 'no key'],
  },
  {
    id: 'coinbase-spot', name: 'Coinbase Spot Price', category: 'Crypto', source: 'Coinbase',
    description: 'Coinbase spot price for any currency pair.',
    api: {
      url: 'https://api.coinbase.com/v2/prices/{pair}/spot', refresh: 60,
      map: { kind: 'stat', value: 'data.amount', label: '=<pair>', sub: '=Coinbase spot', prefix: '$' },
    },
    fields: [{ key: 'pair', label: 'Pair', type: 'text', default: 'BTC-USD' }],
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'kraken-ticker', name: 'Kraken Ticker', category: 'Crypto', source: 'Kraken',
    description: 'Last trade price on Kraken for any pair.',
    api: {
      url: 'https://api.kraken.com/0/public/Ticker?pair={pair}', refresh: 60, transform: 'firstResult',
      map: { kind: 'stat', value: 'c.0', label: '=<pair>', sub: '=Kraken last trade' },
    },
    fields: [{ key: 'pair', label: 'Pair', type: 'text', default: 'XBTUSD' }],
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'btc-fees', name: 'Bitcoin Fees', category: 'Crypto', source: 'mempool.space',
    description: 'Recommended BTC transaction fees right now (sat/vB).',
    api: {
      url: 'https://mempool.space/api/v1/fees/recommended', refresh: 120,
      map: { kind: 'table', rows: [
        { label: 'Fastest', path: 'fastestFee', suffix: ' sat/vB' },
        { label: '~30 min', path: 'halfHourFee', suffix: ' sat/vB' },
        { label: '~1 hour', path: 'hourFee', suffix: ' sat/vB' },
        { label: 'Economy', path: 'economyFee', suffix: ' sat/vB' },
      ] },
    },
    defaultSize: { w: 330, h: 280 },
  },
  {
    id: 'btc-network', name: 'Bitcoin Network Stats', category: 'Crypto', source: 'blockchain.info',
    description: 'Market price, hash rate, and daily transaction count.',
    api: {
      url: 'https://api.blockchain.info/stats?cors=true', refresh: 600,
      map: { kind: 'table', rows: [
        { label: 'Price (USD)', path: 'market_price_usd' },
        { label: 'Hash rate (GH/s)', path: 'hash_rate' },
        { label: 'Transactions (24h)', path: 'n_tx' },
        { label: 'Blocks mined (24h)', path: 'n_blocks_mined' },
      ] },
    },
    defaultSize: { w: 360, h: 280 },
  },
  {
    id: 'fear-greed', name: 'Fear & Greed Index', category: 'Crypto', source: 'alternative.me',
    description: 'Crypto market sentiment gauge, 0 (fear) to 100 (greed).',
    api: {
      url: 'https://api.alternative.me/fng/', refresh: 3600,
      map: { kind: 'stat', value: 'data.0.value', label: 'data.0.value_classification', sub: '=Crypto Fear & Greed', format: 'raw' },
    },
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'defi-tvl', name: 'DeFi Protocol TVL', category: 'Crypto', source: 'DefiLlama',
    description: 'Total value locked in any DeFi protocol.',
    api: {
      url: 'https://api.llama.fi/tvl/{protocol}', refresh: 600,
      map: { kind: 'stat', value: '', label: '=<protocol> TVL', prefix: '$' },
    },
    fields: [{ key: 'protocol', label: 'Protocol slug', type: 'text', default: 'aave', help: 'e.g. aave, uniswap, lido' }],
    defaultSize: { w: 330, h: 220 },
  },
  {
    id: 'defi-chains', name: 'Top Chains by TVL', category: 'Crypto', source: 'DefiLlama',
    description: 'Blockchains ranked by DeFi total value locked.',
    api: {
      url: 'https://api.llama.fi/v2/chains', refresh: 600, transform: 'llamaChains',
      map: { kind: 'list', root: 'items', title: 'title', value: 'value', prefix: '$' },
    },
    defaultSize: { w: 340, h: 400 },
  },
];
