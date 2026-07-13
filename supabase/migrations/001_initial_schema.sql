-- Factomedia Group MVP schema
-- Run with Supabase CLI or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('collaborator', 'editor', 'verifier', 'social', 'admin', 'director');
create type public.story_status as enum ('draft','developing','waiting_information','verification','review','approved','scheduled','published','updated','corrected','archived','discarded');
create type public.verification_status as enum ('pending','supported','disputed','false');
create type public.asset_kind as enum ('image','audio','video','document');
create type public.goal_kind as enum ('stories_proposed','stories_delivered','stories_published','followups','pending_resolved');

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.app_role not null unique,
  name text not null,
  description text
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'collaborator',
  team_id uuid references public.teams(id),
  phone_e164 text unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  body text not null default '',
  category_id uuid references public.categories(id),
  status public.story_status not null default 'draft',
  author_id uuid not null references public.users(id),
  responsible_id uuid references public.users(id),
  location jsonb,
  people jsonb not null default '[]'::jsonb,
  organizations jsonb not null default '[]'::jsonb,
  dates jsonb not null default '[]'::jsonb,
  figures jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint published_requires_date check (status not in ('published','updated','corrected') or published_at is not null)
);

create table public.story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  version_number integer not null,
  title text not null,
  summary text not null,
  body text not null,
  status public.story_status not null,
  created_by uuid not null references public.users(id),
  change_note text,
  created_at timestamptz not null default now(),
  unique(story_id, version_number)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('person','document','link','dataset')),
  url text,
  note text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  text text not null,
  verification_status public.verification_status not null default 'pending',
  verification_note text,
  verified_by uuid references public.users(id),
  verified_at timestamptz,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claim_sources (
  claim_id uuid not null references public.claims(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  primary key (claim_id, source_id)
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  kind public.asset_kind not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  caption text,
  uploaded_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.users(id),
  assignment_role text not null,
  assigned_by uuid not null references public.users(id),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(story_id, user_id, assignment_role)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id),
  user_id uuid references public.users(id),
  kind public.goal_kind not null,
  target integer not null check (target >= 0),
  period_start date not null,
  period_end date not null,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  check ((team_id is not null) <> (user_id is not null))
);

create table public.goal_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  value integer not null default 0 check (value >= 0),
  calculated_at timestamptz not null default now(),
  unique(goal_id)
);

create table public.editorial_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  actor_id uuid not null references public.users(id),
  event_type text not null,
  previous_data jsonb,
  new_data jsonb,
  comment text,
  created_at timestamptz not null default now()
);

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  approved_by uuid not null references public.users(id),
  decision text not null check (decision in ('approved','changes_requested','rejected')),
  comment text,
  created_at timestamptz not null default now()
);

create table public.corrections (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  description text not null,
  previous_text text,
  corrected_text text,
  created_by uuid not null references public.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.public_pages (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null unique references public.stories(id) on delete cascade,
  slug text not null unique,
  title text not null,
  summary text not null,
  body text not null,
  category_name text,
  author_name text not null,
  published_at timestamptz not null,
  updated_at timestamptz not null,
  correction_summary jsonb not null default '[]'::jsonb,
  structured_data jsonb not null default '{}'::jsonb
);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories(id) on delete cascade,
  event_name text not null check (event_name in ('page_view','read_started','read_completed','share_clicked')),
  anonymous_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index stories_status_idx on public.stories(status);
create index stories_responsible_idx on public.stories(responsible_id);
create index editorial_events_story_created_idx on public.editorial_events(story_id, created_at desc);
create index analytics_events_story_created_idx on public.analytics_events(story_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id, read_at);

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public
as $$ select role from public.users where id = auth.uid() $$;

create or replace function public.is_editorial_manager()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce(public.current_app_role() in ('editor','admin','director'), false) $$;

create or replace function public.log_editorial_event(
  p_story_id uuid,
  p_event_type text,
  p_previous_data jsonb default null,
  p_new_data jsonb default null,
  p_comment text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into public.editorial_events(story_id, actor_id, event_type, previous_data, new_data, comment)
  values (p_story_id, auth.uid(), p_event_type, p_previous_data, p_new_data, p_comment)
  returning id into new_id;
  return new_id;
end;
$$;

alter table public.teams enable row level security;
alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.stories enable row level security;
alter table public.story_versions enable row level security;
alter table public.sources enable row level security;
alter table public.claims enable row level security;
alter table public.claim_sources enable row level security;
alter table public.assets enable row level security;
alter table public.assignments enable row level security;
alter table public.goals enable row level security;
alter table public.goal_progress enable row level security;
alter table public.editorial_events enable row level security;
alter table public.approvals enable row level security;
alter table public.corrections enable row level security;
alter table public.public_pages enable row level security;
alter table public.analytics_events enable row level security;
alter table public.notifications enable row level security;

create policy "authenticated can read shared reference data" on public.categories for select to authenticated using (true);
create policy "authenticated can read teams" on public.teams for select to authenticated using (true);
create policy "authenticated can read roles" on public.roles for select to authenticated using (true);
create policy "users read own profile or managers read all" on public.users for select to authenticated using (id = auth.uid() or public.is_editorial_manager());
create policy "users update own profile" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "authenticated read active stories" on public.stories for select to authenticated using (deleted_at is null);
create policy "collaborators create own stories" on public.stories for insert to authenticated with check (author_id = auth.uid());
create policy "authors responsible and managers update stories" on public.stories for update to authenticated using (author_id = auth.uid() or responsible_id = auth.uid() or public.is_editorial_manager()) with check (author_id = auth.uid() or responsible_id = auth.uid() or public.is_editorial_manager());
create policy "managers delete stories" on public.stories for delete to authenticated using (public.is_editorial_manager());

create policy "authenticated read story versions" on public.story_versions for select to authenticated using (true);
create policy "authenticated create versions as self" on public.story_versions for insert to authenticated with check (created_by = auth.uid());
create policy "authenticated manage story sources" on public.sources for all to authenticated using (true) with check (created_by = auth.uid() or public.is_editorial_manager());
create policy "authenticated manage claims" on public.claims for all to authenticated using (true) with check (created_by = auth.uid() or public.is_editorial_manager());
create policy "authenticated manage claim links" on public.claim_sources for all to authenticated using (true) with check (true);
create policy "authenticated manage assets" on public.assets for all to authenticated using (true) with check (uploaded_by = auth.uid() or public.is_editorial_manager());
create policy "authenticated read assignments" on public.assignments for select to authenticated using (user_id = auth.uid() or public.is_editorial_manager());
create policy "managers manage assignments" on public.assignments for all to authenticated using (public.is_editorial_manager()) with check (public.is_editorial_manager());
create policy "users read own goals managers read all" on public.goals for select to authenticated using (user_id = auth.uid() or public.is_editorial_manager());
create policy "managers manage goals" on public.goals for all to authenticated using (public.is_editorial_manager()) with check (public.is_editorial_manager());
create policy "goal progress follows goal visibility" on public.goal_progress for select to authenticated using (exists(select 1 from public.goals g where g.id = goal_id and (g.user_id = auth.uid() or public.is_editorial_manager())));
create policy "authenticated read editorial events" on public.editorial_events for select to authenticated using (true);
create policy "authenticated insert own events" on public.editorial_events for insert to authenticated with check (actor_id = auth.uid());
create policy "managers manage approvals" on public.approvals for all to authenticated using (public.is_editorial_manager()) with check (public.is_editorial_manager() and approved_by = auth.uid());
create policy "authenticated read corrections" on public.corrections for select to authenticated using (true);
create policy "managers create corrections" on public.corrections for insert to authenticated with check (public.is_editorial_manager() and created_by = auth.uid());
create policy "public can read published projection" on public.public_pages for select to anon, authenticated using (true);
create policy "managers manage public projection" on public.public_pages for all to authenticated using (public.is_editorial_manager()) with check (public.is_editorial_manager());
create policy "anyone can create public analytics" on public.analytics_events for insert to anon, authenticated with check (true);
create policy "managers read analytics" on public.analytics_events for select to authenticated using (public.is_editorial_manager());
create policy "users read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
