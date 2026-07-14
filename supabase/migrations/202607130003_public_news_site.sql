-- Public publishing layer for the new El Facto website.
-- Squarespace is treated only as a legacy content source; published articles live in Supabase.

alter table public.instagram_story_drafts
  add column if not exists slug text,
  add column if not exists section text not null default 'Noticias',
  add column if not exists canonical_url text;

update public.instagram_story_drafts
set slug = coalesce(
  nullif(seo->>'slug', ''),
  trim(both '-' from regexp_replace(lower(unaccent(title)), '[^a-z0-9]+', '-', 'g')) || '-' || left(id::text, 8)
)
where slug is null or slug = '';

alter table public.instagram_story_drafts
  alter column slug set not null;

create unique index if not exists instagram_story_drafts_slug_idx
  on public.instagram_story_drafts(slug);

-- Anonymous readers can see only articles that have passed editorial approval and publication.
drop policy if exists "public read published instagram articles" on public.instagram_story_drafts;
create policy "public read published instagram articles"
  on public.instagram_story_drafts
  for select
  to anon
  using (editor_status = 'published' and published_at is not null);

-- The media relation is needed only to expose the original Reel permalink and publication time.
drop policy if exists "public read media for published articles" on public.instagram_media;
create policy "public read media for published articles"
  on public.instagram_media
  for select
  to anon
  using (
    exists (
      select 1
      from public.instagram_story_drafts d
      where d.media_id = instagram_media.id
        and d.editor_status = 'published'
        and d.published_at is not null
    )
  );

create or replace view public.published_articles
with (security_invoker = true)
as
select
  d.id,
  d.media_id,
  d.slug,
  d.content_type,
  d.section,
  d.title,
  d.dek,
  d.lead,
  d.body,
  d.context,
  d.author_id,
  d.author_name,
  d.cover,
  d.seo,
  d.canonical_url,
  d.published_at,
  d.updated_at,
  m.permalink as instagram_permalink,
  m.published_at as instagram_published_at,
  m.thumbnail_url as instagram_thumbnail_url
from public.instagram_story_drafts d
join public.instagram_media m on m.id = d.media_id
where d.editor_status = 'published'
  and d.published_at is not null;

grant select on public.published_articles to anon, authenticated;

comment on view public.published_articles is
  'Safe public projection of editorially approved articles generated from Instagram.';
