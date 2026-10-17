const { TMDB_KEY, TMDB_READ_ACCESS_TOKEN, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env

for (const [name, value] of Object.entries({ SUPABASE_URL, SUPABASE_SECRET_KEY })) {
  if (!value || value.startsWith('your_')) {
    throw new Error(`Set ${name} in sync.env before running the movie sync.`)
  }
}

if ((!TMDB_KEY || TMDB_KEY.startsWith('your_'))
  && (!TMDB_READ_ACCESS_TOKEN || TMDB_READ_ACCESS_TOKEN.startsWith('your_'))) {
  throw new Error('Set TMDB_KEY (v3 API key) or TMDB_READ_ACCESS_TOKEN (v4 read access token) in sync.env.')
}

const tmdbRequest = async (path) => {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  const headers = {}
  if (TMDB_READ_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${TMDB_READ_ACCESS_TOKEN}`
  } else {
    url.searchParams.set('api_key', TMDB_KEY)
  }
  const response = await fetch(url, { headers })
  if (!response.ok) {
    const body = await response.text()
    const hint = response.status === 401
      ? ' Verify the TMDB v3 API key, or use TMDB_READ_ACCESS_TOKEN for a v4 read access token.'
      : ''
    throw new Error(`TMDB request failed (${response.status}): ${body}.${hint}`)
  }
  return response.json()
}

const { results } = await tmdbRequest('/movie/now_playing?region=IN')
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })
const movieDetails = await Promise.all(results.map(movie => tmdbRequest(`/movie/${movie.id}`)))
const rows = []
const skippedTitles = []

for (const [index, movie] of results.entries()) {
  const details = movieDetails[index]
  if (!details.poster_path || !details.runtime) {
    skippedTitles.push(movie.title)
    continue
  }

  rows.push({
    tmdb_id: movie.id,
    title: movie.title,
    genre: details.genres.map(genre => genre.name).join(', ') || 'Uncategorized',
    language: languageNames.of(movie.original_language) || movie.original_language,
    rating: movie.vote_average,
    duration_minutes: details.runtime,
    tag: 'NOW PLAYING',
    poster_url: `https://image.tmdb.org/t/p/w500${details.poster_path}`,
    backdrop_url: details.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
      : null,
    synopsis: movie.overview || '',
    featured: false,
    active: true,
  })
}

if (skippedTitles.length) {
  console.warn(`Skipped movies without a poster or runtime: ${skippedTitles.join(', ')}`)
}

if (rows.length === 0) {
  throw new Error('TMDB returned no movies with the metadata required by the catalog.')
}

const url = new URL('/rest/v1/movies', SUPABASE_URL)
url.searchParams.set('on_conflict', 'tmdb_id')
const response = await fetch(url, {
  method: 'POST',
  headers: {
    apikey: SUPABASE_SECRET_KEY,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
})
const responseText = await response.text()
console.log(response.status, responseText)

if (!response.ok) {
  if (responseText.includes('PGRST204')) {
    throw new Error(
      'The Supabase movies table is missing columns required by this app. '
      + 'Run supabase/schema.sql in the SQL Editor for the project configured in sync.env, '
      + 'then retry the sync.',
    )
  }
  throw new Error(`Supabase movie sync failed (${response.status}).`)
}
console.log(`Synced ${rows.length} movies from TMDB.`)
