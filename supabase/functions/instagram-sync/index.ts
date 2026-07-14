import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

type InstagramMedia = {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username?: string;
};

type InstagramResponse = {
  data?: InstagramMedia[];
  paging?: { next?: string };
  error?: { message?: string; type?: string; code?: number };
};

type SyncMode = "auto" | "backfill" | "incremental";

type SyncRequest = {
  mode?: unknown;
  initial_backfill_days?: unknown;
  backfill_days?: unknown;
  max_pages?: unknown;
  overlap_minutes?: unknown;
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

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.trunc(parsed)));
}

function requestedMode(value: unknown): SyncMode {
  return value === "backfill" || value === "incremental" ? value : "auto";
}

function timestampMs(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

async function authorize(request: Request, supabaseUrl: string, anonKey: string) {
  const configuredCronSecret = Deno.env.get("INSTAGRAM_SYNC_CRON_SECRET");
  const cronSecret = request.headers.get("x-cron-secret");
  if (configuredCronSecret && cronSecret === configuredCronSecret) return { mode: "cron" as const };

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return { mode: "user" as const, userId: data.user.id };
}

async function fetchInstagramPage(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json()) as InstagramResponse;
  if (!response.ok || payload.error) {
    const message = payload.error?.message ?? `Instagram API returned ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = required("SUPABASE_URL");
    const anonKey = required("SUPABASE_ANON_KEY");
    const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
    const accessToken = required("INSTAGRAM_ACCESS_TOKEN");
    const instagramUserId = required("INSTAGRAM_USER_ID");
    const instagramUsername = Deno.env.get("INSTAGRAM_USERNAME") ?? "elfactonoticias";
    const graphBaseUrl = (Deno.env.get("INSTAGRAM_GRAPH_BASE_URL") ?? "https://graph.instagram.com").replace(/\/$/, "");
    const graphVersion = Deno.env.get("INSTAGRAM_GRAPH_VERSION")?.replace(/^\//, "").replace(/\/$/, "");

    const caller = await authorize(request, supabaseUrl, anonKey);
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const requestBody = (await request.json().catch(() => ({}))) as SyncRequest;
    const modeRequest = requestedMode(requestBody.mode);
    const initialBackfillDays = boundedInteger(
      requestBody.initial_backfill_days ?? requestBody.backfill_days,
      7,
      1,
      30,
    );
    const overlapMinutes = boundedInteger(requestBody.overlap_minutes, 10, 1, 120);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: account, error: accountError } = await admin
      .from("instagram_accounts")
      .upsert(
        {
          instagram_user_id: instagramUserId,
          username: instagramUsername,
          status: "connected",
          connected_at: new Date().toISOString(),
        },
        { onConflict: "instagram_user_id" },
      )
      .select("id,last_synced_at")
      .single();

    if (accountError || !account) throw accountError ?? new Error("Could not create Instagram account");

    const { data: latestKnown, error: latestKnownError } = await admin
      .from("instagram_media")
      .select("published_at")
      .eq("account_id", account.id)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestKnownError) throw latestKnownError;

    const lastSyncedMs = timestampMs(account.last_synced_at);
    const latestKnownMs = timestampMs(latestKnown?.published_at);
    const hasPriorState = lastSyncedMs !== null || latestKnownMs !== null;
    const effectiveMode = modeRequest === "auto"
      ? (hasPriorState ? "incremental" : "initial_backfill")
      : modeRequest;

    const referenceMs = Math.max(lastSyncedMs ?? 0, latestKnownMs ?? 0);
    const cutoffMs = effectiveMode === "incremental" && referenceMs > 0
      ? referenceMs - overlapMinutes * MINUTE_MS
      : Date.now() - initialBackfillDays * DAY_MS;
    const cutoffIso = new Date(cutoffMs).toISOString();
    const maxPages = boundedInteger(
      requestBody.max_pages,
      effectiveMode === "incremental" ? 5 : 20,
      1,
      50,
    );

    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "permalink",
      "thumbnail_url",
      "timestamp",
      "username",
    ].join(",");
    const versionPath = graphVersion ? `/${graphVersion}` : "";
    const endpoint = new URL(`${graphBaseUrl}${versionPath}/${instagramUserId}/media`);
    endpoint.searchParams.set("fields", fields);
    endpoint.searchParams.set("limit", "50");
    endpoint.searchParams.set("access_token", accessToken);

    const mediaById = new Map<string, InstagramMedia>();
    let nextUrl: string | null = endpoint.toString();
    let pagesFetched = 0;
    let ignoredOlder = 0;
    let stoppedAtCutoff = false;

    while (nextUrl && pagesFetched < maxPages) {
      const payload = await fetchInstagramPage(nextUrl);
      const pageItems = payload.data ?? [];
      pagesFetched += 1;

      let oldestTimestamp = Number.POSITIVE_INFINITY;
      for (const media of pageItems) {
        const publishedMs = new Date(media.timestamp).getTime();
        if (Number.isFinite(publishedMs)) oldestTimestamp = Math.min(oldestTimestamp, publishedMs);
        if (!Number.isFinite(publishedMs) || publishedMs < cutoffMs) {
          ignoredOlder += 1;
          continue;
        }
        mediaById.set(media.id, media);
      }

      nextUrl = payload.paging?.next ?? null;
      if (!pageItems.length || oldestTimestamp < cutoffMs) {
        stoppedAtCutoff = true;
        break;
      }
    }

    const mediaItems = [...mediaById.values()].sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );
    let created = 0;
    let refreshed = 0;

    for (const media of mediaItems) {
      const { data: existing } = await admin
        .from("instagram_media")
        .select("id")
        .eq("instagram_media_id", media.id)
        .maybeSingle();

      const { data: savedMedia, error: mediaError } = await admin
        .from("instagram_media")
        .upsert(
          {
            account_id: account.id,
            instagram_media_id: media.id,
            media_type: media.media_type,
            caption: media.caption ?? null,
            permalink: media.permalink,
            media_url: media.media_url ?? null,
            thumbnail_url: media.thumbnail_url ?? null,
            published_at: media.timestamp,
            editorial_origin: "reviewed",
            processing_status: existing ? undefined : "detected",
            metadata: {
              username: media.username ?? instagramUsername,
              sync_mode: effectiveMode,
              initial_backfill_days: effectiveMode === "incremental" ? undefined : initialBackfillDays,
            },
          },
          { onConflict: "instagram_media_id" },
        )
        .select("id,processing_status")
        .single();

      if (mediaError || !savedMedia) throw mediaError ?? new Error(`Could not save media ${media.id}`);

      if (!existing) {
        created += 1;
        await admin.from("instagram_pipeline_jobs").insert({
          media_id: savedMedia.id,
          stage: "detected",
          progress: 5,
        });
        await admin.from("instagram_pipeline_events").insert({
          media_id: savedMedia.id,
          event_type: "instagram_media_detected",
          actor_type: "integration",
          payload: {
            instagram_media_id: media.id,
            caller: caller.mode,
            sync_mode: effectiveMode,
            initial_backfill_days: effectiveMode === "incremental" ? null : initialBackfillDays,
          },
        });
      } else {
        refreshed += 1;
      }
    }

    const syncedAt = new Date().toISOString();
    await admin
      .from("instagram_accounts")
      .update({
        status: "connected",
        last_synced_at: syncedAt,
        sync_cursor: nextUrl,
      })
      .eq("id", account.id);

    return json({
      ok: true,
      account: instagramUsername,
      sync_mode: effectiveMode,
      initial_backfill_days: effectiveMode === "incremental" ? null : initialBackfillDays,
      incremental_overlap_minutes: effectiveMode === "incremental" ? overlapMinutes : null,
      cutoff: cutoffIso,
      pages_fetched: pagesFetched,
      stopped_at_cutoff: stoppedAtCutoff,
      fetched: mediaItems.length,
      ignored_older: ignoredOlder,
      created,
      refreshed,
      synced_at: syncedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    console.error("instagram-sync failed", { message });
    return json({ error: message }, 500);
  }
});
