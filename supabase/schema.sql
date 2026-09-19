-- ============================================================
-- HostelHub · Supabase / PostgreSQL schema
-- Apply in the Supabase SQL editor. Enables RLS + JWT auth.
-- The demo ships with a mock data layer; set
-- NEXT_PUBLIC_DATA_MODE=supabase to use these tables.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Profiles (extend auth.users) ----------
create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique references auth.users(id) on delete cascade,
  role        text not null check (role in ('student','admin')),
  name        text not null,
  student_id  text unique,
  email       text,
  avatar_hue  int default 248,
  created_at  timestamptz default now()
);

-- ---------- Mess: weekly plan & meals ----------
create table public.meal_plans (
  id      bigserial primary key,
  date    date not null,
  slot    text not null check (slot in ('breakfast','lunch','snacks','dinner')),
  label   text not null,
  time    text,
  credits int not null default 10,
  status  text not null default 'upcoming',
  items   jsonb not null default '[]',
  unique (date, slot)
);

create table public.meal_opt_ins (
  id        bigserial primary key,
  student   uuid references public.profiles(id) on delete cascade,
  meal_plan bigint references public.meal_plans(id) on delete cascade,
  choice    text check (choice in ('optin','optout')),
  unique (student, meal_plan)
);

-- ---------- Dining credits wallet ----------
create table public.wallets (
  student      uuid primary key references public.profiles(id) on delete cascade,
  allocation   int not null default 120,
  used         int not null default 0,
  on_meal      int not null default 0,
  redeemed     int not null default 0,
  updated_at   timestamptz default now()
);

-- ---------- Rewards / gamification ----------
create table public.rewards (
  id        bigserial primary key,
  student   uuid references public.profiles(id) on delete cascade,
  kind      text check (kind in ('eco','discipline')),
  points    int not null,
  label     text not null,
  meta      text,
  created_at timestamptz default now()
);

create table public.gift_state (
  student       uuid primary key references public.profiles(id) on delete cascade,
  scratch_left  int not null default 3,
  last_scratch  timestamptz
);

create table public.perks (
  id          text primary key,
  emoji       text,
  title       text,
  description text,
  rarity      text check (rarity in ('common','rare','epic')),
  cost_credits int default 0
);

-- ---------- Complaints ----------
create table public.complaints (
  id          bigserial primary key,
  ticket_no   text not null,
  author      uuid references public.profiles(id),
  category    text not null,
  title       text not null,
  description text,
  priority    text check (priority in ('Urgent','Normal')),
  status      text default 'Submitted',
  photo_url   text,
  assignee    text,
  feedback    text,
  sla_seconds int,
  votes       int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ---------- Polls ----------
create table public.polls (
  id          text primary key,
  title       text,
  closes_at   timestamptz,
  options     jsonb not null default '[]'
);
create table public.poll_votes (
  poll   text references public.polls(id) on delete cascade,
  student uuid references public.profiles(id) on delete cascade,
  option_id text,
  primary key (poll, student)
);

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_opt_ins enable row level security;
alter table public.rewards enable row level security;
alter table public.complaints enable row level security;
alter table public.polls enable row level security;

-- Students read their own profile/wallet; admins read all.
create policy "own profile" on public.profiles for select using (auth.uid() = auth_id);
create policy "own wallet" on public.wallets  for select using (auth.uid() = student);
create policy "own rewards" on public.rewards for select using (auth.uid() = student or auth.jwt()->>'role' = 'admin');
create policy "everyone reads menus" on public.meal_plans for select using (true);