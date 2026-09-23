-- ============================================================
-- HostelHub · Supabase / PostgreSQL schema
-- ============================================================
-- Apply this whole file in the Supabase SQL editor (or `psql -f`).
-- It is the SQL twin of `prisma/schema.prisma`: same tables, same column
-- names, same ids as the mock data layer in `src/lib/data/*.ts`, so the app
-- can flip between `NEXT_PUBLIC_DATA_MODE=mock` and `=supabase` with no
-- shape changes.
--
-- Conventions
--   • App-visible ids are `text` primary keys carrying the exact id the mock
--     layer uses ('BR-SUN-BOYS', 'APP-9001', 'CM-1042', 'rx-1', …).
--   • Epoch-millisecond fields (createdAt, bookedAt, outAt, …) are stored as
--     `timestamptz`; `src/lib/supabase/mapping.ts` converts both ways.
--   • Array/record fields are `jsonb`.
--   • `public.hostels` is a view over `public.branches`: the marketplace calls
--     these "hostels" while the code calls them `Branch`/`branchId`.
--
-- Re-applying: this script targets a fresh project. To rebuild the demo
-- tables from scratch first, run the reset block below.
-- ------------------------------------------------------------
-- drop view  if exists public.hostels cascade;
-- drop table if exists public.poll_votes, public.polls, public.perks,
--   public.leaderboard_entries, public.notifications, public.gift_state,
--   public.rewards, public.wallets, public.plate_selections,
--   public.meal_opt_ins, public.meal_plans, public.complaints,
--   public.colleges, public.operators, public.inventory_items,
--   public.gate_passes, public.invoices, public.bookings,
--   public.applications, public.beds, public.branches, public.owners,
--   public.profiles cascade;
-- ------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. Identity
-- ============================================================

-- Profiles (extends auth.users). Role drives every RLS policy below:
--   student    → own rows only
--   operator   → mess/kitchen console (menu + stock)
--   management → admissions, beds, fees, gate passes
--   admin      → unrestricted (command centre)
create table public.profiles (
  id           uuid primary key default gen_random_uuid(),
  auth_id      uuid unique references auth.users(id) on delete cascade,
  role         text not null check (role in ('student','operator','management','admin')),
  name         text not null,
  student_id   text unique,
  email        text unique,
  mobile       text,
  college_id   text,
  college_name text,
  avatar_hue   int not null default 248,
  created_at   timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);
create index profiles_college_idx on public.profiles (college_id);

-- Hostel owners / operators who list branches on the marketplace.
create table public.owners (
  id            text primary key,               -- 'OWN-1001'
  full_name     text not null,
  email         text not null unique,
  phone         text not null,
  age           int not null check (age between 18 and 100),
  aadhaar_last4 text not null check (aadhaar_last4 ~ '^[0-9]{4}$'),
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- College directory (student sign-in combobox + admin moderation queue).
create table public.colleges (
  id            text primary key,               -- 'CLG-ENG-01' | 'MANUAL-…'
  name          text not null unique,
  city          text,
  address       text,
  contact_email text,
  status        text not null default 'approved' check (status in ('approved','pending')),
  source        text not null default 'directory' check (source in ('directory','manual')),
  added_at      timestamptz not null default now(),
  added_by      text
);
create index colleges_status_idx on public.colleges (status);

-- Staff onboarding queue (mess / desk credentials).
create table public.operators (
  id           text primary key,                -- 'REQ-101'
  profile      uuid unique references public.profiles(id) on delete set null,
  name         text not null,
  college      text not null default '',
  role         text not null default 'operator' check (role in ('student','operator','management','admin')),
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(),
  decided_at   timestamptz
);
create index operators_status_idx on public.operators (status);

-- ============================================================
-- 2. Mess — weekly plan, opt-ins, plate selections
-- ============================================================

-- One row per meal slot (breakfast/lunch/snacks/dinner × date).
-- `items`/`menu_meta`/`ratings` mirror the `Meal` type in src/types exactly.
create table public.meal_plans (
  id            text primary key,               -- 'lunch-full-veg-thali'
  date          date not null,
  slot          text not null check (slot in ('breakfast','lunch','snacks','dinner')),
  label         text not null,
  time          text,
  credits       int  not null default 10,
  status        text not null default 'upcoming' check (status in ('active','closed','upcoming','done')),
  items         jsonb not null default '[]',
  menu_meta     jsonb not null default '{}',
  veg           boolean not null default true,
  participating int not null default 0,
  opted_out     int not null default 0,
  ratings       jsonb,
  special       boolean not null default false,
  unique (date, slot)
);
create index meal_plans_date_idx on public.meal_plans (date);

-- A student's in/out choice for one meal (Meal.userOpt).
create table public.meal_opt_ins (
  id         uuid primary key default gen_random_uuid(),
  student    uuid not null references public.profiles(id) on delete cascade,
  meal_plan  text not null references public.meal_plans(id) on delete cascade,
  choice     text not null check (choice in ('optin','optout')),
  created_at timestamptz not null default now(),
  unique (student, meal_plan)
);
create index meal_opt_ins_plan_idx on public.meal_opt_ins (meal_plan);

-- PlateSelection — the components a student ticked off (+ absence days).
create table public.plate_selections (
  student      uuid not null references public.profiles(id) on delete cascade,
  meal_plan    text not null references public.meal_plans(id) on delete cascade,
  items        jsonb not null default '[]',
  sweet_opt_in boolean not null default false,
  skipped      boolean not null default false,
  absence_days jsonb not null default '[]',
  updated_at   timestamptz not null default now(),
  primary key (student, meal_plan)
);

-- ============================================================
-- 3. Credits, rewards, alerts
-- ============================================================

-- Dining-credit wallet — one row per student (CreditWallet type).
create table public.wallets (
  student    uuid primary key references public.profiles(id) on delete cascade,
  allocation int not null default 120,
  used       int not null default 0,
  on_meal    int not null default 0,
  redeemed   int not null default 0,
  updated_at timestamptz not null default now()
);

-- Reward ledger (RewardTxn). `label`/`meta` hold i18n keys.
create table public.rewards (
  id         text primary key,                  -- 'rx-1'
  student    uuid references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('eco','discipline')),
  points     int  not null,
  label      text not null,
  meta       text,
  created_at timestamptz not null default now()
);
create index rewards_student_idx on public.rewards (student, created_at desc);

-- Gift-box scratch state (GiftBoxState).
create table public.gift_state (
  student      uuid primary key references public.profiles(id) on delete cascade,
  scratch_left int not null default 3,
  last_scratch timestamptz
);

-- Perk catalogue — mirrors PERK_LIST in src/lib/store-core.tsx.
create table public.perks (
  id           text primary key,
  emoji        text not null default '',
  title_key    text not null,
  desc_key     text not null,
  rarity       text not null check (rarity in ('common','rare','epic')),
  cost_credits int  not null default 0
);

-- In-app notifications (NotificationItem); titles/bodies are i18n keys.
create table public.notifications (
  id      text primary key,                     -- 'n1'
  student uuid references public.profiles(id) on delete cascade,
  title   text not null,
  body    text not null,
  at      timestamptz not null default now(),
  is_read boolean not null default false,
  tone    text not null default 'info' check (tone in ('info','success','warning','reward')),
  meta    jsonb
);
create index notifications_student_idx on public.notifications (student, is_read);

-- Eco/discipline leaderboard (LeaderboardEntry).
create table public.leaderboard_entries (
  student_id text primary key,                  -- 'STU-23012'
  rank       int  not null,
  name       text not null,
  points     int  not null,
  streak     int  not null default 0,
  badges     jsonb not null default '[]'
);
create index leaderboard_rank_idx on public.leaderboard_entries (rank);

-- ============================================================
-- 4. Polls (weekend menu voting)
-- ============================================================

create table public.polls (
  id        text primary key,                   -- 'poll-weekend-1'
  title_key text not null,
  closes_at timestamptz not null,
  options   jsonb not null default '[]'         -- PollOption[] { id, dish, emoji, votes }
);

create table public.poll_votes (
  poll       text not null references public.polls(id) on delete cascade,
  student    uuid not null references public.profiles(id) on delete cascade,
  option_id  text not null,
  created_at timestamptz not null default now(),
  primary key (poll, student)
);

-- ============================================================
-- 5. Complaints
-- ============================================================

-- `id` is the human ticket number shown all over the UI ('CM-1042').
-- `author` links to a profile when we know one; `author_name` keeps the
-- display name the mock layer stores on the ticket itself.
create table public.complaints (
  id          text primary key,                 -- 'CM-1042'
  author      uuid references public.profiles(id) on delete set null,
  author_name text not null default 'Resident',
  category    text not null,
  title       text not null,
  description text,
  priority    text not null default 'Normal' check (priority in ('Urgent','Normal')),
  status      text not null default 'Submitted'
                check (status in ('Submitted','In Review','Technician Assigned','Resolved','Closed')),
  photo_url   text,
  assignee    text,
  feedback    text,
  sla_seconds int,
  votes       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index complaints_status_idx  on public.complaints (status);
create index complaints_author_idx  on public.complaints (author);
create index complaints_created_idx on public.complaints (created_at desc);

-- ============================================================
-- 6. Multi-hostel marketplace — owners → branches → beds
-- ============================================================

-- Branch = one hostel building run by an owner. The marketplace calls these
-- "hostels"; the code calls them `Branch`/`branchId`. Money columns are INR
-- integers, `room_fees`/`amenities`/`photos` carry the exact shapes from
-- `src/types` (`RoomFee[]`, `string[]`, `string[]`).
create table public.branches (
  id           text primary key,                -- 'BR-SUN-BOYS'
  owner_id     text not null references public.owners(id) on delete restrict,
  name         text not null,
  gender       text not null check (gender in ('Girls','Boys','Open to All')),
  food         text not null check (food in ('Jain','Pure Veg','Non-Veg')),
  address      text not null,
  amenities    jsonb not null default '[]',
  meals_per_day int  not null default 3 check (meals_per_day between 0 and 6),
  room_fees    jsonb not null default '[]',
  sponsored    boolean not null default false,
  rating       double precision not null default 4.0 check (rating between 0 and 5),
  reviews      int not null default 0,
  photos       jsonb not null default '[]',
  created_at   timestamptz not null default now()
);
create index branches_owner_idx     on public.branches (owner_id);
create index branches_gender_idx    on public.branches (gender);
create index branches_sponsored_idx on public.branches (sponsored) where sponsored;

-- Product-language alias: `select * from hostels` returns the branches.
-- `security_invoker` makes the view honour the caller's branch RLS policies.
create view public.hostels with (security_invoker = true) as
  select * from public.branches;

-- Beds — the inventory matrix on /management/inventory.
create table public.beds (
  id          text primary key,                 -- 'BED-BR-SUN-BOYS-101-1'
  branch_id   text not null references public.branches(id) on delete cascade,
  room_no     text not null,
  config      text not null check (config in ('1-Bed','2-Bed','3-Bed','4-Bed')),
  bed_no      int  not null check (bed_no between 1 and 12),
  status      text not null default 'Vacant' check (status in ('Vacant','Locked','Booked')),
  occupant_id text,                             -- student id, e.g. 'STU-23045'
  monthly_fee int  not null default 0,
  unique (branch_id, room_no, bed_no)
);
create index beds_branch_status_idx on public.beds (branch_id, status);
create index beds_occupant_idx      on public.beds (occupant_id);

-- Admission application (the management desk's verification queue).
create table public.applications (
  id            text primary key,               -- 'APP-9001'
  student_name  text not null,
  student_id    text not null,
  aadhaar_last4 text not null default '0000',
  verified      boolean not null default false,
  branch_id     text not null references public.branches(id) on delete cascade,
  bed_id        text references public.beds(id) on delete set null,
  status        text not null default 'Waiting for Admin Approval'
                  check (status in ('Waiting for Admin Approval','Approved','Rejected')),
  created_at    timestamptz not null default now(),
  decided_at    timestamptz
);
create index applications_branch_status_idx on public.applications (branch_id, status);
create index applications_student_idx       on public.applications (student_id);

-- Token booking — money held against a bed until the student arrives.
create table public.bookings (
  id               text primary key,            -- 'BK-5001'
  application_id   text not null references public.applications(id) on delete cascade,
  branch_id        text not null references public.branches(id) on delete cascade,
  bed_id           text not null references public.beds(id) on delete cascade,
  token_amount     int  not null default 0,
  grace_days       int  not null default 7,
  booked_at        timestamptz not null default now(),
  expected_arrival timestamptz not null,
  actual_arrival   timestamptz,
  addon_rent       int  not null default 0,
  status           text not null default 'Held' check (status in ('Held','Confirmed','Expired'))
);
create index bookings_status_idx     on public.bookings (status);
create index bookings_branch_idx     on public.bookings (branch_id);
create index bookings_bed_idx        on public.bookings (bed_id);

-- Monthly fee invoice (FeeInvoice + FeeLine[]).
create table public.invoices (
  id                text primary key,           -- 'INV-2026-09-01'
  student_name      text not null,
  branch_id         text not null references public.branches(id) on delete cascade,
  month             text not null,
  room_rent         int  not null default 0,
  food_charge       int  not null default 0,
  absence_deduction int  not null default 0,
  addon_rent        int  not null default 0,
  total             int  not null default 0,
  paid              boolean not null default false,
  lines             jsonb not null default '[]',
  created_at        timestamptz not null default now()
);
create index invoices_branch_month_idx on public.invoices (branch_id, month);
create index invoices_paid_idx         on public.invoices (paid) where not paid;

-- Smart gate pass — request → approved → out → returned, plus the QR code.
create table public.gate_passes (
  id              text primary key,             -- 'GP-7001'
  student_name    text not null,
  student_id      text not null,
  branch_id       text not null references public.branches(id) on delete cascade,
  reason          text not null,
  destination     text not null,
  out_at          timestamptz not null,
  expected_return timestamptz not null,
  actual_return   timestamptz,
  status          text not null default 'Requested'
                    check (status in ('Requested','Approved','Out','Returned','Rejected')),
  code            char(6) not null unique
);
create index gate_passes_student_idx      on public.gate_passes (student_id);
create index gate_passes_branch_status_idx on public.gate_passes (branch_id, status);

-- Article-level stock register beside the bed matrix.
-- ('/management/inventory' renders beds; this is the consumables/assets table.)
create table public.inventory_items (
  id            text primary key,               -- 'INV-ITEM-…'
  branch_id     text not null references public.branches(id) on delete cascade,
  name          text not null,
  category      text not null default 'general',
  unit          text not null default 'pcs',
  quantity      int  not null default 0,
  reorder_level int  not null default 0,
  unit_cost     int  not null default 0,
  status        text not null default 'In Stock' check (status in ('In Stock','Low','Out of Stock')),
  updated_at    timestamptz not null default now()
);
create index inventory_branch_category_idx on public.inventory_items (branch_id, category);
create index inventory_status_idx          on public.inventory_items (status);

-- ============================================================
-- 7. Row Level Security (RLS)
-- ============================================================
-- Identity model
--   • Live mode signs users in through Supabase Auth. On sign-up the
--     `handle_new_user` trigger below creates the matching `profiles` row
--     with profiles.id = auth.uid(), so every "own row" policy is simply
--     `… = auth.uid()` (via the helpers) — "based on profile id".
--   • Tables whose mock shape keys the student by the human roll number
--     (applications, gate_passes, leaderboard) are matched through
--     profiles.student_id (current_student_id()); invoices — which only
--     store student_name in the mock shape — through current_profile_name().
--
-- Roles (profiles.role drives every policy; the app's "mess" portal = `operator`)
--   student    → own rows only
--   operator   → mess/kitchen console: menu, opt-ins, plates, stock, complaints
--   management → admissions, beds, fees, gate passes, branch listings
--   admin      → unrestricted (command centre)
--
-- How to read the policies below
--   • Policies on the same table are permissive (OR'd). Each one is commented
--     with WHO it is for and WHY it exists.
--   • `to anon` read-grants are only for genuinely public content (sign-in
--     college picker, hostel marketplace, menu, leaderboard, perk catalogue).
--     Per-student data (wallet, rewards, invoices, passes, tickets, …) is
--     never readable by `anon`.
--   • Known demo trade-offs are called out inline (e.g. students flipping
--     `paid` on their own invoice, client-earned reward points). Tightening
--     those would need value-level SECURITY DEFINER RPCs — out of scope here.
--   • Grants below only confer the ABILITY to touch a table; RLS policies
--     decide WHICH rows are visible/writable.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 7a. Helper functions
-- ------------------------------------------------------------
-- All helpers are SECURITY DEFINER + `set search_path` so that policies on
-- `profiles` itself can safely call current_app_role() without recursing
-- through profiles' own RLS rules.

-- The signed-in profile id (null for anon).
create or replace function public.current_profile_id() returns uuid
language sql stable security definer set search_path = public
as $$ select auth.uid() $$;

-- The signed-in user's roll number ('STU-23045'), for tables whose mock
-- shape stores student_id as plain text instead of a profile uuid.
create or replace function public.current_student_id() returns text
language sql stable security definer set search_path = public
as $$ select student_id from public.profiles where id = auth.uid() limit 1 $$;

-- The signed-in user's display name — invoices only carry `student_name`.
create or replace function public.current_profile_name() returns text
language sql stable security definer set search_path = public
as $$ select name from public.profiles where id = auth.uid() limit 1 $$;

-- The signed-in user's role ('student' | 'operator' | 'management' | 'admin');
-- null for anon or users without a profile row.
create or replace function public.current_app_role() returns text
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() limit 1 $$;

-- ------------------------------------------------------------
-- Supabase Auth → profiles bootstrap.
-- Creates the student's profile row at sign-up with id = auth.uid(), which is
-- what every "own row" policy matches against. Role/name come from signup
-- metadata (falling back to safe student defaults).
-- ------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, auth_id, role, name, email, college_name)
  values (
    new.id,
    new.id,
    coalesce(
      case when new.raw_user_meta_data ->> 'role'
             in ('student','operator','management','admin')
           then new.raw_user_meta_data ->> 'role'
      end,
      'student'),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''),
             split_part(coalesce(new.email, ''), '@', 1),
             'Student'),
    new.email,
    new.raw_user_meta_data ->> 'college_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Poll voting RPC — the weekend-menu poll tallies votes inside
-- `polls.options` (jsonb), so a shared-row increment can't be protected by
-- row-level rules alone. This SECURITY DEFINER function validates the
-- option, moves the student's previous vote and updates the tally atomically.
-- Phase 5 live wiring should call: supabase.rpc('cast_poll_vote', …)
-- ------------------------------------------------------------
create or replace function public.cast_poll_vote(p_poll text, p_option text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_student uuid := auth.uid();
  v_votes   jsonb;
  v_old     text;
begin
  if v_student is null then
    raise exception 'cast_poll_vote: sign-in required';
  end if;

  select options into v_votes
    from public.polls
   where id = p_poll and closes_at > now();
  if v_votes is null then
    raise exception 'cast_poll_vote: poll not found or closed';
  end if;

  if not exists (
    select 1 from jsonb_array_elements(v_votes) o where o ->> 'id' = p_option
  ) then
    raise exception 'cast_poll_vote: unknown option';
  end if;

  select option_id into v_old
    from public.poll_votes
   where poll = p_poll and student = v_student;

  if v_old = p_option then
    return; -- re-voting for the same option is a no-op
  end if;

  update public.polls p
     set options = (
       select jsonb_agg(
                case
                  when e ->> 'id' = v_old then
                    jsonb_set(e, '{votes}',
                      to_jsonb(greatest(coalesce((e ->> 'votes')::int, 0) - 1, 0)))
                  when e ->> 'id' = p_option then
                    jsonb_set(e, '{votes}',
                      to_jsonb(coalesce((e ->> 'votes')::int, 0) + 1))
                  else e
                end
                order by ord)
         from jsonb_array_elements(p.options) with ordinality as t(e, ord)
      )
   where p.id = p_poll;

  insert into public.poll_votes (poll, student, option_id)
  values (p_poll, v_student, p_option)
  on conflict (poll, student)
  do update set option_id = excluded.option_id, created_at = now();
end;
$$;

-- ------------------------------------------------------------
-- 7b. Enable RLS on every table (deny-by-default once enabled)
-- ------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.owners             enable row level security;
alter table public.colleges           enable row level security;
alter table public.operators          enable row level security;
alter table public.meal_plans         enable row level security;
alter table public.meal_opt_ins       enable row level security;
alter table public.plate_selections   enable row level security;
alter table public.wallets            enable row level security;
alter table public.rewards            enable row level security;
alter table public.gift_state         enable row level security;
alter table public.perks              enable row level security;
alter table public.notifications      enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.polls              enable row level security;
alter table public.poll_votes         enable row level security;
alter table public.complaints         enable row level security;
alter table public.branches           enable row level security;
alter table public.beds               enable row level security;
alter table public.applications       enable row level security;
alter table public.bookings           enable row level security;
alter table public.invoices           enable row level security;
alter table public.gate_passes        enable row level security;
alter table public.inventory_items    enable row level security;
-- `public.hostels` is a (security_invoker) VIEW over branches — it has no
-- RLS of its own; queries through it are filtered by branches' policies.

-- Base grants: the ABILITY to reach the tables (Supabase sets these by
-- default; mirrored here so the file is self-contained). RLS — not grants —
-- is the actual gate: anon gets broad *row-filtered* access below.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 7c. Policies — identity tables
-- ------------------------------------------------------------

-- profiles · SELECT — a student only ever sees their own profile row.
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = public.current_profile_id());

-- profiles · SELECT — staff need directory lookups (name, role, roll no)
-- to route complaints, verify applicants and show complainant details.
create policy "profiles_select_staff" on public.profiles
  for select to authenticated
  using (public.current_app_role() in ('admin','management','operator'));

-- profiles · INSERT — you may create exactly your own profile row
-- (the signup trigger usually does this for you).
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = public.current_profile_id());

-- profiles · UPDATE — students edit their own details (name, avatar, college).
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = public.current_profile_id())
  with check (id = public.current_profile_id());

-- profiles · UPDATE — admins edit any profile (role changes, data fixes).
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- profiles · DELETE — account cleanup is admin-only.
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- owners · SELECT — owner PII (Aadhaar last-4, phone, email) is staff-only;
-- the marketplace UI only ever renders branch rows, which carry no owner PII.
create policy "owners_select_staff" on public.owners
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- owners · INSERT — the public KYC onboarding funnel at /onboard runs on a
-- signed-OUT page, so anonymous visitors may file an owner record.
create policy "owners_insert_public" on public.owners
  for insert to anon, authenticated
  with check (true);

-- owners · UPDATE — verification flags / profile fixes are admin-only.
create policy "owners_update_admin" on public.owners
  for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- owners · DELETE — removing an owner record is admin-only.
create policy "owners_delete_admin" on public.owners
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- colleges · SELECT — the sign-in combobox (/auth/student) is public.
create policy "colleges_select_public" on public.colleges
  for select to anon, authenticated
  using (true);

-- colleges · INSERT — "my college isn't listed" on the public sign-in page
-- may propose an entry, but ONLY as pending/manual (never self-approved).
create policy "colleges_insert_pending" on public.colleges
  for insert to anon, authenticated
  with check (status = 'pending' and source = 'manual');

-- colleges · UPDATE — approving pending colleges is admin moderation.
create policy "colleges_update_admin" on public.colleges
  for update to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- colleges · DELETE — directory pruning is admin-only.
create policy "colleges_delete_admin" on public.colleges
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- colleges · INSERT — admins/management publish directory entries directly
-- (approved + 'directory', any fields) via the registry's createCollege().
-- Without this the only insert policy would force every row to be
-- pending/manual — including the admin's own.
create policy "colleges_insert_staff" on public.colleges
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management'));

-- operators · SELECT — applicants see their own onboarding request.
create policy "operators_select_own" on public.operators
  for select to authenticated
  using (profile = public.current_profile_id());

-- operators · SELECT — admin/management review the staff approval queue.
create policy "operators_select_staff" on public.operators
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- operators · INSERT — a signed-in user files an application for THEMSELVES
-- (profile may still be null for pre-account desk requests).
create policy "operators_insert_own" on public.operators
  for insert to authenticated
  with check (profile is null or profile = public.current_profile_id());

-- operators · UPDATE — only admin/management can approve/reject (status,
-- decided_at); applicants must not be able to self-approve.
create policy "operators_update_staff" on public.operators
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- operators · DELETE — applicants may withdraw their own request…
create policy "operators_delete_own" on public.operators
  for delete to authenticated
  using (profile = public.current_profile_id());
-- …and admins can remove any.
create policy "operators_delete_admin" on public.operators
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- 7d. Policies — mess (weekly menu, opt-ins, plates)
-- ------------------------------------------------------------

-- meal_plans · SELECT — the weekly menu is shared content: public sign-in
-- pages and every signed-in portal render it alike.
create policy "meal_plans_select_public" on public.meal_plans
  for select to anon, authenticated
  using (true);

-- meal_plans · ALL — the mess console (operator) curates the menu; admins
-- can always step in. Students are read-only here (counts are derived from
-- meal_opt_ins, so nobody edits participating/opted_out by hand).
create policy "meal_plans_manage_mess" on public.meal_plans
  for all to authenticated
  using (public.current_app_role() in ('operator','admin'))
  with check (public.current_app_role() in ('operator','admin'));

-- meal_opt_ins · SELECT — students read only their own in/out choice…
create policy "meal_opt_ins_select_own" on public.meal_opt_ins
  for select to authenticated
  using (student = public.current_profile_id());
-- …while the mess console and admin see every choice (headcount).
create policy "meal_opt_ins_select_staff" on public.meal_opt_ins
  for select to authenticated
  using (public.current_app_role() in ('operator','admin'));

-- meal_opt_ins · ALL — a student manages only THEIR OWN choice per meal.
create policy "meal_opt_ins_manage_own" on public.meal_opt_ins
  for all to authenticated
  using (student = public.current_profile_id())
  with check (student = public.current_profile_id());
-- meal_opt_ins · ALL — the mess desk may correct any record (walk-in opts).
create policy "meal_opt_ins_manage_staff" on public.meal_opt_ins
  for all to authenticated
  using (public.current_app_role() in ('operator','admin'))
  with check (public.current_app_role() in ('operator','admin'));

-- plate_selections · SELECT — own plate/absence data only…
create policy "plate_selections_select_own" on public.plate_selections
  for select to authenticated
  using (student = public.current_profile_id());
-- …staff review it for headcount & absence handling.
create policy "plate_selections_select_staff" on public.plate_selections
  for select to authenticated
  using (public.current_app_role() in ('operator','admin'));

-- plate_selections · ALL — students tick their own plate components…
create policy "plate_selections_manage_own" on public.plate_selections
  for all to authenticated
  using (student = public.current_profile_id())
  with check (student = public.current_profile_id());
-- …the mess desk may correct any (kitchen-side updates).
create policy "plate_selections_manage_staff" on public.plate_selections
  for all to authenticated
  using (public.current_app_role() in ('operator','admin'))
  with check (public.current_app_role() in ('operator','admin'));

-- ------------------------------------------------------------
-- 7e. Policies — credits, rewards, gifts
-- ------------------------------------------------------------

-- wallets · SELECT — the owner student sees their own wallet…
create policy "wallets_select_own" on public.wallets
  for select to authenticated
  using (student = public.current_profile_id());
-- …the fee desk (management/admin) audits any wallet. Operator is excluded:
-- mess staff run food, not money.
create policy "wallets_select_staff" on public.wallets
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- wallets · INSERT — a student creates their own wallet row on first use.
create policy "wallets_insert_own" on public.wallets
  for insert to authenticated
  with check (student = public.current_profile_id());

-- wallets · UPDATE — the student's own in-app credit movements (meal opt
-- ins, perk redemptions) written by the demo client. TRADE-OFF: row-level
-- rules can't restrict WHICH columns change; value-level guards would need
-- a SECURITY DEFINER wallet RPC (noted, out of scope).
create policy "wallets_update_own" on public.wallets
  for update to authenticated
  using (student = public.current_profile_id())
  with check (student = public.current_profile_id());
-- wallets · UPDATE — staff corrections/refunds on any wallet.
create policy "wallets_update_staff" on public.wallets
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- wallets · DELETE — wallet removal is admin-only.
create policy "wallets_delete_admin" on public.wallets
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- rewards · SELECT — students read only their own points ledger…
create policy "rewards_select_own" on public.rewards
  for select to authenticated
  using (student = public.current_profile_id());
-- …staff audit any ledger (broadcasts, disputes).
create policy "rewards_select_staff" on public.rewards
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- rewards · INSERT — TRADE-OFF: the demo client awards points for the
-- student's OWN actions (meal opt-out, rating, filing a ticket, scratch),
-- so students may append rows — but strictly to THEIR OWN ledger.
create policy "rewards_insert_own" on public.rewards
  for insert to authenticated
  with check (student = public.current_profile_id());
-- rewards · INSERT — admin broadcasts and management awards may credit
-- any student's ledger.
create policy "rewards_insert_staff" on public.rewards
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management'));

-- rewards · UPDATE — ledger corrections are staff-only (students cannot
-- edit points they've already earned).
create policy "rewards_update_staff" on public.rewards
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- rewards · DELETE — pruning ledger entries is admin-only.
create policy "rewards_delete_admin" on public.rewards
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- gift_state · ALL — the scratch-card state is private to its student
-- (they may spend scratches / set last_scratch on their own row only).
create policy "gift_state_own" on public.gift_state
  for all to authenticated
  using (student = public.current_profile_id())
  with check (student = public.current_profile_id());

-- gift_state · DELETE — resetting a student's gift box is admin-only.
create policy "gift_state_delete_admin" on public.gift_state
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- 7f. Policies — perks, notifications, leaderboard, polls
-- ------------------------------------------------------------

-- perks · SELECT — shared perk-shop catalogue, readable everywhere
-- (including signed-out landing pages).
create policy "perks_select_public" on public.perks
  for select to anon, authenticated
  using (true);

-- perks · ALL — the reward catalogue (costs, rarities) is curated by admin;
-- students redeem through their own wallet/rewards rows, not by editing perks.
create policy "perks_manage_admin" on public.perks
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- notifications · SELECT — an inbox is private: own rows only.
create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (student = public.current_profile_id());

-- notifications · INSERT — the demo client writes into the student's OWN
-- inbox (alerts generated by their actions)…
create policy "notifications_insert_own" on public.notifications
  for insert to authenticated
  with check (student = public.current_profile_id());
-- …and management/admin push announcements to any inbox.
create policy "notifications_insert_staff" on public.notifications
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management'));

-- notifications · UPDATE — mark-as-read / tone fixes on own rows only.
create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (student = public.current_profile_id())
  with check (student = public.current_profile_id());

-- notifications · DELETE — clearing your own inbox…
create policy "notifications_delete_own" on public.notifications
  for delete to authenticated
  using (student = public.current_profile_id());
-- …plus admin moderation of any message.
create policy "notifications_delete_admin" on public.notifications
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- leaderboard_entries · SELECT — the ranking is deliberately public among
-- signed-in users (display name + points + streak only; no PII columns).
create policy "leaderboard_select_auth" on public.leaderboard_entries
  for select to authenticated
  using (true);

-- leaderboard_entries · ALL — the leaderboard is a staff-computed view of
-- rewards (seeded/refreshed by tools); students must not write their own
-- rank/points directly — points only move through the rewards ledger.
create policy "leaderboard_manage_admin" on public.leaderboard_entries
  for all to authenticated
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- polls · SELECT — weekend-menu voting is open to everyone (turnout is a
-- shared, public thing; individual votes live in poll_votes).
create policy "polls_select_public" on public.polls
  for select to anon, authenticated
  using (true);

-- polls · ALL — the mess desk (operator) opens/closes weekend polls; admin
-- may edit any. Students TALLY votes through the cast_poll_vote() RPC above
-- (SECURITY DEFINER), never by updating this row directly.
create policy "polls_manage_mess" on public.polls
  for all to authenticated
  using (public.current_app_role() in ('operator','admin'))
  with check (public.current_app_role() in ('operator','admin'));

-- poll_votes · SELECT — students see only their own vote (to render
-- "you picked X")…
create policy "poll_votes_select_own" on public.poll_votes
  for select to authenticated
  using (student = public.current_profile_id());
-- …the mess desk audits turnout.
create policy "poll_votes_select_staff" on public.poll_votes
  for select to authenticated
  using (public.current_app_role() in ('operator','admin'));

-- poll_votes · ALL — direct own-row writes as a fallback to the RPC
-- (cast_poll_vote runs SECURITY DEFINER and bypasses this); a student can
-- only ever touch their own ballot.
create policy "poll_votes_manage_own" on public.poll_votes
  for all to authenticated
  using (student = public.current_profile_id())
  with check (student = public.current_profile_id());

-- ------------------------------------------------------------
-- 7g. Policies — complaints (support tickets)
-- ------------------------------------------------------------

-- complaints · SELECT — authors read their own tickets…
create policy "complaints_select_own" on public.complaints
  for select to authenticated
  using (author = public.current_profile_id());
-- …the service desks (mess operator, management warden desk, admin) read
-- the full queue so tickets actually get worked.
create policy "complaints_select_staff" on public.complaints
  for select to authenticated
  using (public.current_app_role() in ('admin','management','operator'));

-- complaints · INSERT — students file tickets as themselves (`author`
-- must point at their own profile; author_name is just the display copy).
create policy "complaints_insert_own" on public.complaints
  for insert to authenticated
  with check (author = public.current_profile_id());
-- complaints · INSERT — staff may also log tickets on a resident's behalf
-- (walk-in desk).
create policy "complaints_insert_staff" on public.complaints
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management','operator'));

-- complaints · UPDATE — the assignee desks move tickets through the
-- workflow (In Review → Technician Assigned → Resolved) and edit
-- assignee/SLA.
create policy "complaints_update_staff" on public.complaints
  for update to authenticated
  using (public.current_app_role() in ('admin','management','operator'))
  with check (public.current_app_role() in ('admin','management','operator'));

-- complaints · UPDATE — the author may update their OWN ticket (add
-- feedback, vote, close it) — TRADE-OFF: this is row-level, so a determined
-- author could also reset their own status; a strict workflow guard would
-- need a status-level RPC (noted, out of scope).
create policy "complaints_update_own" on public.complaints
  for update to authenticated
  using (author = public.current_profile_id())
  with check (author = public.current_profile_id());

-- complaints · DELETE — deleting tickets is admin-only (audit trail).
create policy "complaints_delete_admin" on public.complaints
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- 7h. Policies — hostel marketplace (owners/branches/beds)
-- ------------------------------------------------------------

-- branches · SELECT — the hostel marketplace is public browsing: anyone,
-- signed-in or not, can look at listings (`hostels` view included).
create policy "branches_select_public" on public.branches
  for select to anon, authenticated
  using (true);

-- branches · INSERT — the public owner-onboarding funnel (/onboard) creates
-- a listing without a session; admins also register branches from
-- /admin/branches. TRADE-OFF: anyone can file a listing, but it only ever
-- appears under their (unverified) owner record until staff touch it.
create policy "branches_insert_public" on public.branches
  for insert to anon, authenticated
  with check (true);

-- branches · UPDATE — staff edit listings (fees, photos, sponsor flags);
-- anon-created listings are moderated through these same edits.
create policy "branches_update_staff" on public.branches
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- branches · DELETE — delisting a hostel is admin-only.
create policy "branches_delete_admin" on public.branches
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- beds · SELECT — the marketplace shows vacancy/room/fee publicly.
-- TRADE-OFF: the bed's `occupant_id` (opaque roll number) rides along for
-- availability display; column-level masking would need a public view.
create policy "beds_select_public" on public.beds
  for select to anon, authenticated
  using (true);

-- beds · ALL — the bed matrix (assign occupants, lock beds, re-price) is
-- the admissions/management desk's tool; students never write beds.
create policy "beds_manage_desk" on public.beds
  for all to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- ------------------------------------------------------------
-- 7i. Policies — admissions (applications, bookings)
-- ------------------------------------------------------------

-- applications · SELECT — the applicant sees their OWN admission request;
-- keyed by the roll number (`student_id`) because that's the mock shape.
create policy "applications_select_own" on public.applications
  for select to authenticated
  using (student_id = public.current_student_id());
-- applications · SELECT — the admissions desk reviews the queue.
create policy "applications_select_desk" on public.applications
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- applications · INSERT — a student files their own application…
create policy "applications_insert_own" on public.applications
  for insert to authenticated
  with check (student_id = public.current_student_id());
-- …the desk also enters walk-in/paper applications.
create policy "applications_insert_desk" on public.applications
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management'));

-- applications · UPDATE — ONLY the desk approves/rejects (status,
-- decided_at, bed assignment). Students must not self-approve.
create policy "applications_update_desk" on public.applications
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- applications · DELETE — removing applications is admin-only.
create policy "applications_delete_admin" on public.applications
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- bookings · SELECT — the student behind the linked application sees their
-- own token booking (bookings carry no student column, so ownership is
-- resolved through applications).
create policy "bookings_select_own" on public.bookings
  for select to authenticated
  using (exists (select 1 from public.applications a
                  where a.id = application_id
                    and a.student_id = public.current_student_id()));
-- bookings · SELECT — the admissions desk manages holds/arrivals.
create policy "bookings_select_desk" on public.bookings
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- bookings · INSERT — the desk records token-money bookings…
create policy "bookings_insert_desk" on public.bookings
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management'));
-- …and the applicant may create a booking for THEIR OWN application
-- (self-serve token flow). TRADE-OFF: payment proof isn't validated by RLS.
create policy "bookings_insert_own" on public.bookings
  for insert to authenticated
  with check (exists (select 1 from public.applications a
                       where a.id = application_id
                         and a.student_id = public.current_student_id()));

-- bookings · UPDATE — the desk confirms/expires bookings and records
-- arrivals…
create policy "bookings_update_desk" on public.bookings
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));
-- bookings · UPDATE — the owner may update their own booking (e.g. cancel
-- a held token) — same self-serve trade-off as the insert above.
create policy "bookings_update_own" on public.bookings
  for update to authenticated
  using (exists (select 1 from public.applications a
                  where a.id = application_id
                    and a.student_id = public.current_student_id()))
  with check (exists (select 1 from public.applications a
                       where a.id = application_id
                         and a.student_id = public.current_student_id()));

-- bookings · DELETE — wiping bookings is admin-only.
create policy "bookings_delete_admin" on public.bookings
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- 7j. Policies — fees (invoices)
-- ------------------------------------------------------------

-- invoices · SELECT — students read only THEIR bill. The mock shape has no
-- profile link, so ownership is matched through the signed-in profile's
-- display name (`student_name`) — a known limitation of the shared shape.
create policy "invoices_select_own" on public.invoices
  for select to authenticated
  using (student_name = public.current_profile_name());
-- invoices · SELECT — the fee desk audits every bill.
create policy "invoices_select_desk" on public.invoices
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- invoices · INSERT — only the fee desk issues invoices.
create policy "invoices_insert_desk" on public.invoices
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management'));

-- invoices · UPDATE — students may flip THEIR OWN bill's `paid` flag via
-- the "Mark as paid" action in the ledger — TRADE-OFF: row-level policy
-- can't restrict columns; a real payment gateway would move this server-side.
create policy "invoices_update_own" on public.invoices
  for update to authenticated
  using (student_name = public.current_profile_name())
  with check (student_name = public.current_profile_name());
-- invoices · UPDATE — the fee desk edits/records payment on any bill.
create policy "invoices_update_desk" on public.invoices
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- invoices · DELETE — voiding bills is admin-only.
create policy "invoices_delete_admin" on public.invoices
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- 7k. Policies — gate passes
-- ------------------------------------------------------------

-- gate_passes · SELECT — students see only THEIR passes (roll-number keyed).
create policy "gate_passes_select_own" on public.gate_passes
  for select to authenticated
  using (student_id = public.current_student_id());
-- gate_passes · SELECT — the gate/warden desk (management, admin) runs the
-- exits board.
create policy "gate_passes_select_desk" on public.gate_passes
  for select to authenticated
  using (public.current_app_role() in ('admin','management'));

-- gate_passes · INSERT — students request a pass for THEMSELVES…
create policy "gate_passes_insert_own" on public.gate_passes
  for insert to authenticated
  with check (student_id = public.current_student_id());
-- …the desk also issues walk-in passes.
create policy "gate_passes_insert_desk" on public.gate_passes
  for insert to authenticated
  with check (public.current_app_role() in ('admin','management'));

-- gate_passes · UPDATE — the desk approves/rejects/overrides any pass.
create policy "gate_passes_update_desk" on public.gate_passes
  for update to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- gate_passes · UPDATE — students drive their OWN pass lifecycle (submit →
-- scan Out → mark Returned) but `with check` forbids them from forging the
-- approval states themselves: Approved/Rejected are desk-only.
create policy "gate_passes_update_own" on public.gate_passes
  for update to authenticated
  using (student_id = public.current_student_id())
  with check (student_id = public.current_student_id()
              and status not in ('Approved','Rejected'));

-- gate_passes · DELETE — removing pass records is admin-only (audit trail).
create policy "gate_passes_delete_admin" on public.gate_passes
  for delete to authenticated
  using (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- 7l. Policies — inventory
-- ------------------------------------------------------------

-- inventory_items · SELECT — the stock register is staff-facing: the
-- management desk and mess staff (who cook from it) read it; students never do.
create policy "inventory_select_staff" on public.inventory_items
  for select to authenticated
  using (public.current_app_role() in ('admin','management','operator'));

-- inventory_items · ALL — adding/removing items and correcting counts is
-- the management desk (and admin).
create policy "inventory_manage_desk" on public.inventory_items
  for all to authenticated
  using (public.current_app_role() in ('admin','management'))
  with check (public.current_app_role() in ('admin','management'));

-- inventory_items · UPDATE — mess staff may log consumption/usage against
-- existing items (they can't create or delete register entries).
create policy "inventory_update_mess" on public.inventory_items
  for update to authenticated
  using (public.current_app_role() = 'operator')
  with check (public.current_app_role() = 'operator');

-- ============================================================
-- 8. Phase-5 hardening — app-session → RLS role bridge
-- ============================================================

-- 8a. profiles · block self-elevation of `role`.
-- `profiles_update_own` (Phase 3) lets a student edit their own row — which,
-- unguarded, includes `role` (one UPDATE away from admin). This BEFORE
-- trigger refuses any role CHANGE unless:
--   • the caller's own profile role is 'admin', or
--   • there is no end-user JWT at all (auth.uid() IS NULL) — i.e. the
--     service-role key, the SQL editor, or a direct psql session. Those
--     contexts are already RLS-exempt and fully privileged, so the trigger
--     only guards end-user JWTs; it is what lets POST /api/profile/sync
--     (verified app-session cookie → role) write roles server-side.
-- Non-role columns of profiles_update_own keep working unchanged.
create or replace function public.profiles_block_self_role_change() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and coalesce(public.current_app_role(), '') <> 'admin' then
    raise exception 'profiles: only admins may change a role (use /api/profile/sync)';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_block_self_role_change on public.profiles;
create trigger profiles_block_self_role_change
  before update on public.profiles
  for each row execute function public.profiles_block_self_role_change();

-- ============================================================
-- End of schema + RLS.
-- Apply with:  supabase db push   (or paste into the SQL editor)
-- ============================================================












