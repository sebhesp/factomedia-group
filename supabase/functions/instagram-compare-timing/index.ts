import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-worker-secret",
};

type GdeltArticle = {
  url: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function required(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function parseGdeltDate(value?: string) {
  if (!value) return null;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
}

function normalizeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extractPublishedAt(html: string) {
  const patterns = [
    /<meta[^>]+property=["']article:published_time["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']article:published_time["']/i,
    /<meta[^>]+name=["'](?:date|pubdate|publish-date|publication_date)["'][^>]+content=["']([^"']+)["']/i,
    /["']datePublished["']\s*:\s*["']([^"']+)["']/i,
    /<time[^>]+datetime=["']([^"']+)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const normalized = normalizeDate(match?.[1]);
    if (normalized) return normalized;
  }
  return null;
}

function similarity(a: string, b: string) {
  const words = (value: string) => new Set(value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/[a-z0-9]{4,}/g) ?? []);
  const left = words(a);
  const right = words(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const word of left) if (right.has(word)) overlap += 1;
  return overlap / Math.max(left.size, right.size);
}

async function resolveArticleTime(article: GdeltArticle) {
  let exact: string | null = null;
  try {
    const url = new URL(article.url);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Unsupported URL protocol");
    const response = await fetch(url, {
      headers: { "User-Agent": "FactomediaResearchBot/1.0 (+editorial timing comparison)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) {
      const type = response.headers.get("content-type") ?? "";
      if (type.includes("text/html")) exact = extractPublishedAt((await response.text()).slice(0, 1_500_000));
    }
  } catch (_) {
    // Exact page timestamps are best effort. GDELT seen date remains as fallback.
  }
  const seen = parseGdeltDate(article.seendate);
  return { publishedAt: exact ?? seen, timestampSource: exact ? "page_metadata" : seen ? "gdelt_seen_date" : "unavailable" };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (request.headers.get("x-worker-secret") !== Deno.env.get("INSTAGRAM_WORKER_SECRET")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = required("SUPABASE_URL");
  const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  try {
    const body = await request.json().catch(() => ({}));
    const requestedMediaId = typeof body.media_id === "string" ? body.media_id : null;

    let query = admin
      .from("instagram_story_drafts")
      .select("media_id,title,instagram_media!inner(published_at,permalink)")
      .in("editor_status", ["draft", "needs_review", "approved"])
      .order("created_at", { ascending: false })
      .limit(1);
    if (requestedMediaId) query = query.eq("media_id", requestedMediaId);

    const { data: drafts, error: draftError } = await query;
    if (draftError) throw draftError;
    const draft = drafts?.[0] as undefined | {
      media_id: string;
      title: string;
      instagram_media: { published_at: string; permalink: string };
    };
    if (!draft) return json({ ok: true, compared: false, reason: "no_draft" });

    const search = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    search.searchParams.set("query", `\"${draft.title.slice(0, 180)}\"`);
    search.searchParams.set("mode", "ArtList");
    search.searchParams.set("format", "json");
    search.searchParams.set("maxrecords", "25");
    search.searchParams.set("sort", "datedesc");
    search.searchParams.set("timespan", "2d");

    let articles: GdeltArticle[] = [];
    const searchResponse = await fetch(search, { signal: AbortSignal.timeout(20_000) });
    if (searchResponse.ok) {
      const payload = await searchResponse.json();
      articles = Array.isArray(payload?.articles) ? payload.articles : [];
    }

    const ownDomain = new URL(draft.instagram_media.permalink).hostname;
    const candidates = articles
      .filter((article) => article.url && !article.url.includes(ownDomain))
      .map((article) => ({ article, score: similarity(draft.title, article.title ?? "") }))
      .filter(({ score }) => score >= 0.18)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const resolved = await Promise.all(candidates.map(async ({ article, score }) => ({
      article,
      score,
      timing: await resolveArticleTime(article),
    })));

    for (const item of resolved) {
      await admin.from("instagram_external_matches").upsert({
        media_id: draft.media_id,
        source_name: item.article.domain ?? new URL(item.article.url).hostname,
        source_domain: item.article.domain ?? new URL(item.article.url).hostname,
        source_url: item.article.url,
        headline: item.article.title ?? null,
        published_at: item.timing.publishedAt,
        similarity: item.score,
        relation: "context",
        metadata: {
          timestamp_source: item.timing.timestampSource,
          gdelt_seen_date: item.article.seendate ?? null,
          source_country: item.article.sourcecountry ?? null,
          language: item.article.language ?? null,
        },
      }, { onConflict: "media_id,source_url" });
    }

    const ownTime = new Date(draft.instagram_media.published_at).getTime();
    const comparableTimes = resolved
      .map((item) => item.timing.publishedAt ? new Date(item.timing.publishedAt).getTime() : NaN)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    const first = comparableTimes[0] ?? null;
    const earlierCount = comparableTimes.filter((time) => time < ownTime).length;
    const timingStatus = !comparableTimes.length
      ? "NO_COMPARABLE_TIME"
      : ownTime < comparableTimes[Math.floor(comparableTimes.length / 2)]
        ? earlierCount === 0 ? "EARLY" : "AMONG_FIRST"
        : "FOLLOWING";

    await admin.from("instagram_pipeline_events").insert({
      media_id: draft.media_id,
      event_type: "external_timing_compared",
      actor_type: "system",
      payload: {
        timing_status: timingStatus,
        comparable_sources: comparableTimes.length,
        earlier_sources: earlierCount,
        first_external_at: first ? new Date(first).toISOString() : null,
        own_published_at: draft.instagram_media.published_at,
      },
    });

    return json({
      ok: true,
      compared: true,
      media_id: draft.media_id,
      matches_saved: resolved.length,
      comparable_times: comparableTimes.length,
      timing_status: timingStatus,
      seconds_vs_first: first ? Math.round((first - ownTime) / 1000) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown comparison error";
    console.error("instagram-compare-timing failed", { message });
    return json({ error: message }, 500);
  }
});
