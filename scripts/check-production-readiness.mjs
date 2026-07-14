import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const templateMode = process.argv.includes("--template");
const envFile = process.argv.find((arg) => arg.startsWith("--env="))?.slice("--env=".length) ?? ".env.local";

const requiredPublic = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const requiredServer = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "PUBLIC_SITE_URL",
  "INSTAGRAM_USER_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_GRAPH_VERSION",
  "INSTAGRAM_SYNC_CRON_SECRET",
  "INSTAGRAM_WORKER_SECRET",
  "OPENAI_API_KEY",
  "OPENAI_EDITORIAL_MODEL",
];

const optional = [
  "INSTAGRAM_USERNAME",
  "INSTAGRAM_GRAPH_BASE_URL",
  "OPENAI_TRANSCRIPTION_MODEL",
  "MAX_TRANSCRIPTION_BYTES",
  "CMS_PUBLISH_ENDPOINT",
  "CMS_PUBLISH_SECRET",
];

const sensitive = new Set([
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_SYNC_CRON_SECRET",
  "INSTAGRAM_WORKER_SECRET",
  "OPENAI_API_KEY",
  "CMS_PUBLISH_SECRET",
]);

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const parsed = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function validUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}

const sourcePath = resolve(templateMode ? ".env.example" : envFile);
const fileEnv = parseEnvFile(sourcePath);
const env = templateMode ? fileEnv : { ...fileEnv, ...process.env };
const required = [...requiredPublic, ...requiredServer];
const problems = [];

if (!existsSync(sourcePath)) problems.push(`No existe ${sourcePath}`);

if (templateMode) {
  for (const key of [...required, ...optional]) {
    if (!(key in fileEnv)) problems.push(`Falta ${key} en .env.example`);
  }
  for (const key of sensitive) {
    if (fileEnv[key]) problems.push(`${key} debe permanecer vacío en .env.example`);
  }
} else {
  for (const key of required) {
    if (!String(env[key] ?? "").trim()) problems.push(`Falta ${key}`);
  }

  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SITE_URL", "PUBLIC_SITE_URL"]) {
    const value = String(env[key] ?? "").trim();
    if (value && !validUrl(value)) problems.push(`${key} debe ser una URL válida`);
  }

  const supabaseUrl = String(env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const serverSupabaseUrl = String(env.SUPABASE_URL ?? supabaseUrl).replace(/\/$/, "");
  if (supabaseUrl && serverSupabaseUrl && supabaseUrl !== serverSupabaseUrl) {
    problems.push("SUPABASE_URL y NEXT_PUBLIC_SUPABASE_URL no apuntan al mismo proyecto");
  }

  for (const key of ["INSTAGRAM_SYNC_CRON_SECRET", "INSTAGRAM_WORKER_SECRET"]) {
    const value = String(env[key] ?? "");
    if (value && value.length < 32) problems.push(`${key} debe tener al menos 32 caracteres`);
  }
  if (env.INSTAGRAM_SYNC_CRON_SECRET && env.INSTAGRAM_SYNC_CRON_SECRET === env.INSTAGRAM_WORKER_SECRET) {
    problems.push("Los secretos de cron y worker deben ser distintos");
  }

  if (String(env.PUBLIC_SITE_URL ?? "").includes(["elfacto", "mediagroup.com"].join(""))) {
    problems.push("PUBLIC_SITE_URL todavía usa el dominio legado; define el dominio final de El Facto Noticias");
  }
}

if (problems.length) {
  console.error(`\nPreparación de producción: ${problems.length} problema(s)\n`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(templateMode
  ? "Plantilla de entorno completa y sin secretos."
  : "Entorno listo para desplegar el pipeline Instagram → nota.");
