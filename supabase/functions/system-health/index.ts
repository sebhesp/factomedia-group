import { createClient } from "npm:@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-worker-secret",
  "Content-Type": "application/json",
};

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const workerSecret = Deno.env.get("INSTAGRAM_WORKER_SECRET");
  if (!workerSecret || request.headers.get("x-worker-secret") !== workerSecret) {
    return respond({ error: "Unauthorized" }, 401);
  }

  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "INSTAGRAM_USER_ID",
    "INSTAGRAM_ACCESS_TOKEN",
    "INSTAGRAM_GRAPH_VERSION",
    "INSTAGRAM_SYNC_CRON_SECRET",
    "INSTAGRAM_WORKER_SECRET",
    "OPENAI_API_KEY",
    "OPENAI_EDITORIAL_MODEL",
    "PUBLIC_SITE_URL",
  ];
  const missing = required.filter((name) => !Deno.env.get(name));
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    return respond({
      ready: false,
      environment: { ready: false, missing },
      database: { ready: false, error: "Supabase server configuration is incomplete" },
      instagram: null,
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const tableNames = [
    "instagram_accounts",
    "instagram_media",
    "instagram_pipeline_jobs",
    "instagram_transcripts",
    "instagram_story_drafts",
    "instagram_external_matches",
    "instagram_pipeline_events",
  ];

  const tables = await Promise.all(tableNames.map(async (table) => {
    const result = await admin.from(table).select("*", { count: "exact", head: true });
    return { table, ok: !result.error, count: result.count ?? null, error: result.error?.message ?? null };
  }));

  const { data: account } = await admin
    .from("instagram_accounts")
    .select("username,status,last_synced_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: pendingJobs } = await admin
    .from("instagram_pipeline_jobs")
    .select("*", { count: "exact", head: true })
    .in("stage", ["detected", "imported", "failed_retryable"]);

  const databaseReady = tables.every((item) => item.ok);
  return respond({
    ready: missing.length === 0 && databaseReady,
    checked_at: new Date().toISOString(),
    environment: { ready: missing.length === 0, missing },
    database: { ready: databaseReady, tables },
    instagram: {
      configured: Boolean(Deno.env.get("INSTAGRAM_USER_ID") && Deno.env.get("INSTAGRAM_ACCESS_TOKEN")),
      account: account ?? null,
      pending_jobs: pendingJobs ?? 0,
    },
  });
});
