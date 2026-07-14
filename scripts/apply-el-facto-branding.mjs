import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const roots = ["src", "docs", ".github", "supabase"];
const individualFiles = ["README.md", "package.json", "next.config.ts"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json", ".sql", ".toml", ".txt", ".yml", ".yaml", ".css"]);

async function collect(path) {
  const info = await stat(path);
  if (info.isFile()) return extensions.has(extname(path)) || path.endsWith("README.md") ? [path] : [];
  const entries = await readdir(path);
  return (await Promise.all(entries.map((entry) => collect(join(path, entry))))).flat();
}

const replacements = [
  ["https://www.elfactomediagroup.com/", "el sitio anterior de Squarespace"],
  ["https://www.elfactomediagroup.com", "el sitio anterior de Squarespace"],
  ["nombre@factomedia.mx", "nombre@elfactonoticias.com"],
  ["x.com/FactomediaMX", "x.com/elfactonoticias"],
  ["@FactomediaMX", "@elfactonoticias"],
  ["@factomedia.mx", "@elfactonoticias"],
  ["El Facto Media Group", "El Facto Noticias"],
  ["Factomedia Group", "El Facto Noticias"],
  ["FACTOMEDIA STUDIO", "EL FACTO NOTICIAS"],
  ["Factomedia Studio", "El Facto Noticias · Redacción"],
  ["FACTOMEDIA RADAR", "RADAR DE NOTICIAS"],
  ["Factomedia Radar", "Radar de noticias"],
  ["Factomedia Ahora", "Ahora"],
  ["Factomedia Instagram", "El Facto Noticias — Instagram"],
  ["FactoDesk", "Redacción"],
  ["FactomediaResearchBot", "ElFactoNoticiasResearchBot"],
  ["factomedia_instagram_note", "el_facto_noticias_instagram_note"],
  ["factomedia-social-posts", "el-facto-noticias-social-posts"],
  ["factomedia:", "el-facto-noticias:"],
  ["\"factomedia\"", "\"el_facto\""],
  ["'factomedia'", "'el_facto'"],
  [".factomedia", ".el_facto"],
  ["FACTOMEDIA", "EL FACTO NOTICIAS"],
  ["Factomedia", "El Facto Noticias"],
];

const files = [
  ...(await Promise.all(roots.map((root) => collect(root)))).flat(),
  ...individualFiles,
].filter((file) => !file.endsWith("scripts/apply-el-facto-branding.mjs"));

const changed = [];
for (const file of files) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    continue;
  }
  const original = text;
  for (const [from, to] of replacements) text = text.replaceAll(from, to);
  if (text !== original) {
    await writeFile(file, text);
    changed.push(file);
  }
}

async function replaceInFile(path, transform) {
  const original = await readFile(path, "utf8");
  const next = transform(original);
  if (next !== original) {
    await writeFile(path, next);
    changed.push(path);
  }
}

await replaceInFile("supabase/functions/instagram-review/index.ts", (text) => text
  .replace(
    'const siteUrl = (Deno.env.get("PUBLIC_SITE_URL") ?? "el sitio anterior de Squarespace").replace(/\\/$/, "");',
    'const siteUrl = required("PUBLIC_SITE_URL").replace(/\\/$/, "");',
  )
  .replace("The native El Facto Noticias site", "The native El Facto Noticias site"));

await replaceInFile("docs/SQUARESPACE_EXIT_AND_SITE_MIGRATION.md", (text) => text
  .replace("El sitio anterior `el sitio anterior de Squarespace` estaba construido en Squarespace y actualmente se encuentra vencido.", "El sitio anterior estaba construido en Squarespace y actualmente se encuentra vencido.")
  .replace("- **elfactomediagroup.com**: dominio principal conectado a Vercel.", "- **Dominio definitivo de El Facto Noticias**: conectado a Vercel después de validar staging.")
  .replace("- conectar `elfactomediagroup.com` y `www` a Vercel;", "- conectar el dominio definitivo y su versión `www` a Vercel;"));

await replaceInFile("docs/READY_STATUS.md", (text) => text
  .replace("the official GitHub Pages workspace is published at `/factomedia-group/mi-dia/`.", "the official GitHub Pages workspace is published from the repository Pages environment."));

await replaceInFile("scripts/check-branding.mjs", (text) => {
  let next = text;
  if (!next.includes("elfactomediagroup\\.com")) {
    next = next.replace("  /Factomedia/gi,\n];", "  /Factomedia/gi,\n  /elfactomediagroup\\.com/gi,\n];");
  }
  if (!next.includes("Technical GitHub Pages base path")) {
    next = next.replace(
      "  lines.forEach((line, index) => {\n    for (const pattern of forbidden) {",
      "  lines.forEach((line, index) => {\n    if (line.includes(\"/factomedia-group\")) return; // Technical GitHub Pages base path until the repository is renamed.\n    for (const pattern of forbidden) {",
    );
  }
  return next;
});

console.log(`Updated ${new Set(changed).size} files:`);
for (const file of [...new Set(changed)].sort()) console.log(`- ${relative(process.cwd(), file)}`);
