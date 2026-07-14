-- El Facto Noticias social distribution and performance system
-- Depends on 001_initial_schema.sql

create type public.social_platform as enum ('x','instagram','threads');
create type public.social_origin as enum ('el_facto','native','manual');
create type public.social_post_status as enum ('draft','scheduled','published','deleted','error');
create type public.social_post_format as enum ('alert','update','thread','context','correction','closing','caption','note');
create type public.social_alert_severity as enum ('info','warning','critical');

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform public.social_platform not null,
  handle text not null,
  external_account_id text,
  display_name text,
  active boolean not null default true,
  connected_by uuid references public.users(id),
  token_reference text,
  permissions jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  last_successful_sync_at timestamptz,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, handle)
);

comment on column public.social_accounts.token_reference is 'Reference to a server-side encrypted secret. Never store access tokens in browser-readable rows.';

create table public.social_posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.social_accounts(id) on delete cascade,
  story_id uuid references public.stories(id) on delete set null,
  external_id text,
  parent_post_id uuid references public.social_posts(id) on delete set null,
  platform public.social_platform not null,
  origin public.social_origin not null,
  status public.social_post_status not null default 'draft',
  format public.social_post_format not null,
  text text not null,
  external_url text,
  version integer not null default 1 check (version > 0),
  created_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  published_by uuid references public.users(id),
  scheduled_at timestamptz,
  published_at timestamptz,
  imported_at timestamptz,
  last_synced_at timestamptz,
  deleted_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_published_requires_date check (status <> 'published' or published_at is not null),
  constraint social_native_requires_external_id check (origin <> 'native' or external_id is not null)
);

create unique index social_posts_account_external_unique
  on public.social_posts(account_id, external_id)
  where external_id is not null;

create index social_posts_story_published_idx on public.social_posts(story_id, published_at desc);
create index social_posts_platform_published_idx on public.social_posts(platform, published_at desc);
create index social_posts_unlinked_idx on public.social_posts(published_at desc) where story_id is null and status = 'published';

create table public.social_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  captured_at timestamptz not null,
  views bigint not null default 0 check (views >= 0),
  reach bigint check (reach is null or reach >= 0),
  likes bigint not null default 0 check (likes >= 0),
  replies bigint not null default 0 check (replies >= 0),
  reposts bigint not null default 0 check (reposts >= 0),
  quotes bigint check (quotes is null or quotes >= 0),
  shares bigint check (shares is null or shares >= 0),
  saves bigint check (saves is null or saves >= 0),
  link_clicks bigint check (link_clicks is null or link_clicks >= 0),
  profile_visits bigint check (profile_visits is null or profile_visits >= 0),
  followers_gained bigint check (followers_gained is null or followers_gained >= 0),
  raw_metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(post_id, captured_at)
);

create index social_metric_post_captured_idx on public.social_metric_snapshots(post_id, captured_at desc);

create table public.social_actions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  actor_id uuid references public.users(id),
  actor_label text,
  action_type text not null,
  detail text,
  previous_data jsonb,
  new_data jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint social_action_actor_present check (actor_id is not null or actor_label is not null)
);

create index social_actions_post_occurred_idx on public.social_actions(post_id, occurred_at desc);

create table public.social_alerts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.social_posts(id) on delete cascade,
  story_id uuid references public.stories(id) on delete cascade,
  severity public.social_alert_severity not null,
  alert_type text not null,
  title text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint social_alert_resolution_complete check ((resolved_at is null and resolved_by is null) or (resolved_at is not null and resolved_by is not null))
);

create index social_alerts_open_idx on public.social_alerts(severity, created_at desc) where resolved_at is null;

create table public.social_sync_cursors (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.social_accounts(id) on delete cascade,
  cursor_kind text not null,
  cursor_value text,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  next_sync_at timestamptz,
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(account_id, cursor_kind)
);

create index social_sync_due_idx on public.social_sync_cursors(next_sync_at) where next_sync_at is not null;

create or replace view public.social_post_latest_metrics as
select distinct on (post_id)
  post_id,
  captured_at,
  views,
  reach,
  likes,
  replies,
  reposts,
  quotes,
  shares,
  saves,
  link_clicks,
  profile_visits,
  followers_gained
from public.social_metric_snapshots
order by post_id, captured_at desc;

create or replace view public.story_social_performance as
select
  p.story_id,
  count(*) filter (where p.status = 'published') as published_posts,
  count(distinct p.platform) filter (where p.status = 'published') as platforms,
  coalesce(sum(m.views), 0) as accumulated_views,
  coalesce(sum(m.likes + m.replies + m.reposts + coalesce(m.quotes,0) + coalesce(m.shares,0) + coalesce(m.saves,0)), 0) as accumulated_interactions,
  coalesce(sum(m.link_clicks), 0) as accumulated_link_clicks,
  coalesce(sum(m.followers_gained), 0) as accumulated_followers_gained
from public.social_posts p
left join public.social_post_latest_metrics m on m.post_id = p.id
where p.story_id is not null
  and p.deleted_at is null
group by p.story_id;

alter table public.social_accounts enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_metric_snapshots enable row level security;
alter table public.social_actions enable row level security;
alter table public.social_alerts enable row level security;
alter table public.social_sync_cursors enable row level security;

create policy "authenticated read social accounts" on public.social_accounts
  for select to authenticated using (true);
create policy "managers manage social accounts" on public.social_accounts
  for all to authenticated using (public.is_editorial_manager()) with check (public.is_editorial_manager());

create policy "authenticated read social posts" on public.social_posts
  for select to authenticated using (deleted_at is null or public.is_editorial_manager());
create policy "social roles create social posts" on public.social_posts
  for insert to authenticated with check (
    created_by = auth.uid()
    and public.current_app_role() in ('social','editor','admin','director')
  );
create policy "social roles update social posts" on public.social_posts
  for update to authenticated using (
    created_by = auth.uid()
    or public.current_app_role() in ('social','editor','admin','director')
  ) with check (
    created_by = auth.uid()
    or public.current_app_role() in ('social','editor','admin','director')
  );
create policy "managers delete social posts" on public.social_posts
  for delete to authenticated using (public.is_editorial_manager());

create policy "authenticated read social metrics" on public.social_metric_snapshots
  for select to authenticated using (true);
create policy "managers and social insert metrics" on public.social_metric_snapshots
  for insert to authenticated with check (public.current_app_role() in ('social','editor','admin','director'));

create policy "authenticated read social actions" on public.social_actions
  for select to authenticated using (true);
create policy "authenticated insert social actions" on public.social_actions
  for insert to authenticated with check (actor_id = auth.uid() or public.current_app_role() in ('editor','admin','director'));

create policy "authenticated read social alerts" on public.social_alerts
  for select to authenticated using (true);
create policy "managers and social manage alerts" on public.social_alerts
  for all to authenticated using (public.current_app_role() in ('social','editor','admin','director'))
  with check (public.current_app_role() in ('social','editor','admin','director'));

create policy "managers read sync cursors" on public.social_sync_cursors
  for select to authenticated using (public.current_app_role() in ('social','editor','admin','director'));
create policy "managers manage sync cursors" on public.social_sync_cursors
  for all to authenticated using (public.current_app_role() in ('social','editor','admin','director'))
  with check (public.current_app_role() in ('social','editor','admin','director'));

grant select on public.social_post_latest_metrics to authenticated;
grant select on public.story_social_performance to authenticated;
