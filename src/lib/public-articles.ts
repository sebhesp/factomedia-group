import { createClient } from "@supabase/supabase-js";

export type PublicArticle = {
  id: string;
  slug: string;
  contentType: string;
  section: string;
  title: string;
  dek: string;
  lead: string;
  body: string;
  context: string;
  authorName: string;
  coverUrl: string | null;
  coverAlt: string | null;
  canonicalUrl: string | null;
  publishedAt: string;
  updatedAt: string;
  instagramPermalink: string;
  instagramPublishedAt: string;
  instagramThumbnailUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

type PublishedArticleRow = {
  id: string;
  slug: string;
  content_type: string;
  section: string;
  title: string;
  dek: string | null;
  lead: string | null;
  body: string;
  context: string | null;
  author_name: string | null;
  cover: Record<string, unknown> | null;
  seo: Record<string, unknown> | null;
  canonical_url: string | null;
  published_at: string;
  updated_at: string;
  instagram_permalink: string;
  instagram_published_at: string;
  instagram_thumbnail_url: string | null;
};

function textField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapRow(row: PublishedArticleRow): PublicArticle {
  const cover = row.cover ?? {};
  const seo = row.seo ?? {};
  return {
    id: row.id,
    slug: row.slug,
    contentType: row.content_type,
    section: row.section,
    title: row.title,
    dek: row.dek ?? row.lead ?? "",
    lead: row.lead ?? "",
    body: row.body,
    context: row.context ?? "",
    authorName: row.author_name ?? "El Facto",
    coverUrl: textField(cover.url) ?? textField(cover.image_url) ?? row.instagram_thumbnail_url,
    coverAlt: textField(cover.alt) ?? textField(cover.alt_text),
    canonicalUrl: row.canonical_url,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    instagramPermalink: row.instagram_permalink,
    instagramPublishedAt: row.instagram_published_at,
    instagramThumbnailUrl: row.instagram_thumbnail_url,
    seoTitle: textField(seo.meta_title) ?? textField(seo.title),
    seoDescription: textField(seo.meta_description) ?? textField(seo.description),
  };
}

function publicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function getPublicArticleBySlug(slug: string) {
  const client = publicClient();
  if (!client) return null;
  const { data, error } = await client
    .from("published_articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as PublishedArticleRow);
}

export async function getLatestPublicArticles(limit = 20) {
  const client = publicClient();
  if (!client) return [] as PublicArticle[];
  const { data, error } = await client
    .from("published_articles")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [] as PublicArticle[];
  return (data as PublishedArticleRow[]).map(mapRow);
}
