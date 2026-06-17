-- ════════════════════════════════════════════════════════════════════════
--  Timurlenk Satranç Online — initial schema (PHASE 2)
--  Run this in the Supabase SQL editor (or via `supabase db push`).
--  Idempotent where practical so it can be re-applied safely.
-- ════════════════════════════════════════════════════════════════════════

-- ── Tables ───────────────────────────────────────────────────────────────

create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    varchar(50) unique not null,
  email       varchar(100) not null,
  avatar_url  varchar(255),
  joined_date timestamptz default now(),
  is_active   boolean default true,
  is_banned   boolean default false,
  created_at  timestamptz default now()
);

create table if not exists public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  name            varchar(100) not null,
  tournament_type varchar(100) not null,
  arena_type      varchar(20) check (arena_type in ('arena', 'ladder')),
  start_time      timestamptz not null,
  next_start      timestamptz,
  max_players     integer default 100,
  current_players integer default 0,
  status          varchar(20) default 'upcoming' check (status in ('upcoming', 'active', 'completed')),
  created_at      timestamptz default now()
);

create table if not exists public.ratings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  time_control   varchar(20) not null check (time_control in ('bullet', 'blitz', 'rapid', 'classical')),
  rating         integer default 1000,
  rd             integer default 350,
  volatility     numeric(6, 5) default 0.06,
  games_played   integer default 0,
  wins           integer default 0,
  losses         integer default 0,
  draws          integer default 0,
  current_streak integer default 0,
  highest_rating integer default 1000,
  last_game_date timestamptz,
  updated_at     timestamptz default now(),
  unique (user_id, time_control)
);

create table if not exists public.games (
  id            uuid primary key default gen_random_uuid(),
  player1_id    uuid not null references public.users (id),
  player2_id    uuid references public.users (id),
  tournament_id uuid references public.tournaments (id),
  time_control  varchar(20) not null,
  start_time    timestamptz default now(),
  end_time      timestamptz,
  result        varchar(20) check (result in ('player1_win', 'player2_win', 'draw', 'abandoned')),
  moves_json    jsonb default '[]'::jsonb,
  board_theme   varchar(50) default 'klasik',
  piece_set     varchar(50) default 'standart',
  is_offline    boolean default false,
  synced_at     timestamptz,
  created_at    timestamptz default now()
);

create table if not exists public.tournament_players (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id       uuid references public.users (id) on delete set null,
  is_bot        boolean default false,
  bot_name      varchar(100),
  bot_rating    integer,
  points        integer default 0,
  rank          integer,
  joined_at     timestamptz default now()
);

create table if not exists public.purchases (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  product_id     varchar(100) not null,
  transaction_id varchar(100) unique,
  license_key    varchar(255) unique,
  amount         numeric(10, 2),
  currency       varchar(3),
  status         varchar(20) default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  purchased_at   timestamptz default now(),
  expires_at     timestamptz
);

create table if not exists public.friendships (
  id         uuid primary key default gen_random_uuid(),
  user1_id   uuid not null references public.users (id) on delete cascade,
  user2_id   uuid not null references public.users (id) on delete cascade,
  status     varchar(20) default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now()
);

create table if not exists public.offline_games (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  game_data  jsonb not null,
  created_at timestamptz default now(),
  synced_at  timestamptz
);

-- ── Indexes (performance) ────────────────────────────────────────────────

create index if not exists idx_ratings_user_time on public.ratings (user_id, time_control);
create index if not exists idx_ratings_rating on public.ratings (rating desc);
create index if not exists idx_games_player1 on public.games (player1_id);
create index if not exists idx_games_player2 on public.games (player2_id);
create index if not exists idx_games_created on public.games (created_at desc);
create index if not exists idx_games_open on public.games (time_control) where player2_id is null;
create index if not exists idx_tournaments_status on public.tournaments (status);

-- ── Row-Level Security ───────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.ratings enable row level security;
alter table public.games enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.purchases enable row level security;
alter table public.friendships enable row level security;
alter table public.offline_games enable row level security;

-- users: profiles are publicly readable; you may only write your own row.
drop policy if exists users_select on public.users;
create policy users_select on public.users for select using (true);
drop policy if exists users_insert on public.users;
create policy users_insert on public.users for insert with check (auth.uid() = id);
drop policy if exists users_update on public.users;
create policy users_update on public.users for update using (auth.uid() = id);

-- ratings: publicly readable (leaderboard); writable only for your own rows.
drop policy if exists ratings_select on public.ratings;
create policy ratings_select on public.ratings for select using (true);
drop policy if exists ratings_write on public.ratings;
create policy ratings_write on public.ratings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- games: visible to everyone (spectators); created by player1; updatable by
-- either participant, and joinable while player2 is still open.
drop policy if exists games_select on public.games;
create policy games_select on public.games for select using (true);
drop policy if exists games_insert on public.games;
create policy games_insert on public.games for insert with check (auth.uid() = player1_id);
drop policy if exists games_update on public.games;
create policy games_update on public.games for update
  using (auth.uid() = player1_id or auth.uid() = player2_id or player2_id is null);

-- tournaments: public read only (managed server-side).
drop policy if exists tournaments_select on public.tournaments;
create policy tournaments_select on public.tournaments for select using (true);

-- tournament_players: public read; you may add yourself.
drop policy if exists tp_select on public.tournament_players;
create policy tp_select on public.tournament_players for select using (true);
drop policy if exists tp_insert on public.tournament_players;
create policy tp_insert on public.tournament_players for insert with check (auth.uid() = user_id);

-- purchases: strictly private to the owner.
drop policy if exists purchases_rw on public.purchases;
create policy purchases_rw on public.purchases for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- friendships: visible to either party; created by user1; acceptable by user2.
drop policy if exists friendships_select on public.friendships;
create policy friendships_select on public.friendships for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);
drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships for insert with check (auth.uid() = user1_id);
drop policy if exists friendships_update on public.friendships;
create policy friendships_update on public.friendships for update
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- offline_games: private to the owner.
drop policy if exists offline_rw on public.offline_games;
create policy offline_rw on public.offline_games for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Auto-provision profile + ratings on signup ───────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.ratings (user_id, time_control)
  select new.id, tc
  from unnest(array['bullet', 'blitz', 'rapid', 'classical']) as tc
  on conflict (user_id, time_control) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Seed: the four standing tournaments (idempotent by name) ──────────────

insert into public.tournaments (name, tournament_type, arena_type, start_time, status)
select v.name, v.ttype, v.atype, now(), 'upcoming'
from (values
  ('Ordu Meydanı',          'ordu_meydani',        'arena'),
  ('Serasker Mücadelesi',   'serasker_mucadelesi', 'ladder'),
  ('Timur''un Mirası',      'timur_mirasi',        'arena'),
  ('Beyazıt''ın Kaharnamı', 'beyazit_kaharnam',    'ladder')
) as v(name, ttype, atype)
where not exists (select 1 from public.tournaments t where t.name = v.name);

-- ── Realtime: broadcast game-row changes ─────────────────────────────────
-- (Safe to ignore the error if the table is already in the publication.)
do $$
begin
  alter publication supabase_realtime add table public.games;
exception when others then null;
end $$;
