create extension if not exists pgcrypto;

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  language text not null,
  genre text not null,
  rating numeric(3, 1) check (rating between 0 and 10),
  duration_minutes integer not null check (duration_minutes > 0),
  tag text not null default 'NOW SHOWING',
  poster_url text not null,
  backdrop_url text,
  synopsis text not null default '',
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.movies
  add column if not exists language text not null default 'Unknown',
  add column if not exists genre text not null default 'Uncategorized',
  add column if not exists rating numeric(3, 1) check (rating between 0 and 10),
  add column if not exists duration_minutes integer not null default 120 check (duration_minutes > 0),
  add column if not exists tag text not null default 'NOW SHOWING',
  add column if not exists poster_url text not null default '',
  add column if not exists backdrop_url text,
  add column if not exists synopsis text not null default '',
  add column if not exists featured boolean not null default false,
  add column if not exists active boolean not null default true;

alter table public.movies
  add column if not exists tmdb_id bigint;

create unique index if not exists movies_tmdb_id_idx
  on public.movies (tmdb_id);

create table if not exists public.showtimes (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  theater_name text not null,
  city text not null default 'Chennai',
  location text not null,
  starts_at timestamptz not null,
  format text not null default 'Standard',
  ticket_price numeric(8, 2) not null check (ticket_price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  stars integer not null check (stars between 1 and 5),
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);

create table if not exists public.booking_previews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  movie_id uuid references public.movies(id) on delete set null,
  showtime_id uuid references public.showtimes(id) on delete set null,
  movie_title text not null,
  theater_name text not null,
  location text not null,
  city text not null default 'Chennai',
  starts_at timestamptz not null,
  format text not null,
  seats text[] not null check (cardinality(seats) > 0),
  snacks jsonb not null default '[]'::jsonb,
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'preview' check (status = 'preview'),
  created_at timestamptz not null default now()
);

alter table public.movies enable row level security;
alter table public.showtimes enable row level security;
alter table public.reviews enable row level security;
alter table public.booking_previews enable row level security;

drop policy if exists "Anyone can read active movies" on public.movies;
create policy "Anyone can read active movies"
  on public.movies for select
  using (active = true);

drop policy if exists "Anyone can read active showtimes" on public.showtimes;
create policy "Anyone can read active showtimes"
  on public.showtimes for select
  using (
    active = true
    and starts_at >= now()
  );

drop policy if exists "Anyone can read reviews" on public.reviews;
create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

drop policy if exists "Signed-in users can write their own reviews" on public.reviews;
create policy "Signed-in users can write their own reviews"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.movies
      where movies.id = reviews.movie_id
        and movies.active = true
    )
  );

drop policy if exists "Users can read their own booking previews" on public.booking_previews;
create policy "Users can read their own booking previews"
  on public.booking_previews for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own booking previews" on public.booking_previews;
create policy "Users can create their own booking previews"
  on public.booking_previews for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own booking previews" on public.booking_previews;
create policy "Users can delete their own booking previews"
  on public.booking_previews for delete
  to authenticated
  using (auth.uid() = user_id);

create index if not exists showtimes_movie_starts_at_idx
  on public.showtimes (movie_id, starts_at)
  where active = true;

create index if not exists reviews_movie_created_at_idx
  on public.reviews (movie_id, created_at desc);

create index if not exists booking_previews_user_created_at_idx
  on public.booking_previews (user_id, created_at desc);

grant usage on schema public to anon, authenticated;
grant select on public.movies, public.showtimes, public.reviews to anon, authenticated;
grant select, insert, delete on public.booking_previews to authenticated;
revoke all on public.booking_previews from anon;
revoke update, delete on public.booking_previews from anon;
revoke update on public.booking_previews from authenticated;
revoke insert, update, delete on public.reviews from anon, authenticated;
grant insert on public.reviews to authenticated;
revoke insert, update, delete on public.movies, public.showtimes from anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.movies;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.showtimes;
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.reviews;
exception
  when duplicate_object then null;
end
$$;

notify pgrst, 'reload schema';
