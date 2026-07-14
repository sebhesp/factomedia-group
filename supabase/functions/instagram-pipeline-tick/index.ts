const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-cron-secret",
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

async function invoke(url: string, headers: Record<string, string>, body: Record<string, unknown> = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(150_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${url.split("/").pop()} failed: ${payload?.error ?? response.status}`);
  return payload;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const cronSecret = required("INSTAGRAM_SYNC_CRON_SECRET");
    if (request.headers.get("x-cron-secret") !== cronSecret) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = required("SUPABASE_URL").replace(/\/$/, "");
    const workerSecret = required("INSTAGRAM_WORKER_SECRET");
    const base = `${supabaseUrl}/functions/v1`;

    const sync = await invoke(
      `${base}/instagram-sync`,
      { "x-cron-secret": cronSecret },
      {
        mode: "auto",
        initial_backfill_days: 7,
        overlap_minutes: 10,
      },
    );
    const process = await invoke(`${base}/instagram-process`, { "x-worker-secret": workerSecret });

    let comparison: Record<string, unknown> | null = null;
    if (process?.processed && typeof process?.media_id === "string") {
      comparison = await invoke(
        `${base}/instagram-compare-timing`,
        { "x-worker-secret": workerSecret },
        { media_id: process.media_id },
      );
    }

    return json({
      ok: true,
      tick_at: new Date().toISOString(),
      sync,
      process,
      comparison,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pipeline error";
    console.error("instagram-pipeline-tick failed", { message });
    return json({ error: message }, 500);
  }
});
