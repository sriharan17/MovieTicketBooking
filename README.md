# Reeltime

A React + Vite cinema discovery and ticket-booking UI. Supabase provides real account authentication, live movie/showtime listings, and persistent audience reviews.

## Run locally

```sh
npm install
```

Copy `.env.example` to `.env` and fill in the **Supabase project URL** and **publishable/anon key** from Project Settings → API. Never put a Supabase service-role key in a browser app.

```sh
npm run dev
```

## Set up Supabase

1. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql).
2. In Authentication → URL Configuration, add the local development URL (`http://localhost:5173`) and your deployed site URL to the allowed redirect URLs. Password recovery redirects to the current site origin.
3. Keep email/password authentication enabled. Configure email confirmation and password recovery in the Supabase Auth settings for your deployment.
4. Add active movie rows to `public.movies` and future showtime rows to `public.showtimes`. Each movie needs a poster URL, language, genre, runtime in minutes, and synopsis. Each showtime needs its movie ID, cinema, `city` set to `Chennai`, start time with timezone, format, and ticket price.
5. Enable Realtime for `movies`, `showtimes`, and `reviews` if the migration did not already add them to the `supabase_realtime` publication.

### Sync TMDB movies

1. Run the updated `supabase/schema.sql` in the Supabase SQL Editor for the project URL in `sync.env`. It creates or upgrades the movie catalog columns and adds the unique `tmdb_id` column used for repeatable imports. The SQL also requests a PostgREST schema-cache reload.
2. In the ignored `sync.env` file, set `TMDB_KEY` to the TMDB **API Key (v3 auth)** from your TMDB account's API settings, and set `SUPABASE_SECRET_KEY` to your Supabase secret key. If you have a TMDB **API Read Access Token (v4 auth)** instead, set `TMDB_READ_ACCESS_TOKEN` and leave `TMDB_KEY` unset. Keep the Supabase secret key out of the browser `.env` and never commit it.
3. Run `node --env-file=sync.env sync-movies.mjs` from this project folder. The script imports TMDB's now-playing list for India and updates matching rows on later runs.

The sync imports movie metadata only; it does not create or invent theater showtimes. Imported films appear in the catalog, but booking stays disabled until real future showtimes are added. The app refreshes movie and showtime data when those tables change. Review creation requires a signed-in user; review reads are public. RLS policies intentionally allow public reads of active listings while restricting review creation to the authenticated author.

Signed-in users can open their profile as a separate page at `#profile`, view and update their profile name and phone number, and save an email-updates preference in Supabase Auth user metadata. Browser back/forward navigation works between the profile and movie catalog. The email preference is not connected to an email delivery system yet. Completing the current checkout saves an unconfirmed booking preview to `public.booking_previews`, which is visible only to its owner under RLS. These previews are not confirmed tickets and do not reserve seats or take payment. Run the updated `supabase/schema.sql` to create the table and its policies.

## Booking prototype limits

The booking screens are a UI preview: seat availability is not connected to cinema inventory, and the confirmation does not reserve seats or process payment. Connect an authorized cinema ticketing and payment provider before accepting real bookings.
