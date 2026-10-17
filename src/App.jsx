import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import './Auth.css'
import './App.css'
import './Booking.css'
import './Profile.css'
import './Visual.css'

const demoMovies = [
  { id: 1, title: 'The Last Horizon', genre: 'Sci-fi', language: 'English', rating: '8.9', duration: '2h 24m', tag: 'NOW SHOWING', image: 'photo-1446776811953-b23d57bd21aa', color: '#1c3451', description: 'One last journey. An entire universe at stake.', reviews: [{ name: 'Maya R.', text: 'The kind of film that makes you forget to blink. Absolutely stunning.', stars: 5 }, { name: 'Arjun K.', text: 'A beautiful, big-screen experience from start to finish.', stars: 5 }] },
  { id: 2, title: 'Vaanam Vellum', genre: 'Drama', language: 'Tamil', rating: '9.1', duration: '2h 16m', tag: 'TRENDING', image: 'photo-1519681393784-d120267933ba', color: '#49335d', description: 'Some dreams are written in the stars.', reviews: [{ name: 'Kavya S.', text: 'Heartfelt storytelling and a soundtrack that stays with you.', stars: 5 }, { name: 'Rishi P.', text: 'Tamil cinema at its most moving. Bring tissues!', stars: 5 }] },
  { id: 3, title: 'The Grand Heist', genre: 'Thriller', language: 'English', rating: '8.4', duration: '2h 08m', tag: 'NEW RELEASE', image: 'photo-1519608487953-e999c86e7455', color: '#264654', description: 'The perfect plan. The wrong people.', reviews: [{ name: 'Joel M.', text: 'A clever, twisty ride. The ending got the whole theatre.', stars: 4 }, { name: 'Nina D.', text: 'Crisp pacing and a cast that really delivers.', stars: 5 }] },
  { id: 4, title: 'Chennai Expressway', genre: 'Action', language: 'Tamil', rating: '8.2', duration: '2h 32m', tag: 'FAN FAVOURITE', image: 'photo-1519608487953-e999c86e7455', color: '#7b472e', description: 'One city. One night. No way back.', reviews: [{ name: 'Vijay R.', text: 'Mass moments, brilliant stunts, full paisa vasool.', stars: 5 }, { name: 'Nandini P.', text: 'A proper big-screen action entertainer.', stars: 4 }] },
  { id: 5, title: 'Letters to June', genre: 'Romance', language: 'English', rating: '7.9', duration: '1h 58m', tag: 'A LOVE STORY', image: 'photo-1470252649378-9c29740c9fa8', color: '#8a524a', description: 'A love story told one letter at a time.', reviews: [{ name: 'Sara L.', text: 'Soft, sincere, and unexpectedly lovely.', stars: 5 }, { name: 'Dev A.', text: 'A quiet little gem. See it with someone you love.', stars: 4 }] },
  { id: 6, title: 'Puli Theeran', genre: 'Action', language: 'Tamil', rating: '8.7', duration: '2h 21m', tag: 'NOW SHOWING', image: 'photo-1511497584788-876760111969', color: '#354632', description: 'An ancient promise. A warrior reborn.', reviews: [{ name: 'Pranav G.', text: 'Epic visuals and a roaring crowd. Loved every minute.', stars: 5 }, { name: 'Meera V.', text: 'The interval block alone is worth the ticket.', stars: 5 }] },
]

const imageUrl = (id, width = 800) => id?.startsWith('http') ? id : `https://images.unsplash.com/${id || 'photo-1489599849927-2ee91cede3ba'}?auto=format&fit=crop&w=${width}&q=85`
const times = ['10:30 AM', '1:45 PM', '4:20 PM', '7:15 PM', '10:00 PM']
const snackMenu = [{ name: 'Classic popcorn', detail: 'Buttery, warm & impossible to share', price: 180, emoji: '🍿' }, { name: 'Nachos & salsa', detail: 'Crunchy chips, zesty salsa', price: 220, emoji: '🧀' }, { name: 'Cola combo', detail: 'Two chilled drinks, one large popcorn', price: 390, emoji: '🥤' }]

const formatDuration = (minutes) => `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
const formatTime = (value) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
const formatDateKey = (value) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date(value))
const formatTicketDate = (value) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
}).format(new Date(value))

function AuthScreen({ initialError = '', recoveryMode = false, onPasswordUpdated }) {
  const [mode, setMode] = useState('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(initialError)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!supabase) {
      setError('Connect your Supabase project to enable secure sign-in.')
      return
    }

    setBusy(true)
    try {
      const result = recoveryMode
        ? await supabase.auth.updateUser({ password })
        : mode === 'signup'
          ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name.trim() } },
          })
          : await supabase.auth.signInWithPassword({ email, password })

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (recoveryMode) {
        setMessage('Your password has been updated.')
        window.setTimeout(() => onPasswordUpdated?.(), 1200)
        return
      }
      if (mode === 'signup' && !result.data.session) {
        setMessage('Your account is ready. Check your email to confirm, then sign in.')
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the authentication service. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-photo">
        <img src={imageUrl('photo-1489599849927-2ee91cede3ba', 1500)} alt="An intimate old-fashioned cinema auditorium" />
        <div className="auth-photo-shade" />
        <a className="brand auth-brand" href="#" aria-label="Reeltime home"><span className="brand-mark"><Icon name="ticket" size={20} /></span>reel<span>time</span><i>.</i></a>
        <div className="auth-photo-copy"><span className="section-label">GOOD STORIES. GOOD COMPANY.</span><h1>A little<br /><em>movie magic.</em></h1><p>Find your film, bring your people,<br />and let the lights go down.</p><div className="film-strip"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div></div>
        <span className="auth-photo-credit">YOUR NEXT FAVOURITE NIGHT STARTS HERE</span>
      </section>
      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><a className="brand" href="#"><span className="brand-mark"><Icon name="ticket" size={19} /></span>reel<span>time</span><i>.</i></a><span>CHENNAI · EST. TONIGHT</span></div>
          <div className="auth-kicker"><span className="live-dot" /> YOUR SEAT IS WAITING</div>
          <h2>{recoveryMode ? <>A fresh<br /><em>start.</em></> : mode === 'signup' ? <>Make yourself<br /><em>at home.</em></> : <>Welcome<br /><em>back.</em></>}</h2>
          <p className="auth-intro">{recoveryMode ? 'Choose a new password for your account.' : mode === 'signup' ? 'A little account makes movie night a lot easier.' : 'The previews are almost over. Come on in.'}</p>
          {!recoveryMode && <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); setMessage('') }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Create account</button>
          </div>}
          <form className="auth-form" onSubmit={submit}>
            {!recoveryMode && mode === 'signup' && <label>Your name<input value={name} onChange={event => setName(event.target.value)} placeholder="What should we call you?" autoComplete="name" required /></label>}
            {!recoveryMode && <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>}
            <label>{recoveryMode ? 'New password' : 'Password'}<input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'signup' || recoveryMode ? 'At least 6 characters' : 'Your password'} minLength={6} autoComplete={mode === 'signup' || recoveryMode ? 'new-password' : 'current-password'} required /></label>
            {!recoveryMode && mode === 'signin' && <button className="forgot-password" type="button" onClick={async () => {
              setError('')
              setMessage('')
              if (!supabase) { setError('Connect your Supabase project before resetting passwords.'); return }
              if (!email) { setError('Enter your email address first.'); return }
              try {
                const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
                if (resetError) setError(resetError.message)
                else setMessage('If an account exists for that email, a password reset link is on its way.')
              } catch (requestError) {
                setError(requestError.message || 'Could not reach the authentication service. Please try again.')
              }
            }}>Forgot password?</button>}
            {error && <p className="auth-feedback error" role="alert">{error}</p>}
            {message && <p className="auth-feedback success" role="status">{message}</p>}
            {!supabase && <p className="auth-feedback setup" role="status">One small setup step: add your Supabase URL and anon key to <code>.env</code> to turn on secure accounts.</p>}
            <button className="auth-submit" type="submit" disabled={busy || !supabase}>{busy ? 'One moment…' : recoveryMode ? 'Update password' : mode === 'signup' ? 'Create your account' : 'Sign in'}<Icon name="arrow" size={17} /></button>
          </form>
          {!recoveryMode && <p className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'First time here?'} <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setMessage('') }}>{mode === 'signup' ? 'Sign in' : 'Create an account'}</button></p>}
          <div className="auth-footnote"><span>✳</span> Made for people who love the movies.</div>
        </div>
      </section>
    </main>
  )
}

function Icon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    ticket: <><path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 1 0-6V5H2v4Z" /><path d="M13 5v2m0 4v2m0 4v2" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function App() {
  const [authLoading, setAuthLoading] = useState(Boolean(supabase))
  const [user, setUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [movies, setMovies] = useState(() => supabase ? [] : demoMovies)
  const [liveData, setLiveData] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [filter, setFilter] = useState('All films')
  const [query, setQuery] = useState('')
  const [booking, setBooking] = useState(null)
  const [profileOpen, setProfileOpen] = useState(() => window.location.hash === '#profile')
  const [profileTab, setProfileTab] = useState('profile')
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [emailUpdates, setEmailUpdates] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [ticketPreviews, setTicketPreviews] = useState([])
  const [ticketLoading, setTicketLoading] = useState(false)
  const [ticketClearing, setTicketClearing] = useState(false)
  const [ticketError, setTicketError] = useState('')
  const [bookingSaving, setBookingSaving] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [savedPreviewId, setSavedPreviewId] = useState('')
  const [step, setStep] = useState(0)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedSeats, setSelectedSeats] = useState([])
  const [snacks, setSnacks] = useState({})
  const [toast, setToast] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hey there! 🎬 I’m Lumi, your movie-night helper. Ask me about tickets, refunds, showtimes, or anything else.' }])
  const [reviewMovie, setReviewMovie] = useState(null)
  const [reviews, setReviews] = useState(() => supabase ? [] : demoMovies.map(movie => ({ ...movie.reviews[0], movieId: movie.id, title: movie.title, genre: movie.genre, language: movie.language, rating: movie.rating, image: movie.image })))
  const [reviewText, setReviewText] = useState('')
  const [reviewStars, setReviewStars] = useState(5)
  const featuredMovie = movies.find(movie => movie.featured) || movies[0]
  const bookingShowtimes = !booking ? [] : liveData
    ? booking.showtimes.map(showtime => ({
      id: showtime.id,
      time: formatTime(showtime.starts_at),
      date: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(showtime.starts_at)),
      dateKey: formatDateKey(showtime.starts_at),
      weekday: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(new Date(showtime.starts_at)),
      day: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit' }).format(new Date(showtime.starts_at)),
      month: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' }).format(new Date(showtime.starts_at)),
      format: showtime.format,
      theater: showtime.theater_name,
      location: showtime.location,
      city: showtime.city,
      startsAt: showtime.starts_at,
      ticket_price: showtime.ticket_price,
    }))
    : times.map(time => ({
      id: time,
      time,
      dateKey: formatDateKey(new Date().toISOString()),
      weekday: 'Today',
      day: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit' }).format(new Date()),
      month: new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', month: 'short' }).format(new Date()),
      format: 'Dolby Atmos',
      theater: 'Luxe Cinemas, Phoenix Marketcity',
      location: 'Chennai',
    }))
  const bookingDates = [...new Map(bookingShowtimes.map(showtime => [showtime.dateKey, {
    key: showtime.dateKey,
    weekday: showtime.weekday,
    day: showtime.day,
    month: showtime.month,
  }])).values()]
  const activeBookingDate = bookingDates.find(date => date.key === selectedDate) || bookingDates[0]
  const dateShowtimes = bookingShowtimes.filter(showtime => showtime.dateKey === activeBookingDate?.key)
  const theaterGroups = [...new Map(dateShowtimes.map(showtime => [
    `${showtime.theater}|${showtime.location}`,
    { theater: showtime.theater, location: showtime.location, showtimes: [] },
  ])).values()]
  theaterGroups.forEach(group => {
    group.showtimes = dateShowtimes.filter(showtime => showtime.theater === group.theater && showtime.location === group.location)
  })
  const selectedShowtime = bookingShowtimes.find(showtime => showtime.id === selectedTime)
  const selectedTimeLabel = selectedShowtime?.time || selectedTime
  const ticketTotal = selectedSeats.length * (selectedShowtime?.ticket_price ?? 240)
  const snackTotal = snackMenu.reduce((total, item) => total + item.price * (snacks[item.name] || 0), 0)

  useEffect(() => {
    if (!supabase) return undefined
    let mounted = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
        const currentUser = session?.user || null
        setUser(currentUser)
        if (currentUser && window.location.hash === '#profile') {
          setProfileName(currentUser.user_metadata.full_name || '')
          setProfilePhone(currentUser.user_metadata.phone_number || '')
          setEmailUpdates(Boolean(currentUser.user_metadata.email_updates))
        }
        setAuthLoading(false)
      }
    })
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setAuthError(error.message)
      const currentUser = data.session?.user || null
      setUser(currentUser)
      if (currentUser && window.location.hash === '#profile') {
        setProfileName(currentUser.user_metadata.full_name || '')
        setProfilePhone(currentUser.user_metadata.phone_number || '')
        setEmailUpdates(Boolean(currentUser.user_metadata.email_updates))
      }
      setAuthLoading(false)
    }).catch(error => {
      if (!mounted) return
      setAuthError(error.message || 'Could not connect to the authentication service.')
      setAuthLoading(false)
    })
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const syncProfileRoute = () => setProfileOpen(window.location.hash === '#profile')
    window.addEventListener('hashchange', syncProfileRoute)
    window.addEventListener('popstate', syncProfileRoute)
    return () => {
      window.removeEventListener('hashchange', syncProfileRoute)
      window.removeEventListener('popstate', syncProfileRoute)
    }
  }, [])

  useEffect(() => {
    if (!supabase || !user) return undefined
    let mounted = true
    const loadCatalog = async () => {
      setCatalogLoading(true)
      setCatalogError('')
      const [movieResult, showtimeResult] = await Promise.all([
        supabase.from('movies').select('*').eq('active', true).order('featured', { ascending: false }).order('title'),
        supabase.from('showtimes').select('*').eq('active', true).eq('city', 'Chennai').gte('starts_at', new Date().toISOString()).order('starts_at'),
      ])
      if (!mounted) return
      if (movieResult.error) {
        setCatalogError(`Could not load live movies: ${movieResult.error.message}`)
        setCatalogLoading(false)
        return
      }
      const catalogWarnings = []
      if (showtimeResult.error) {
        catalogWarnings.push(`Movies are live, but showtimes could not be loaded: ${showtimeResult.error.message}`)
      }
      const showtimesByMovie = new Map()
      const showtimes = showtimeResult.data || []
      showtimes.forEach(showtime => {
        const group = showtimesByMovie.get(showtime.movie_id) || []
        group.push(showtime)
        showtimesByMovie.set(showtime.movie_id, group)
      })
      const liveMovies = movieResult.data
        .map((movie, index) => ({
          id: movie.id,
          title: movie.title,
          genre: movie.genre,
          language: movie.language,
          rating: movie.rating == null ? '—' : Number(movie.rating).toFixed(1),
          duration: formatDuration(movie.duration_minutes),
          tag: movie.tag,
          image: movie.poster_url,
          backdrop: movie.backdrop_url,
          color: ['#1c3451', '#49335d', '#264654', '#7b472e', '#8a524a', '#354632'][index % 6],
          description: movie.synopsis,
          featured: movie.featured,
          showtimes: showtimesByMovie.get(movie.id) || [],
        }))
      setMovies(liveMovies)
      setLiveData(true)

      if (liveMovies.length) {
        const reviewsResult = await supabase
          .from('reviews')
          .select('*')
          .in('movie_id', liveMovies.map(movie => movie.id))
          .order('created_at', { ascending: false })
          .limit(12)
        if (!mounted) return
        if (reviewsResult.error) {
          catalogWarnings.push(`Reviews could not be loaded: ${reviewsResult.error.message}`)
        } else {
          const moviesById = new Map(liveMovies.map(movie => [movie.id, movie]))
          setReviews(reviewsResult.data.map(review => ({
            name: review.display_name,
            text: review.body,
            stars: review.stars,
            movieId: review.movie_id,
            title: moviesById.get(review.movie_id)?.title || 'Now showing',
            genre: moviesById.get(review.movie_id)?.genre || '',
            language: moviesById.get(review.movie_id)?.language || '',
            rating: moviesById.get(review.movie_id)?.rating || '—',
            image: moviesById.get(review.movie_id)?.image || '',
          })))
        }
      } else {
        setReviews([])
      }
      setCatalogError(catalogWarnings.join(' '))
      setCatalogLoading(false)
    }

    const refreshCatalog = () => loadCatalog().catch(error => {
      if (!mounted) return
      setCatalogError(`Could not load live listings: ${error.message || 'Unexpected connection error.'}`)
      setCatalogLoading(false)
    })
    refreshCatalog()
    const channel = supabase
      .channel('reeltime-live-listings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, refreshCatalog)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'showtimes' }, refreshCatalog)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, refreshCatalog)
      .subscribe((status, error) => {
        if (mounted && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) {
          setCatalogError(`Live updates are unavailable: ${error?.message || status}`)
        }
      })
    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (!profileOpen || profileTab !== 'tickets' || !supabase || !user) return undefined
    let mounted = true
    const loadTicketPreviews = async () => {
      setTicketLoading(true)
      setTicketError('')
      const { data, error } = await supabase
        .from('booking_previews')
        .select('id, movie_title, theater_name, location, city, starts_at, format, seats, snacks, total, status, created_at')
        .order('created_at', { ascending: false })
      if (!mounted) return
      if (error) {
        setTicketError(`Could not load saved booking previews: ${error.message}. Run the updated supabase/schema.sql in your Supabase project, then try again.`)
      } else {
        setTicketPreviews(data)
      }
      setTicketLoading(false)
    }
    loadTicketPreviews().catch(error => {
      if (!mounted) return
      setTicketError(`Could not load saved booking previews: ${error.message || 'Unexpected connection error.'}`)
      setTicketLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [profileOpen, profileTab, user])

  const clearBookingHistory = async () => {
    if (!supabase || !user || ticketClearing) return
    if (!window.confirm('Clear your entire booking history? This cannot be undone.')) return
    setTicketClearing(true)
    setTicketError('')
    try {
      const { error } = await supabase
        .from('booking_previews')
        .delete()
        .eq('user_id', user.id)
      if (error) throw error
      setTicketPreviews([])
    } catch (error) {
      setTicketError(`Could not clear your booking history: ${error.message || 'Please try again.'} Run the updated supabase/schema.sql in your Supabase project if deletion is not enabled.`)
    } finally {
      setTicketClearing(false)
    }
  }

  const filteredMovies = useMemo(() => movies.filter(movie => {
    const matchesFilter = filter === 'All films' || movie.genre === filter || movie.language === filter
    const matchesQuery = `${movie.title} ${movie.genre} ${movie.language}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  }), [filter, query, movies])

  const showToast = (text) => {
    setToast(text)
    window.setTimeout(() => setToast(''), 3000)
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) showToast(`Could not sign out: ${error.message}`)
    } catch (requestError) {
      showToast(`Could not sign out: ${requestError.message || 'Please try again.'}`)
    }
  }

  const openProfile = () => {
    setProfileName(user.user_metadata.full_name || '')
    setProfilePhone(user.user_metadata.phone_number || '')
    setEmailUpdates(Boolean(user.user_metadata.email_updates))
    setProfileTab('profile')
    setProfileMessage('')
    setProfileError('')
    window.history.pushState(null, '', '#profile')
    setProfileOpen(true)
  }

  const returnToMovies = () => {
    window.history.pushState(null, '', '#movies')
    setProfileOpen(false)
  }

  const saveProfile = async (event) => {
    event.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')
    setProfileError('')
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: profileName.trim(),
          phone_number: profilePhone.trim(),
          email_updates: emailUpdates,
        },
      })
      if (error) throw error
      setUser(data.user)
      setProfileMessage('Your profile and preferences have been saved.')
    } catch (requestError) {
      setProfileError(`Could not save your profile: ${requestError.message || 'Please try again.'}`)
    } finally {
      setProfileSaving(false)
    }
  }

  const saveBookingPreview = async () => {
    if (!supabase || !user || !liveData || !selectedShowtime?.startsAt) {
      setBookingError('A live showtime and signed-in Supabase account are required to save this booking.')
      return
    }
    setBookingSaving(true)
    setBookingError('')
    try {
      const snackItems = snackMenu
        .filter(item => snacks[item.name])
        .map(item => ({
          name: item.name,
          quantity: snacks[item.name],
          unit_price: item.price,
        }))
      const { data, error } = await supabase
        .from('booking_previews')
        .insert({
          user_id: user.id,
          movie_id: booking.id,
          showtime_id: selectedShowtime.id,
          movie_title: booking.title,
          theater_name: selectedShowtime.theater,
          location: selectedShowtime.location,
          city: selectedShowtime.city || 'Chennai',
          starts_at: selectedShowtime.startsAt,
          format: selectedShowtime.format,
          seats: selectedSeats,
          snacks: snackItems,
          total: Number((ticketTotal + snackTotal).toFixed(2)),
          status: 'preview',
        })
        .select('id')
        .single()
      if (error) throw error
      setSavedPreviewId(data.id)
      setStep(4)
    } catch (requestError) {
      const schemaHint = requestError.code === 'PGRST205'
        ? ' Run the updated supabase/schema.sql in your Supabase project, then retry.'
        : ''
      setBookingError(`Could not save this booking: ${requestError.message || 'Please try again.'}${schemaHint}`)
    } finally {
      setBookingSaving(false)
    }
  }

  const openBooking = (movie) => {
    if (liveData && !movie.showtimes.length) return
    const firstDate = movie.showtimes[0]?.starts_at
    setSelectedDate(liveData && firstDate ? formatDateKey(firstDate) : formatDateKey(new Date().toISOString()))
    setBooking(movie)
    setStep(0)
    setSelectedTime('')
    setSelectedSeats([])
    setSnacks({})
    setBookingError('')
    setSavedPreviewId('')
  }

  const toggleSeat = (seat) => setSelectedSeats(seats => seats.includes(seat) ? seats.filter(item => item !== seat) : [...seats, seat])

  const answerChat = (event) => {
    event.preventDefault()
    const question = chatInput.trim()
    if (!question) return
    const lower = question.toLowerCase()
    let answer = 'I can help with finding a film, choosing a showtime, food add-ons, or account questions. What would you like to know?'
    if (lower.includes('refund') || lower.includes('cancel')) answer = 'Refund rules depend on the cinema and its ticket policy. This preview does not take payment or issue refunds, so please check directly with the cinema for a real booking.'
    else if (lower.includes('seat')) answer = 'Choose a live showtime and select seats in the map. The seat map is currently a preview and does not reserve or verify seats with the cinema.'
    else if (lower.includes('food') || lower.includes('snack')) answer = 'Absolutely! You can add popcorn, nachos, or a cola combo to the booking preview. Snacks are not sent to a cinema until a real checkout is connected.'
    else if (lower.includes('ticket') || lower.includes('book')) answer = 'Find your film, tap Book tickets, select a live showtime, then preview your seats and snacks. This site does not yet reserve seats or take payment.'
    setMessages(list => [...list, { from: 'user', text: question }, { from: 'bot', text: answer }])
    setChatInput('')
  }

  const submitReview = async (event) => {
    event.preventDefault()
    if (!reviewText.trim()) return
    if (supabase && liveData) {
      try {
        const { error } = await supabase.from('reviews').insert({
          movie_id: reviewMovie.id,
          author_id: user.id,
          display_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'Movie lover',
          stars: reviewStars,
          body: reviewText.trim(),
        })
        if (error) {
          showToast(`Could not post review: ${error.message}`)
          return
        }
      } catch (requestError) {
        showToast(`Could not post review: ${requestError.message || 'Please try again.'}`)
        return
      }
    }
    setReviews(current => [...current, {
      name: 'You',
      text: reviewText.trim(),
      stars: reviewStars,
      movieId: reviewMovie.id,
      title: reviewMovie.title,
      genre: reviewMovie.genre,
      language: reviewMovie.language,
      rating: reviewMovie.rating,
      image: reviewMovie.image,
    }])
    setReviewMovie(null)
    setReviewText('')
    showToast('Thanks for sharing your review. It’s on its way!')
  }

  if (authLoading) {
    return <main className="auth-loading"><span className="brand-mark"><Icon name="ticket" size={20} /></span><p>Finding your seat…</p></main>
  }

  if (!user || recoveryMode) return <AuthScreen initialError={authError} recoveryMode={recoveryMode} onPasswordUpdated={() => setRecoveryMode(false)} />

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#movies" onClick={profileOpen ? returnToMovies : undefined} aria-label="ReelTime home"><span className="brand-mark"><Icon name="ticket" size={20} /></span>reel<span>time</span><i>.</i></a>
        <nav className="main-nav" aria-label="Main navigation">
          {profileOpen
            ? <a className="nav-active" href="#movies" onClick={returnToMovies}>Back to movies</a>
            : <><a className="nav-active" href="#movies">Movies</a><a href="#experience">The experience</a><a href="#reviews">Reviews</a><a href="#profile" onClick={event => { event.preventDefault(); openProfile() }}>Profile</a></>}
        </nav>
        <div className="top-actions">
          <span className="location-label"><Icon name="pin" size={17} /> Chennai <span className="chevron">⌄</span></span>
          <button className="avatar" aria-label="Open your profile" title={`View profile for ${user.email}`} onClick={openProfile}>{(user.user_metadata.full_name || user.email || 'M').charAt(0).toUpperCase()}</button>
        </div>
      </header>

       {profileOpen ? <main className="profile-page">
        <div className="profile-page-intro">
          <button type="button" className="profile-back-link" onClick={returnToMovies}><Icon name="arrow" size={16} /> Back to movies</button>
          <span className="section-label">YOUR REELTIME ACCOUNT</span>
          <h1>Your space.<br /><em>Your movie nights.</em></h1>
          <p>Keep your details, preferences, and saved bookings together.</p>
        </div>
        <section className="profile-page-layout" aria-label="Account settings">
          <aside className="profile-page-sidebar">
            <div className="profile-page-identity">
              <div className="profile-avatar">{(profileName || user.email || 'M').charAt(0).toUpperCase()}</div>
              <div><strong>{profileName || user.email?.split('@')[0] || 'Movie lover'}</strong><span>{user.email}</span></div>
            </div>
            <nav className="profile-page-tabs" aria-label="Profile sections">
              {[['profile', 'Profile details'], ['tickets', 'My bookings'], ['preferences', 'Preferences']].map(([tab, label]) => <button type="button" key={tab} className={profileTab === tab ? 'active' : ''} aria-current={profileTab === tab ? 'page' : undefined} onClick={() => { setProfileTab(tab); setProfileMessage(''); setProfileError('') }}>{label}<Icon name="arrow" size={15} /></button>)}
            </nav>
            <button type="button" className="profile-signout" onClick={signOut}>Sign out</button>
          </aside>
          <div className="profile-page-panel">
            <div className="profile-page-panel-heading"><span className="section-label">{profileTab === 'profile' ? 'ACCOUNT' : profileTab === 'tickets' ? 'BOOKING HISTORY' : 'YOUR EXPERIENCE'}</span><h2>{profileTab === 'profile' ? 'Profile details' : profileTab === 'tickets' ? 'My bookings' : 'Preferences'}</h2></div>
            {profileTab === 'profile' && <form className="profile-body" onSubmit={saveProfile}>
              <label>Full name<input value={profileName} onChange={event => setProfileName(event.target.value)} maxLength={100} autoComplete="name" /></label>
              <label>Email address<input value={user.email || ''} readOnly disabled /></label>
              <label>Phone number <span className="profile-optional">Optional</span><input type="tel" value={profilePhone} onChange={event => setProfilePhone(event.target.value)} maxLength={30} autoComplete="tel" placeholder="Add a contact number" /></label>
              {profileError && <p className="profile-feedback error" role="alert">{profileError}</p>}
              {profileMessage && <p className="profile-feedback success" role="status">{profileMessage}</p>}
              <button className="modal-next" type="submit" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save profile'} <Icon name="check" size={16} /></button>
            </form>}
            {profileTab === 'tickets' && <div className="profile-body profile-tickets">
              {ticketLoading && <p role="status">Loading your saved bookings…</p>}
              {ticketError && <p className="profile-feedback error" role="alert">{ticketError}</p>}
              {!ticketLoading && !ticketError && ticketPreviews.length > 0 && <button className="profile-clear-history" type="button" onClick={clearBookingHistory} disabled={ticketClearing}>{ticketClearing ? 'Clearing history…' : 'Clear booking history'}</button>}
              {!ticketLoading && !ticketError && ticketPreviews.length === 0 && <>
                <span className="profile-ticket-icon"><Icon name="ticket" size={25} /></span>
                <h3>No saved bookings yet</h3>
                <p>Bookings you save will appear here.</p>
              </>}
              {!ticketLoading && ticketPreviews.map(preview => <article className="profile-ticket-card" key={preview.id}>
                <div className="profile-ticket-card-heading"><strong>{preview.movie_title}</strong><span>BOOKING SAVED</span></div>
                <p>{formatTicketDate(preview.starts_at)}</p>
                <p>{preview.theater_name} · {preview.location}, {preview.city}</p>
                <p>{preview.format} · Seats {preview.seats.join(', ')}</p>
                {preview.snacks.length > 0 && <p>{preview.snacks.map(item => `${item.name} × ${item.quantity}`).join(', ')}</p>}
                <div className="profile-ticket-total"><span>Total shown</span><strong>₹{Number(preview.total).toFixed(2)}</strong></div>
                <small>Saved {formatTicketDate(preview.created_at)}</small>
              </article>)}
            </div>}
            {profileTab === 'preferences' && <form className="profile-body" onSubmit={saveProfile}>
              <div className="profile-preference">
                <div><strong>Email movie updates</strong><p>Choose whether you’d like to receive movie news and offers by email.</p></div>
                <input type="checkbox" checked={emailUpdates} onChange={event => setEmailUpdates(event.target.checked)} aria-label="Receive email movie updates" />
              </div>
              <p className="profile-note">This preference is saved to your account. Email notifications are not sent by the app yet.</p>
              {profileError && <p className="profile-feedback error" role="alert">{profileError}</p>}
              {profileMessage && <p className="profile-feedback success" role="status">{profileMessage}</p>}
              <button className="modal-next" type="submit" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save preferences'} <Icon name="check" size={16} /></button>
            </form>}
          </div>
        </section>
      </main> : <main>
        <section className="hero" aria-label="Featured film">
          <img className="hero-image" src={imageUrl(featuredMovie?.backdrop || featuredMovie?.image || 'photo-1489599849927-2ee91cede3ba', 1800)} alt="" />
          <div className="hero-shade" />
          <div className="hero-content">
            <span className="eyebrow"><span className="live-dot" /> {liveData ? 'LIVE FROM CHENNAI CINEMAS' : 'THE BIG SCREEN IS CALLING'}</span>
            <p className="hero-kicker">{liveData ? 'NOW SHOWING NEAR YOU' : 'THE MOVIEGOER’S EDIT'}</p>
            {featuredMovie ? <>
              <h1>{featuredMovie.title.split(' ').length > 1 ? <>{featuredMovie.title.split(' ')[0]}<br /><em>{featuredMovie.title.split(' ').slice(1).join(' ')}</em></> : featuredMovie.title}</h1>
              <p className="hero-description">{featuredMovie.description || 'Find a seat, settle in, and let the story take over.'}</p>
              <div className="hero-meta">{featuredMovie.rating !== '—' && <span><Icon name="star" size={15} /> {featuredMovie.rating}</span>}<span>{featuredMovie.genre}</span><span><Icon name="clock" size={15} /> {featuredMovie.duration}</span><span className="language-tag">{featuredMovie.language.toUpperCase()}</span></div>
              <button className="primary-button hero-cta" onClick={() => openBooking(featuredMovie)} disabled={liveData && !featuredMovie.showtimes.length} title={liveData && !featuredMovie.showtimes.length ? 'No showtimes available yet' : undefined}>{liveData && !featuredMovie.showtimes.length ? 'Showtimes coming soon' : 'Book tickets'} <Icon name="arrow" size={17} /></button>
            </> : <><h1>Stories worth<br /><em>staying for.</em></h1><p className="hero-description">Nothing on the schedule just yet. Check back soon for a new movie night.</p></>}
          </div>
          <div className="hero-note"><span className="note-number">01</span><span>BIG STORIES.<br />BETTER SEATS.</span><span className="note-divider" /> <span>Scroll to explore <span className="down-arrow">↓</span></span></div>
          <div className="hero-indicator"><span /> <span /> <span /></div>
        </section>

        <section className="content-wrap" id="movies">
          <div className="section-topline"><span className="section-label">{liveData ? 'LIVE CATALOG · CHENNAI' : 'NOW PLAYING IN CHENNAI'}</span><span className="section-counter">{filteredMovies.length} {filteredMovies.length === 1 ? 'FILM' : 'FILMS'} · {liveData ? 'UPDATED LIVE' : 'CURATED EDITION'}</span></div>
          <div className="section-heading-row"><div><h2>Find your <em>next favourite.</em></h2><p className="section-subtitle">From first-day-first-show to last-minute plans — it all starts here.</p></div>
            <label className="search-box"><Icon name="search" size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find a film..." aria-label="Search movies" /><kbd>⌘ K</kbd></label>
          </div>
          {catalogError && <p className="catalog-error" role="alert">{catalogError}</p>}
          <div className="filter-row" role="group" aria-label="Filter movies">
            {['All films', ...new Set(movies.flatMap(movie => [movie.language, movie.genre]))].map(category => <button key={category} className={`filter-chip ${filter === category ? 'selected' : ''}`} onClick={() => setFilter(category)}>{category}</button>)}
            <span className="showing-count">{liveData ? 'LIVE' : 'REELTIME EDITION'}</span>
          </div>
          {catalogLoading ? <div className="empty-state"><span className="loading-mark">✳</span><h3>Finding films.</h3><p>Checking the live movie catalog around Chennai.</p></div> : filteredMovies.length ? <div className="movie-grid">{filteredMovies.map((movie, index) => <article className="movie-card" key={movie.id} style={{ '--poster-color': movie.color, '--delay': `${index * 70}ms` }}>
            <button className="poster-button" aria-label={liveData && !movie.showtimes.length ? `${movie.title}, showtimes coming soon` : `Book ${movie.title}`} onClick={() => openBooking(movie)} disabled={liveData && !movie.showtimes.length} title={liveData && !movie.showtimes.length ? 'No showtimes available yet' : undefined}><div className="poster-wrap"><img className="poster-image" src={imageUrl(movie.image, 700)} alt="" /><div className="poster-gradient" /><span className="poster-tag">{movie.tag}</span><div className="poster-title"><span>{movie.language.toUpperCase()} · {movie.genre.toUpperCase()}</span><h3>{movie.title}</h3></div><span className="poster-rating"><Icon name="star" size={13} /> {movie.rating}</span><span className="poster-hover"><Icon name="ticket" size={16} /> {liveData && !movie.showtimes.length ? 'Showtimes coming soon' : 'Select showtime'}</span></div></button>
            <div className="movie-info"><div><span className="movie-duration">{movie.duration} <span>·</span> {movie.language}</span><p className="movie-caption">{movie.description}</p></div><button className="card-book" onClick={() => openBooking(movie)} aria-label={`Book tickets for ${movie.title}`} disabled={liveData && !movie.showtimes.length} title={liveData && !movie.showtimes.length ? 'No showtimes available yet' : undefined}><Icon name="arrow" size={19} /></button></div>
          </article>)}</div> : <div className="empty-state"><span>✳</span><h3>{liveData ? 'No films in the live catalog yet.' : 'No films found just yet.'}</h3><p>{liveData ? 'Sync the movie catalog or check back later for new listings.' : 'Try another search or browse all films.'}</p>{!liveData && <button className="filter-chip selected" onClick={() => { setQuery(''); setFilter('All films') }}>Show all films</button>}</div>}
        </section>

        <section className="experience-band" id="experience">
          <div className="experience-inner"><span className="section-label">MORE THAN JUST A MOVIE</span><h2>Make a night of it.</h2><p>Your favourite snacks, the comfiest seats, and that moment<br className="desktop-break" /> the lights go down. We’ve got your evening covered.</p><button className="text-link" onClick={() => showToast('Your best movie night starts with a ticket. Pick a film above!')}>See what’s on <Icon name="arrow" size={16} /></button>
          <div className="perks"><div><span className="perk-icon">✳</span><strong>Pick your perfect seat</strong><small>No seat lottery. Your spot is yours.</small></div><div><span className="perk-icon">◉</span><strong>Snacks without the queue</strong><small>Order ahead. Skip the wait.</small></div><div><span className="perk-icon">♡</span><strong>Good films, honest reviews</strong><small>Real thoughts from real moviegoers.</small></div></div></div>
          <div className="experience-stamp"><span>YOUR SEAT</span><strong>IS<br />WAITING</strong><span>✳ &nbsp; CHENNAI &nbsp; ✳</span></div>
        </section>

        <section className="reviews-section content-wrap" id="reviews">
          <div className="section-topline"><span className="section-label">WORD ON THE STREET</span><span className="section-counter">REAL PEOPLE · REAL REVIEWS</span></div>
          <div className="section-heading-row review-heading"><div><h2>Just saw it? <em>Say something.</em></h2><p className="section-subtitle">A great recommendation is the best part of movie night.</p></div><button className="outline-button" onClick={() => setReviewMovie(movies[0])}>Write a review <span>＋</span></button></div>
          {reviews.length ? <div className="review-grid">{reviews.slice(-3).reverse().map((review, index) => <article className="review-card" key={`${review.movieId}-${review.name}-${index}`}><div className="review-film"><img src={imageUrl(review.image, 120)} alt="" /><div><strong>{review.title}</strong><span>{review.genre} · {review.language}</span></div><span className="review-film-rating"><Icon name="star" size={12} /> {review.rating}</span></div><div className="review-quote">“{review.text}”</div><div className="review-byline"><span className="review-avatar">{review.name.charAt(0)}</span><strong>{review.name}</strong><span className="review-stars">{'★'.repeat(review.stars)}</span></div></article>)}</div> : <p className="no-reviews">{liveData ? 'No audience reviews yet. Be the first to share one after your show.' : 'Movie lovers’ notes will show up here.'}</p>}
        </section>
      </main>}

      {!profileOpen && <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><Icon name="ticket" size={18} /></span>reel<span>time</span><i>.</i></a><span>Good stories bring us together. © 2025 Reeltime.</span><div><a href="#movies">Movies</a><a href="#reviews">Reviews</a><button onClick={() => setChatOpen(true)}>Need help?</button></div></footer>}

      {!profileOpen && <button className={`chat-launcher ${chatOpen ? 'chat-open' : ''}`} onClick={() => setChatOpen(!chatOpen)} aria-label={chatOpen ? 'Close help chat' : 'Open help chat'}>{chatOpen ? <Icon name="close" size={22} /> : <><Icon name="chat" size={20} /><span className="chat-pulse" /></>}</button>}
      {!profileOpen && chatOpen && <aside className="chat-panel" aria-label="Lumi help chat"><div className="chat-header"><div className="lumi-avatar">✳</div><div><strong>Ask Lumi</strong><span><i /> Here for your movie night</span></div><button onClick={() => setChatOpen(false)} aria-label="Close chat"><Icon name="close" size={18} /></button></div><div className="chat-messages">{messages.map((message, index) => <div className={`chat-message ${message.from}`} key={index}>{message.text}</div>)}</div><div className="quick-questions">{['Refund policy', 'How do seats work?', 'Add snacks'].map(question => <button key={question} onClick={() => { setChatInput(question); }}>{question}</button>)}</div><form className="chat-form" onSubmit={answerChat}><input value={chatInput} onChange={event => setChatInput(event.target.value)} placeholder="Ask me anything..." aria-label="Message Lumi" /><button type="submit" aria-label="Send message"><Icon name="arrow" size={17} /></button></form></aside>}

      {booking && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setBooking(null) }}><section className="booking-modal" role="dialog" aria-modal="true" aria-label={`Book tickets for ${booking.title}`}>
        <header className="booking-header"><div><span className="section-label">YOUR MOVIE NIGHT</span><h2>{booking.title}</h2></div><button className="modal-close" onClick={() => setBooking(null)} aria-label="Close booking"><Icon name="close" size={20} /></button></header>
        {step < 4 && <div className="booking-progress">{['Showtime', 'Seats', 'Snacks', 'Confirm'].map((label, index) => <div className={`progress-step ${step >= index ? 'current' : ''}`} key={label}><span>{step > index ? <Icon name="check" size={13} /> : `0${index + 1}`}</span>{label}</div>)}</div>}
        {step === 0 && <div className="booking-body"><p className="booking-label">{liveData ? 'UPCOMING SHOWTIMES' : 'TODAY · CHENNAI'} <span>·</span> {booking.language.toUpperCase()}</p>
          <div className="booking-date-tabs" role="group" aria-label="Choose a show date">
            {bookingDates.map(date => <button
              className={`booking-date-button ${activeBookingDate?.key === date.key ? 'active' : ''}`}
              key={date.key}
              onClick={() => { setSelectedDate(date.key); setSelectedTime('') }}
              aria-pressed={activeBookingDate?.key === date.key}
            ><span>{date.weekday}</span><strong>{date.day}</strong><small>{date.month}</small></button>)}
          </div>
          {theaterGroups.length ? <div className="showtime-groups">{theaterGroups.map(group => <section className="showtime-theater" key={`${group.theater}|${group.location}`}>
            <div className="showtime-theater-heading"><strong>{group.theater}</strong><span>{group.location}</span></div>
            <div className="showtime-grid">{group.showtimes.map(showtime => <button className={`time-option ${selectedTime === showtime.id ? 'active' : ''}`} key={showtime.id} onClick={() => setSelectedTime(showtime.id)}>{showtime.time}<small>{showtime.format}</small>{showtime.ticket_price != null && <small>₹{showtime.ticket_price}</small>}</button>)}</div>
          </section>)}</div> : <p className="no-showtimes-date">No showtimes are available for this date.</p>}
          <button className="modal-next" disabled={!selectedTime} onClick={() => setStep(1)}>Choose your seats <Icon name="arrow" size={17} /></button></div>}
        {step === 1 && <div className="booking-body"><p className="booking-label">{selectedShowtime?.theater || 'SEAT MAP PREVIEW'} <span>·</span> {selectedTimeLabel}</p><p className="seat-demo-note">Seat availability is not connected to cinema inventory; this map is a preview.</p><div className="screen-curve">SCREEN</div><div className="seat-map">{['A', 'B', 'C', 'D', 'E'].map((row, rowIndex) => <div className="seat-row" key={row}><span className="row-label">{row}</span>{Array.from({ length: 8 }, (_, seatIndex) => { const seat = `${row}${seatIndex + 1}`; const unavailable = [2, 10, 11, 19, 25, 26, 34, 38].includes(rowIndex * 8 + seatIndex); return <button key={seat} aria-label={`${seat}${unavailable ? ', unavailable' : selectedSeats.includes(seat) ? ', selected' : ', available'}`} disabled={unavailable} className={`seat ${unavailable ? 'unavailable' : selectedSeats.includes(seat) ? 'chosen' : ''}`} onClick={() => toggleSeat(seat)} /> })}<span className="row-label">{row}</span></div>)}</div><div className="seat-legend"><span><i /> Available</span><span><i className="taken" /> Taken</span><span><i className="picked" /> Selected</span></div><button className="modal-next" disabled={!selectedSeats.length} onClick={() => setStep(2)}>Pick snacks <Icon name="arrow" size={17} /><small>{selectedSeats.length ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} · ₹${ticketTotal}` : 'Select at least one seat'}</small></button></div>}
        {step === 2 && <div className="booking-body"><p className="booking-label">MAKE IT A COMBO <span>·</span> OPTIONAL</p><div className="snack-list">{snackMenu.map(item => <div className="snack-row" key={item.name}><span className="snack-emoji">{item.emoji}</span><div className="snack-description"><strong>{item.name}</strong><small>{item.detail}</small></div><strong className="snack-price">₹{item.price}</strong><div className="quantity-control"><button onClick={() => setSnacks(current => ({ ...current, [item.name]: Math.max(0, (current[item.name] || 0) - 1) }))} aria-label={`Remove ${item.name}`}>−</button><span>{snacks[item.name] || 0}</span><button onClick={() => setSnacks(current => ({ ...current, [item.name]: (current[item.name] || 0) + 1 }))} aria-label={`Add ${item.name}`}>＋</button></div></div>)}</div><button className="skip-snacks" onClick={() => setStep(3)}>Skip snacks</button><button className="modal-next" onClick={() => setStep(3)}>Review booking <Icon name="arrow" size={17} /><small>₹{ticketTotal + snackTotal} total</small></button></div>}
        {step === 3 && <div className="booking-body"><p className="booking-label">LOOKS LIKE A GREAT NIGHT</p><div className="confirm-card"><div className="confirm-movie">{booking.title}<span>{booking.duration} · {booking.language}</span></div><div className="confirm-line"><span><Icon name="clock" size={15} /> {selectedShowtime?.date ? `${selectedShowtime.date} · ` : ''}{selectedTimeLabel}</span><span>{selectedShowtime?.theater || 'Luxe Cinemas'}</span></div><div className="confirm-line"><span>Seats · {selectedSeats.join(', ')}</span><span>₹{ticketTotal}</span></div>{snackMenu.filter(item => snacks[item.name]).map(item => <div className="confirm-line" key={item.name}><span>{item.emoji} {item.name} × {snacks[item.name]}</span><span>₹{item.price * snacks[item.name]}</span></div>)}<div className="confirm-total"><span>Total</span><strong>₹{ticketTotal + snackTotal}</strong></div></div>{bookingError && <p className="profile-feedback error" role="alert">{bookingError}</p>}<button className="modal-next" disabled={bookingSaving} onClick={saveBookingPreview}>{bookingSaving ? 'Saving booking…' : 'Save booking'} <Icon name="arrow" size={17} /></button></div>}
        {step === 4 && <div className="booking-body booking-success"><span className="success-icon"><Icon name="check" size={30} /></span><span className="section-label">BOOKING SAVED TO YOUR PROFILE</span><h3>That’s a lovely plan.</h3><p>{booking.title} · {selectedShowtime?.date ? `${selectedShowtime.date} · ` : ''}{selectedTimeLabel}<br />Seats {selectedSeats.join(', ')} · ₹{ticketTotal + snackTotal}</p><p className="success-review">Your booking details have been saved.</p>{savedPreviewId && <button className="modal-next" onClick={() => { setBooking(null); setProfileTab('tickets'); setTicketPreviews([]); setProfileError(''); setProfileMessage(''); window.history.pushState(null, '', '#profile'); setProfileOpen(true) }}>View in profile <Icon name="ticket" size={17} /></button>}<button className="skip-snacks" onClick={() => { setBooking(null); setReviewMovie(booking) }}>Done</button></div>}
      </section></div>}

      {reviewMovie && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setReviewMovie(null) }}><form className="review-modal" onSubmit={submitReview}><button type="button" className="modal-close review-close" onClick={() => setReviewMovie(null)} aria-label="Close review"><Icon name="close" size={20} /></button><span className="section-label">THE CREDITS HAVE ROLLED</span><h2>How was <em>{reviewMovie.title}</em>?</h2><p>Your take could make someone else’s movie night.</p><div className="star-picker" aria-label="Choose a rating">{[1, 2, 3, 4, 5].map(star => <button type="button" key={star} onClick={() => setReviewStars(star)} aria-label={`${star} stars`}><Icon name="star" size={28} />{star <= reviewStars ? '★' : '☆'}</button>)}</div><textarea value={reviewText} onChange={event => setReviewText(event.target.value)} placeholder="What stood out? No spoilers, please..." required rows={4} /><button className="modal-next" type="submit">Share your review <Icon name="arrow" size={17} /></button></form></div>}

      {toast && <div className="toast-message"><Icon name="check" size={16} /> {toast}</div>}
    </div>
  )
}

export default App
