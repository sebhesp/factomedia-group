-- Factomedia Instagram-first editorial pipeline
-- Safe to run in a new Supabase project. Uses text stages to keep migrations evolvable.

create extension if not exists pgcrypto;

create table if not exists public.instagram_accounts (
  id uuid primary key default gen_random_uuid(),
  instagram_user_id text not null unique,
  username text not null,
  status text not null default 'pending' check (status in ('pending','connected','expired','revoked','error')),
  token_secret_name text,
  last_synced_at timestamptz,
  sync_cursor text,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instagram_media (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.instagram_accounts(id) on delete cascade,
  instagram_media_id text not null unique,
  media_type text not null,
  caption text,
  permalink text not null,
  media_url text,
  thumbnail_url text,
  published_at timestamptz not null,
  presenter_id text,
  presenter_name text,
  editorial_origin text not null default 'reviewed' check (editorial_origin in ('reviewed','manual_review_required')),
  processing_status text not null default 'detected' check (processing_status in ('detected','imported','transcribing','analyzing','researching','drafting','needs_review','approved','published','failed')),
  metadata jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_media_account_published_idx on public.instagram_media(account_id, published_at desc);
create index if not exists instagram_media_status_idx on public.instagram_media(processing_status, detected_at desc);

create table if not exists public.instagram_pipeline_jobs (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null unique references public.instagram_media(id) on delete cascade,
  stage text not null default 'detected',
  progress smallint not null default 0 check (progress between 0 and 100),
  attempts smallint not null default 0,
  locked_at timestamptz,
  locked_by text,
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  last_error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_jobs_queue_idx on public.instagram_pipeline_jobs(stage, next_attempt_at, locked_at);

create table if not exists public.instagram_transcripts (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null unique references public.instagram_media(id) on delete cascade,
  language text not null default 'es',
  transcript text not null,
  confidence numeric(5,4),
  segments jsonb not null default '[]'::jsonb,
  model text not null,
  needs_human_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instagram_story_drafts (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null unique references public.instagram_media(id) on delete cascade,
  content_type text not null default 'news' check (content_type in ('news','analysis','verification','column')),
  title text not null,
  dek text,
  lead text,
  body text not null,
  context text,
  author_id text,
  author_name text,
  verification_status text not null default 'editorially_reviewed_origin',
  claims jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  cover jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  editor_status text not null default 'draft' check (editor_status in ('draft','needs_review','changes_requested','approved','published','discarded')),
  cms_entry_id text,
  cms_url text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instagram_external_matches (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.instagram_media(id) on delete cascade,
  source_name text not null,
  source_domain text,
  source_url text not null,
  headline text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  similarity numeric(5,4),
  relation text not null default 'context' check (relation in ('context','corroboration','contradiction','update','duplicate')),
  is_primary_source boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  unique(media_id, source_url)
);

create index if not exists instagram_matches_media_time_idx on public.instagram_external_matches(media_id, published_at);

create table if not exists public.instagram_pipeline_events (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.instagram_media(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system' check (actor_type in ('system','ai','user','integration')),
  actor_id text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists instagram_events_media_time_idx on public.instagram_pipeline_events(media_id, occurred_at desc);

create or replace view public.instagram_editorial_timing as
select
  m.id as media_id,
  m.instagram_media_id,
  m.published_at as instagram_published_at,
  m.detected_at,
  d.created_at as draft_ready_at,
  d.reviewed_at,
  d.published_at as web_published_at,
  min(x.published_at) filter (where x.published_at is not null) as first_external_match_at,
  percentile_cont(0.5) within group (order by extract(epoch from x.published_at))
    filter (where x.published_at is not null) as external_median_published_epoch,
  extract(epoch from (m.detected_at - m.published_at))::bigint as seconds_reel_to_detection,
  extract(epoch from (d.created_at - m.detected_at))::bigint as seconds_detection_to_draft,
  extract(epoch from (d.published_at - m.published_at))::bigint as seconds_reel_to_web
from public.instagram_media m
left join public.instagram_story_drafts d on d.media_id = m.id
left join public.instagram_external_matches x on x.media_id = m.id
group by m.id, d.id;

alter table public.instagram_accounts enable row level security;
alter table public.instagram_media enable row level security;
alter table public.instagram_pipeline_jobs enable row level security;
alter table public.instagram_transcripts enable row level security;
alter table public.instagram_story_drafts enable row level security;
alter table public.instagram_external_matches enable row level security;
alter table public.instagram_pipeline_events enable row level security;

-- Authenticated newsroom users may read pipeline state. Writes happen through service-role workers
-- or through dedicated reviewed actions added in later migrations.
create policy "newsroom read instagram accounts" on public.instagram_accounts for select to authenticated using (true);
create policy "newsroom read instagram media" on public.instagram_media for select to authenticated using (true);
create policy "newsroom read instagram jobs" on public.instagram_pipeline_jobs for select to authenticated using (true);
create policy "newsroom read instagram transcripts" on public.instagram_transcripts for select to authenticated using (true);
create policy "newsroom read instagram drafts" on public.instagram_story_drafts for select to authenticated using (true);
create policy "newsroom read instagram matches" on public.instagram_external_matches for select to authenticated using (true);
create policy "newsroom read instagram events" on public.instagram_pipeline_events for select to authenticated using (true);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_instagram_accounts before update on public.instagram_accounts for each row execute function public.touch_updated_at();
create trigger touch_instagram_media before update on public.instagram_media for each row execute function public.touch_updated_at();
create trigger touch_instagram_jobs before update on public.instagram_pipeline_jobs for each row execute function public.touch_updated_at();
create trigger touch_instagram_transcripts before update on public.instagram_transcripts for each row execute function public.touch_updated_at();
create trigger touch_instagram_drafts before update on public.instagram_story_drafts for each row execute function public.touch_updated_at();
