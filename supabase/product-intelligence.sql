-- Factomedia product intelligence schema
-- Run after the core authentication/profile schema exists.

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text not null,
  session_id text not null,
  event_name text not null,
  path text not null,
  app_version text not null default 'unknown',
  properties jsonb not null default '{}'::jsonb,
  constraint product_events_name_length check (char_length(event_name) between 1 and 80),
  constraint product_events_path_length check (char_length(path) between 1 and 300),
  constraint product_events_properties_size check (octet_length(properties::text) <= 8192)
);

create index if not exists product_events_occurred_at_idx on public.product_events (occurred_at desc);
create index if not exists product_events_name_time_idx on public.product_events (event_name, occurred_at desc);
create index if not exists product_events_session_idx on public.product_events (session_id, occurred_at);
create index if not exists product_events_user_idx on public.product_events (user_id, occurred_at desc) where user_id is not null;

create table if not exists public.product_feedback (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text not null,
  session_id text not null,
  path text not null,
  score smallint not null check (score between 1 and 5),
  category text not null check (category in ('blocked','error','too_many_steps','ai_unhelpful','positive','other')),
  comment text,
  status text not null default 'new' check (status in ('new','triaged','planned','resolved','dismissed')),
  owner_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  constraint product_feedback_comment_length check (comment is null or char_length(comment) <= 700)
);

create index if not exists product_feedback_time_idx on public.product_feedback (occurred_at desc);
create index if not exists product_feedback_status_idx on public.product_feedback (status, occurred_at desc);
create index if not exists product_feedback_path_idx on public.product_feedback (path, occurred_at desc);

create table if not exists public.product_experiments (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  hypothesis text not null,
  primary_metric text not null,
  guardrail_metrics text[] not null default '{}',
  variants jsonb not null,
  status text not null default 'draft' check (status in ('draft','running','paused','completed','cancelled')),
  allocation_percent smallint not null default 100 check (allocation_percent between 0 and 100),
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_experiment_assignments (
  experiment_id uuid not null references public.product_experiments(id) on delete cascade,
  visitor_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  variant text not null,
  assigned_at timestamptz not null default now(),
  primary key (experiment_id, visitor_id)
);

create table if not exists public.product_insights (
  id uuid primary key default gen_random_uuid(),
  insight_key text unique not null,
  generated_at timestamptz not null default now(),
  window_start timestamptz not null,
  window_end timestamptz not null,
  severity text not null check (severity in ('info','attention','critical')),
  title text not null,
  explanation text not null,
  recommended_action text not null,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','accepted','testing','resolved','dismissed')),
  owner_id uuid references auth.users(id) on delete set null,
  experiment_id uuid references public.product_experiments(id) on delete set null,
  reviewed_at timestamptz
);

alter table public.product_events enable row level security;
alter table public.product_feedback enable row level security;
alter table public.product_experiments enable row level security;
alter table public.product_experiment_assignments enable row level security;
alter table public.product_insights enable row level security;

-- Authenticated collaborators may create their own telemetry and feedback.
create policy "authenticated users insert product events"
on public.product_events for insert to authenticated
with check (user_id is null or user_id = auth.uid());

create policy "authenticated users insert product feedback"
on public.product_feedback for insert to authenticated
with check (user_id is null or user_id = auth.uid());

-- Reading analytics should be restricted to trusted editorial/admin roles.
-- Replace the profile role lookup below if the core schema uses a different table.
create policy "admins read product events"
on public.product_events for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')));

create policy "admins manage feedback"
on public.product_feedback for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')));

create policy "admins manage experiments"
on public.product_experiments for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "users read own experiment assignments"
on public.product_experiment_assignments for select to authenticated
using (user_id = auth.uid() or user_id is null);

create policy "admins manage experiment assignments"
on public.product_experiment_assignments for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "editors read product insights"
on public.product_insights for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','editor')));

create policy "admins manage product insights"
on public.product_insights for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
