-- Persistent 24/7 crypto & 24/5 forex live trade bots (server-side state).
create table if not exists public.live_bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  market text not null check (market in ('crypto', 'forex')),
  is_running boolean not null default false,
  user_stopped boolean not null default false,
  cycle_count integer not null default 0,
  trades_executed integer not null default 0,
  started_at timestamptz,
  last_tick_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, market)
);

alter table public.live_bots enable row level security;

create policy "Users manage own live bots"
  on public.live_bots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists live_bots_running_idx on public.live_bots (is_running) where is_running = true;
