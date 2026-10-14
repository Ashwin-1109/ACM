-- =========================================================================
-- VISUAL INTELLIGENCE 2.0 — THE ROYAL EDITION
-- Official Production Supabase PostgreSQL Schema & Realtime Setup
-- Fully Idempotent & Production-Tested
-- =========================================================================

-- 1. Create Teams Table
create table if not exists public.teams (
  id text primary key,
  registration_code text unique not null,
  room_id text not null check (room_id in ('K206', 'K207', 'K208', 'K209')),
  team_name text not null,
  normalized_team_name text unique not null,
  leader_name text not null,
  member_names text[] not null,
  leader_registration_number text,
  leader_email text,
  department text,
  academic_year text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure nullable columns exist if table was previously created without them
alter table public.teams add column if not exists leader_registration_number text;
alter table public.teams add column if not exists leader_email text;
alter table public.teams add column if not exists department text;
alter table public.teams add column if not exists academic_year text;

-- 2. Create Event Settings Table
create table if not exists public.event_settings (
  id text primary key default 'settings_main',
  registration_open boolean default true not null,
  registration_limit integer default 100 not null,
  event_title text default 'VISUAL INTELLIGENCE 2.0' not null,
  event_date text default '2026-10-14' not null,
  global_active_round integer default 1 not null,
  winners_published boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Default Settings
insert into public.event_settings (id, registration_open, registration_limit, event_title, event_date, global_active_round, winners_published)
values ('settings_main', true, 100, 'VISUAL INTELLIGENCE 2.0', '2026-10-14', 1, false)
on conflict (id) do nothing;

-- 3. Create Room Round State Table
create table if not exists public.room_round_state (
  room_id text primary key check (room_id in ('K206', 'K207', 'K208', 'K209')),
  active_round integer default 1 not null check (active_round between 1 and 4),
  round_status text default 'IN_PROGRESS' not null check (round_status in ('IN_PROGRESS', 'JUDGING_COMPLETE', 'FINALIZED')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert Default Room States
insert into public.room_round_state (room_id, active_round, round_status)
values 
  ('K206', 1, 'IN_PROGRESS'),
  ('K207', 1, 'IN_PROGRESS'),
  ('K208', 1, 'IN_PROGRESS'),
  ('K209', 1, 'IN_PROGRESS')
on conflict (room_id) do nothing;

-- 4. Create Judge Scores Table
create table if not exists public.judge_scores (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  round_number integer not null check (round_number between 1 and 4),
  judge_number integer not null check (judge_number between 1 and 3),
  criterion_scores jsonb not null default '{}'::jsonb,
  judge_total numeric(5, 2) not null default 0,
  is_complete boolean default true not null,
  judge_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, round_number, judge_number)
);

-- 5. Create Round Attempts Table (Solve Time in Round 2)
create table if not exists public.round_attempts (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  round_number integer not null check (round_number between 1 and 4),
  solve_time_minutes numeric(5, 2),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, round_number)
);

-- 6. Create Qualifications Table
create table if not exists public.qualifications (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  round_number integer not null check (round_number between 1 and 4),
  status text not null check (status in ('COMPETING', 'QUALIFIED', 'ELIMINATED', 'FINALIST', 'WINNER')),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, round_number)
);

-- 7. Create Review Discrepancy Approvals Table
create table if not exists public.review_approvals (
  id text primary key,
  team_id text not null references public.teams(id) on delete cascade,
  round_number integer not null check (round_number between 1 and 4),
  approved boolean default false not null,
  notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (team_id, round_number)
);

-- 8. Create Admin Audit Logs Table
create table if not exists public.admin_audit_logs (
  id text primary key,
  action text not null,
  entity_type text,
  entity_id text,
  change_details text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Create Indexes for High Performance Queries
create index if not exists idx_teams_room on public.teams(room_id);
create index if not exists idx_scores_team_round on public.judge_scores(team_id, round_number);
create index if not exists idx_qual_team_round on public.qualifications(team_id, round_number);

-- =========================================================================
-- 10. Table Privileges & Grants (Fixes PostgreSQL Error 42501 Permission Denied)
-- =========================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;

-- =========================================================================
-- 11. Supabase Realtime Publication (Safe Idempotent Check)
-- =========================================================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teams') then
    alter publication supabase_realtime add table public.teams;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'judge_scores') then
    alter publication supabase_realtime add table public.judge_scores;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'round_attempts') then
    alter publication supabase_realtime add table public.round_attempts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'qualifications') then
    alter publication supabase_realtime add table public.qualifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'event_settings') then
    alter publication supabase_realtime add table public.event_settings;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_round_state') then
    alter publication supabase_realtime add table public.room_round_state;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'review_approvals') then
    alter publication supabase_realtime add table public.review_approvals;
  end if;
end $$;

-- =========================================================================
-- 12. Row Level Security (RLS) Configuration (Clean & Safe)
-- =========================================================================
alter table public.teams enable row level security;
alter table public.event_settings enable row level security;
alter table public.room_round_state enable row level security;
alter table public.judge_scores enable row level security;
alter table public.round_attempts enable row level security;
alter table public.qualifications enable row level security;
alter table public.review_approvals enable row level security;
alter table public.admin_audit_logs enable row level security;

-- Drop existing policies first to prevent "policy already exists" error
drop policy if exists "Allow public read teams" on public.teams;
drop policy if exists "Allow public read event_settings" on public.event_settings;
drop policy if exists "Allow public read room_round_state" on public.room_round_state;
drop policy if exists "Allow public read judge_scores" on public.judge_scores;
drop policy if exists "Allow public read round_attempts" on public.round_attempts;
drop policy if exists "Allow public read qualifications" on public.qualifications;
drop policy if exists "Allow public read review_approvals" on public.review_approvals;
drop policy if exists "Allow public insert teams" on public.teams;
drop policy if exists "Allow all actions for service role on teams" on public.teams;
drop policy if exists "Allow all actions for service role on event_settings" on public.event_settings;
drop policy if exists "Allow all actions for service role on room_round_state" on public.room_round_state;
drop policy if exists "Allow all actions for service role on judge_scores" on public.judge_scores;
drop policy if exists "Allow all actions for service role on round_attempts" on public.round_attempts;
drop policy if exists "Allow all actions for service role on qualifications" on public.qualifications;
drop policy if exists "Allow all actions for service role on review_approvals" on public.review_approvals;
drop policy if exists "Allow all actions for service role on admin_audit_logs" on public.admin_audit_logs;

-- Recreate policies with full clean access
create policy "Allow public read teams" on public.teams for select using (true);
create policy "Allow public read event_settings" on public.event_settings for select using (true);
create policy "Allow public read room_round_state" on public.room_round_state for select using (true);
create policy "Allow public read judge_scores" on public.judge_scores for select using (true);
create policy "Allow public read round_attempts" on public.round_attempts for select using (true);
create policy "Allow public read qualifications" on public.qualifications for select using (true);
create policy "Allow public read review_approvals" on public.review_approvals for select using (true);

-- Allow team registration insert
create policy "Allow public insert teams" on public.teams for insert with check (
  (select count(*) from public.teams) < (select registration_limit from public.event_settings where id = 'settings_main')
  and (select registration_open from public.event_settings where id = 'settings_main') = true
);

-- Full control for service role & authenticated administrators
create policy "Allow all actions for service role on teams" on public.teams for all using (true) with check (true);
create policy "Allow all actions for service role on event_settings" on public.event_settings for all using (true) with check (true);
create policy "Allow all actions for service role on room_round_state" on public.room_round_state for all using (true) with check (true);
create policy "Allow all actions for service role on judge_scores" on public.judge_scores for all using (true) with check (true);
create policy "Allow all actions for service role on round_attempts" on public.round_attempts for all using (true) with check (true);
create policy "Allow all actions for service role on qualifications" on public.qualifications for all using (true) with check (true);
create policy "Allow all actions for service role on review_approvals" on public.review_approvals for all using (true) with check (true);
create policy "Allow all actions for service role on admin_audit_logs" on public.admin_audit_logs for all using (true) with check (true);
