import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type OperationAction = "run_cycle" | "repair_queue" | "process_next";

type OperationRequest = {
  action?: unknown;
  media_id?: unknown;
  stale_minutes?: unknown;
};

type JobRow = {
  id: string;
  media_id: string;
  stage: string;
  locked_at: string | null;
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

function requestedAction(value: unknown): OperationAction | null {
  if (value === "run_cycle" || value === "repair_queue" || value === "process_next") return value;
  return null;
}

async function invoke(url: string, headers: Record<string, string>, body: Record<string, unknown> = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(150_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${url.split("/").pop()} failed: ${payload?.error ?? response.status}`);
  return payload as Record<string, unknown>;
}

async function authenticatedUser(request: Request, supabaseUrl: string, anonKey: string) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length);
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function repairQueue(
  admin: ReturnType<typeof createClient>,
  staleMinutes: number,
  actorId: string,
) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - staleMinutes * 60_000).toISOString();

  const { data: lockedJobs, error: lockedError } = await admin
    .from("instagram_pipeline_jobs")
    .select("id,media_id,stage,locked_at")
    .not("locked_at", "is", null)
    .lt("locked_at", staleBefore)
    .limit(25);
  if (lockedError) throw lockedError;

  const staleJobs = ((lockedJobs ?? []) as JobRow[]).filter(
    (job) => !["needs_review", "published", "completed"].includes(job.stage),
  );

  for (const job of staleJobs) {
    const { error: jobError } = await admin
      .from("instagram_pipeline_jobs")
      .update({
        stage: "failed_retryable",
        locked_at: null,
        locked_by: null,
        next_attempt_at: now.toISOString(),
        last_error_code: "STALE_LOCK_RECOVERED",
        last_error_message: `Bloqueo automático recuperado después de ${staleMinutes} minutos`,
      })
      .eq("id", job.id);
    if (jobError) throw jobError;

    await admin
      .from("instagram_media")
      .update({ processing_status: "failed" })
      .eq("id", job.media_id);

    await admin.from("instagram_pipeline_events").insert({
      media_id: job.media_id,
      event_type: "pipeline_job_recovered",
      actor_type: "user",
      actor_id: actorId,
      payload: {
        previous_stage: job.stage,
        stale_minutes: staleMinutes,
      },
    });
  }

  const { data: failedJobs, error: failedError } = await admin
    .from("instagram_pipeline_jobs")
    .select("id,media_id")
    .eq("stage", "failed_retryable")
    .is("locked_at", null)
    .limit(25);
  if (failedError) throw failedError;

  const retryIds = (failedJobs ?? []).map((job) => job.id as string);
  if (retryIds.length) {
    const { error: retryError } = await admin
      .from("instagram_pipeline_jobs")
      .update({ next_attempt_at: now.toISOString() })
      .in("id", retryIds);
    if (retryError) throw retryError;
  }

  return {
    recovered_stale: staleJobs.length,
    retried_failed: retryIds.length,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
    const anonKey = required("SUPABASE_ANON_KEY");
    const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
    const cronSecret = required("INSTAGRAM_SYNC_CRON_SECRET");
    const workerSecret = required("INSTAGRAM_WORKER_SECRET");
    const user = await authenticatedUser(request, supabaseUrl, anonKey);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = (await request.json().catch(() => ({}))) as OperationRequest;
    const action = requestedAction(body.action);
    if (!action) return json({ error: "Unsupported action" }, 400);

    const mediaId = typeof body.media_id === "string" && body.media_id.trim() ? body.media_id.trim() : null;
    const staleMinutes = boundedInteger(body.stale_minutes, 15, 5, 120);
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const base = `${supabaseUrl}/functions/v1`;

    const repair = await repairQueue(admin, staleMinutes, user.id);
    if (action === "repair_queue") {
      return json({
        ok: true,
        action,
        operated_at: new Date().toISOString(),
        repair,
      });
    }

    let sync: Record<string, unknown> | null = null;
    if (action === "run_cycle") {
      sync = await invoke(
        `${base}/instagram-sync`,
        { "x-cron-secret": cronSecret },
        {
          mode: "auto",
          initial_backfill_days: 7,
          overlap_minutes: 10,
        },
      );
    }

    const process = await invoke(
      `${base}/instagram-process`,
      { "x-worker-secret": workerSecret },
      mediaId ? { media_id: mediaId } : {},
    );

    let comparison: Record<string, unknown> | null = null;
    if (process.processed === true && typeof process.media_id === "string") {
      comparison = await invoke(
        `${base}/instagram-compare-timing`,
        { "x-worker-secret": workerSecret },
        { media_id: process.media_id },
      );
    }

    return json({
      ok: true,
      action,
      operated_at: new Date().toISOString(),
      repair,
      sync,
      process,
      comparison,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown operation error";
    console.error("instagram-ops failed", { message });
    return json({ error: message }, 500);
  }
});
