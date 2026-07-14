import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const roots = ["src", "docs"];
const individualFiles = ["README.md", "package.json"];
const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json", ".sql", ".toml", ".yml", ".yaml"]);
const forbidden = [
  /Factomedia Group/gi,
  /El Facto Media Group/gi,
  /Factomedia Studio/gi,
  /FactoDesk/gi,
  /FACTOMEDIA/gi,
  /Factomedia/gi,
];

async function collect(path) {
  const info = await stat(path);
  if (info.isFile()) return textExtensions.has(extname(path)) || path.endsWith("README.md") ? [path] : [];
  const entries = await readdir(path);
  const nested = await Promise.all(entries.map((entry) => collect(join(path, entry))));
  return nested.flat();
}

const files = [
  ...(await Promise.all(roots.map((root) => collect(root)))).flat(),
  ...individualFiles,
].filter((path) => !path.endsWith("scripts/check-branding.mjs"));

const findings = [];
for (const file of files) {
  const text = await readFile(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of forbidden) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        findings.push(`${relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
        break;
      }
    }
  });
}

if (findings.length) {
  console.error("Se encontraron referencias al branding anterior:\n");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log("Branding validado: solo se utiliza El Facto Noticias.");
