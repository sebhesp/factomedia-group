const healthOnly = process.argv.includes("--health-only");
const supabaseUrl = String(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const workerSecret = process.env.INSTAGRAM_WORKER_SECRET;
const cronSecret = process.env.INSTAGRAM_SYNC_CRON_SECRET;

if (!supabaseUrl) throw new Error("Falta SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL");
if (!workerSecret) throw new Error("Falta INSTAGRAM_WORKER_SECRET");
if (!healthOnly && !cronSecret) throw new Error("Falta INSTAGRAM_SYNC_CRON_SECRET");
if (!healthOnly && process.env.CONFIRM_PRODUCTION_SMOKE !== "YES") {
  throw new Error("Define CONFIRM_PRODUCTION_SMOKE=YES para ejecutar un ciclo real");
}

async function call(name, headerName, secret, body = {}) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", [headerName]: secret },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${name}: ${payload.error ?? response.status}`);
  return payload;
}

const health = await call("system-health", "x-worker-secret", workerSecret);
console.log(JSON.stringify({
  health: {
    ready: health.ready,
    environment: health.environment,
    database: health.database,
    instagram: health.instagram,
  },
}, null, 2));

if (!health.ready) throw new Error("El diagnóstico no está listo; corrige los puntos reportados antes del smoke test");
if (healthOnly) process.exit(0);

const tick = await call("instagram-pipeline-tick", "x-cron-secret", cronSecret);
console.log(JSON.stringify({
  pipeline: {
    ok: tick.ok,
    tick_at: tick.tick_at,
    sync: tick.sync,
    process: tick.process,
    comparison: tick.comparison,
  },
}, null, 2));

if (!tick.ok) process.exit(1);
