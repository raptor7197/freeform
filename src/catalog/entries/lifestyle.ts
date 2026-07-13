import type { CatalogEntry } from '../types';

// Sports scoreboards (ESPN public endpoints), F1, chess, and the fun/food shelf.

function espn(id: string, name: string, path: string): CatalogEntry {
  return {
    id, name, category: 'Sports', source: 'ESPN',
    description: `Live scores and game status — ${name}.`,
    api: {
      url: `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`, refresh: 60,
      transform: 'espnScores',
      map: { kind: 'list', root: 'items', title: 'title', sub: 'sub', value: 'value', format: 'raw' },
    },
    defaultSize: { w: 420, h: 400 }, tags: ['live'],
  };
}

export const SPORTS: CatalogEntry[] = [
  espn('nba-scores', 'NBA Scores', 'basketball/nba'),
  espn('nfl-scores', 'NFL Scores', 'football/nfl'),
  espn('mlb-scores', 'MLB Scores', 'baseball/mlb'),
  espn('nhl-scores', 'NHL Scores', 'hockey/nhl'),
  espn('epl-scores', 'Premier League Scores', 'soccer/eng.1'),
  espn('ucl-scores', 'Champions League Scores', 'soccer/uefa.champions'),
  espn('cricket-scores', 'Cricket Scores', 'cricket/8048'),
  {
    id: 'f1-next', name: 'F1 Next Race', category: 'Sports', source: 'Jolpica (Ergast)',
    description: 'When and where the next Formula 1 grand prix happens.',
    api: {
      url: 'https://api.jolpi.ca/ergast/f1/current/next.json', refresh: 3600,
      map: { kind: 'table', rows: [
        { label: 'Race', path: 'MRData.RaceTable.Races.0.raceName' },
        { label: 'Circuit', path: 'MRData.RaceTable.Races.0.Circuit.circuitName' },
        { label: 'Country', path: 'MRData.RaceTable.Races.0.Circuit.Location.country' },
        { label: 'Date', path: 'MRData.RaceTable.Races.0.date' },
        { label: 'Round', path: 'MRData.RaceTable.Races.0.round' },
      ] },
    },
    defaultSize: { w: 380, h: 320 },
  },
  {
    id: 'f1-standings', name: 'F1 Driver Standings', category: 'Sports', source: 'Jolpica (Ergast)',
    description: 'Current Formula 1 championship standings.',
    api: {
      url: 'https://api.jolpi.ca/ergast/f1/current/driverstandings.json', refresh: 3600,
      map: {
        kind: 'list', root: 'MRData.StandingsTable.StandingsLists.0.DriverStandings',
        title: '={Driver.givenName} {Driver.familyName}', sub: 'Constructors.0.name', value: 'points', limit: 10, format: 'raw',
      },
    },
    defaultSize: { w: 380, h: 440 },
  },
  {
    id: 'chess-puzzle', name: 'Chess Daily Puzzle', category: 'Sports', source: 'Chess.com',
    description: 'Chess.com\'s puzzle of the day, as a board image.',
    api: {
      url: 'https://api.chess.com/pub/puzzle', refresh: 3600,
      map: { kind: 'image', src: 'image', caption: 'title', link: 'url' },
    },
    defaultSize: { w: 380, h: 420 },
  },
  {
    id: 'chess-player', name: 'Chess.com Player', category: 'Sports', source: 'Chess.com',
    description: 'Ratings for any Chess.com player.',
    api: {
      url: 'https://api.chess.com/pub/player/{user}/stats', refresh: 3600,
      map: { kind: 'table', rows: [
        { label: 'Rapid', path: 'chess_rapid.last.rating' },
        { label: 'Blitz', path: 'chess_blitz.last.rating' },
        { label: 'Bullet', path: 'chess_bullet.last.rating' },
        { label: 'Puzzles', path: 'tactics.highest.rating' },
      ] },
    },
    fields: [{ key: 'user', label: 'Username', type: 'text', default: 'hikaru' }],
    defaultSize: { w: 340, h: 300 },
  },
  {
    id: 'lichess-player', name: 'Lichess Player', category: 'Sports', source: 'Lichess',
    description: 'Ratings for any Lichess player.',
    api: {
      url: 'https://lichess.org/api/user/{user}', refresh: 3600,
      map: { kind: 'table', rows: [
        { label: 'Blitz', path: 'perfs.blitz.rating' },
        { label: 'Rapid', path: 'perfs.rapid.rating' },
        { label: 'Bullet', path: 'perfs.bullet.rating' },
        { label: 'Games', path: 'count.all' },
      ] },
    },
    fields: [{ key: 'user', label: 'Username', type: 'text', default: 'DrNykterstein' }],
    defaultSize: { w: 340, h: 300 },
  },
  {
    id: 'league-fixtures', name: 'League Fixtures', category: 'Sports', source: 'TheSportsDB',
    description: 'Next 8 fixtures in a chosen league (free tier).',
    api: {
      url: 'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id={league}', refresh: 3600,
      map: { kind: 'list', root: 'events', title: 'strEvent', sub: 'dateEvent', limit: 8 },
    },
    fields: [{ key: 'league', label: 'League', type: 'select', default: '4328', options: [
      { value: '4328', label: 'Premier League' }, { value: '4335', label: 'La Liga' },
      { value: '4387', label: 'NBA' }, { value: '4391', label: 'NFL' }, { value: '4380', label: 'NHL' },
    ] }],
    defaultSize: { w: 400, h: 420 },
  },
];

const text = (id: string, name: string, source: string, description: string, url: string, textPath: string, attribution?: string, headers?: Record<string, string>): CatalogEntry => ({
  id, name, category: 'Fun', source, description,
  api: { url, refresh: 900, headers, map: { kind: 'text', text: textPath, attribution } },
  defaultSize: { w: 360, h: 240 },
});

export const FUN: CatalogEntry[] = [
  text('joke', 'Random Joke', 'Official Joke API', 'Setup-and-punchline joke, refreshed every 15 minutes.',
    'https://official-joke-api.appspot.com/random_joke', '={setup} — {punchline}'),
  text('dad-joke', 'Dad Joke', 'icanhazdadjoke', 'A certified dad joke.',
    'https://icanhazdadjoke.com/', 'joke', undefined, { Accept: 'application/json' }),
  text('chuck-norris', 'Chuck Norris Fact', 'chucknorris.io', 'A random Chuck Norris fact.',
    'https://api.chucknorris.io/jokes/random', 'value'),
  text('quote', 'Quote of the Moment', 'DummyJSON', 'A rotating inspirational quote.',
    'https://dummyjson.com/quotes/random', 'quote', 'author'),
  text('kanye-quote', 'Kanye Says', 'kanye.rest', 'A random Kanye West quote.',
    'https://api.kanye.rest/', 'quote', '=Kanye West'),
  text('affirmation', 'Daily Affirmation', 'affirmations.dev', 'A positive affirmation.',
    'https://www.affirmations.dev/', 'affirmation'),
  text('advice', 'Random Advice', 'Advice Slip', 'One slip of unsolicited advice.',
    'https://api.adviceslip.com/advice?t={_ts}', 'slip.advice'),
  text('useless-fact', 'Useless Fact', 'uselessfacts.jsph.pl', 'A completely useless but true fact.',
    'https://uselessfacts.jsph.pl/api/v2/facts/random', 'text'),
  text('cat-fact', 'Cat Fact', 'catfact.ninja', 'A random fact about cats.',
    'https://catfact.ninja/fact', 'fact'),
  text('got-quote', 'Game of Thrones Quote', 'GoT Quotes API', 'A random quote from Westeros.',
    'https://api.gameofthronesquotes.xyz/v1/random', 'sentence', 'character.name'),
  {
    id: 'trivia', name: 'Trivia Question', category: 'Fun', source: 'Open Trivia DB',
    description: 'A random trivia question with its answer.',
    api: {
      url: 'https://opentdb.com/api.php?amount=1', refresh: 900, transform: 'trivia',
      map: { kind: 'text', text: 'text', attribution: 'attribution' },
    },
    defaultSize: { w: 380, h: 280 },
  },
  {
    id: 'pokemon', name: 'Pokédex', category: 'Fun', source: 'PokéAPI',
    description: 'Official artwork for any Pokémon.',
    api: {
      url: 'https://pokeapi.co/api/v2/pokemon/{name}', refresh: 86400,
      map: { kind: 'image', src: 'sprites.other.official-artwork.front_default', caption: '={name} — #{id}' },
    },
    fields: [{ key: 'name', label: 'Pokémon', type: 'text', default: 'pikachu' }],
    defaultSize: { w: 340, h: 360 },
  },
  {
    id: 'rickmorty', name: 'Rick & Morty Character', category: 'Fun', source: 'Rick and Morty API',
    description: 'Character card by ID from the Rick and Morty universe.',
    api: {
      url: 'https://rickandmortyapi.com/api/character/{id}', refresh: 86400,
      map: { kind: 'image', src: 'image', caption: '={name} — {status}, {species}' },
    },
    fields: [{ key: 'id', label: 'Character #', type: 'number', default: 1 }],
    defaultSize: { w: 340, h: 360 },
  },
  {
    id: 'deck-draw', name: 'Card Draw', category: 'Fun', source: 'Deck of Cards API',
    description: 'Draw a card from a fresh deck on every refresh.',
    api: {
      url: 'https://deckofcardsapi.com/api/deck/new/draw/?count=1&t={_ts}', refresh: 900,
      map: { kind: 'image', src: 'cards.0.image', caption: '={cards.0.value} of {cards.0.suit}' },
    },
    defaultSize: { w: 300, h: 340 },
  },
  {
    id: 'anime-top', name: 'Top Anime', category: 'Fun', source: 'Jikan (MyAnimeList)',
    description: 'Highest-rated anime on MyAnimeList.',
    api: {
      url: 'https://api.jikan.moe/v4/top/anime?limit=10', refresh: 3600,
      map: { kind: 'list', root: 'data', title: 'title', value: 'score', link: 'url', format: 'raw' },
    },
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'tv-tonight', name: 'TV Tonight', category: 'Fun', source: 'TVmaze',
    description: 'What\'s airing on US TV today.',
    api: {
      url: 'https://api.tvmaze.com/schedule?country=US&date={_today}', refresh: 3600,
      map: { kind: 'list', root: '', title: '={show.name} — {name}', sub: 'airtime', limit: 10 },
    },
    defaultSize: { w: 400, h: 440 },
  },
  {
    id: 'tv-show', name: 'TV Show Lookup', category: 'Fun', source: 'TVmaze',
    description: 'Status and rating for any TV show.',
    api: {
      url: 'https://api.tvmaze.com/singlesearch/shows?q={q}', refresh: 86400,
      map: { kind: 'table', rows: [
        { label: 'Show', path: 'name' },
        { label: 'Status', path: 'status' },
        { label: 'Rating', path: 'rating.average' },
        { label: 'Network', path: 'network.name' },
        { label: 'Premiered', path: 'premiered' },
      ] },
    },
    fields: [{ key: 'q', label: 'Show name', type: 'text', default: 'Severance' }],
    defaultSize: { w: 360, h: 320 },
  },
  {
    id: 'urban-dictionary', name: 'Urban Dictionary', category: 'Fun', source: 'Urban Dictionary',
    description: 'Top definition for any slang term.',
    api: {
      url: 'https://api.urbandictionary.com/v0/define?term={term}', refresh: 86400,
      map: { kind: 'text', text: 'list.0.definition', attribution: '=<term>' },
    },
    fields: [{ key: 'term', label: 'Term', type: 'text', default: 'yeet' }],
    defaultSize: { w: 380, h: 280 },
  },
  {
    id: 'lyrics', name: 'Song Lyrics', category: 'Fun', source: 'lyrics.ovh',
    description: 'Fetch lyrics for any song.',
    api: {
      url: 'https://api.lyrics.ovh/v1/{artist}/{title}', refresh: 86400,
      map: { kind: 'text', text: 'lyrics', attribution: '=<artist> — <title>' },
    },
    fields: [
      { key: 'artist', label: 'Artist', type: 'text', default: 'Queen' },
      { key: 'title', label: 'Song', type: 'text', default: 'Bohemian Rhapsody' },
    ],
    defaultSize: { w: 400, h: 460 },
  },
];

export const FOOD: CatalogEntry[] = [
  {
    id: 'random-recipe', name: 'Random Recipe', category: 'Food & Drink', source: 'TheMealDB',
    description: 'A random dish with photo — refresh for a new dinner idea.',
    api: {
      url: 'https://www.themealdb.com/api/json/v1/1/random.php', refresh: 900,
      map: { kind: 'image', src: 'meals.0.strMealThumb', caption: '={meals.0.strMeal} ({meals.0.strArea})', link: 'meals.0.strSource' },
    },
    defaultSize: { w: 380, h: 380 },
  },
  {
    id: 'random-cocktail', name: 'Random Cocktail', category: 'Food & Drink', source: 'TheCocktailDB',
    description: 'A random cocktail with its glass and photo.',
    api: {
      url: 'https://www.thecocktaildb.com/api/json/v1/1/random.php', refresh: 900,
      map: { kind: 'image', src: 'drinks.0.strDrinkThumb', caption: '={drinks.0.strDrink} — {drinks.0.strGlass}' },
    },
    defaultSize: { w: 380, h: 380 },
  },
  {
    id: 'breweries', name: 'Brewery Finder', category: 'Food & Drink', source: 'Open Brewery DB',
    description: 'Breweries in any city.',
    api: {
      url: 'https://api.openbrewerydb.org/v1/breweries?by_city={city}&per_page=8', refresh: 86400,
      map: { kind: 'list', root: '', title: 'name', sub: '={brewery_type} — {street}' },
    },
    fields: [{ key: 'city', label: 'City', type: 'text', default: 'Portland' }],
    defaultSize: { w: 380, h: 400 },
  },
  {
    id: 'fruit-facts', name: 'Fruit Nutrition', category: 'Food & Drink', source: 'Fruityvice',
    description: 'Nutrition facts per 100 g for any fruit.',
    api: {
      url: 'https://fruityvice.com/api/fruit/{fruit}', refresh: 86400,
      map: { kind: 'table', rows: [
        { label: 'Fruit', path: 'name' },
        { label: 'Calories', path: 'nutritions.calories' },
        { label: 'Sugar', path: 'nutritions.sugar', suffix: ' g' },
        { label: 'Carbs', path: 'nutritions.carbohydrates', suffix: ' g' },
        { label: 'Protein', path: 'nutritions.protein', suffix: ' g' },
      ] },
    },
    fields: [{ key: 'fruit', label: 'Fruit', type: 'text', default: 'banana' }],
    defaultSize: { w: 340, h: 320 },
  },
  {
    id: 'food-product', name: 'Food Product Lookup', category: 'Food & Drink', source: 'Open Food Facts',
    description: 'Scan any product barcode for name, brand, and Nutri-Score.',
    api: {
      url: 'https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=product_name,brands,nutriscore_grade,nova_group',
      refresh: 86400,
      map: { kind: 'table', rows: [
        { label: 'Product', path: 'product.product_name' },
        { label: 'Brand', path: 'product.brands' },
        { label: 'Nutri-Score', path: 'product.nutriscore_grade' },
        { label: 'NOVA group', path: 'product.nova_group' },
      ] },
    },
    fields: [{ key: 'barcode', label: 'Barcode (EAN)', type: 'text', default: '3017620422003' }],
    defaultSize: { w: 360, h: 300 },
  },
];
