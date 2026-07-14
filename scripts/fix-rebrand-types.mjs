import { readFile, writeFile } from "node:fs/promises";

const iconFiles = [
  "src/components/app-shell.tsx",
  "src/components/instagram-engine.tsx",
  "src/components/instagram-story-room.tsx",
  "src/components/studio-home.tsx",
];

for (const file of iconFiles) {
  const original = await readFile(file, "utf8");
  const next = original.replace("  Instagram,\n", "  Camera as Instagram,\n");
  if (next === original) throw new Error(`Instagram import not found in ${file}`);
  await writeFile(file, next);
}

const eventFile = "src/lib/product-intelligence.ts";
const originalEvents = await readFile(eventFile, "utf8");
const marker = '  | "radar_opened"';
const additions = [
  '  | "instagram_sync_started"',
  '  | "instagram_sync_completed"',
  '  | "instagram_sync_failed"',
].join("\n");
if (!originalEvents.includes(marker)) throw new Error("Product event insertion point not found");
const nextEvents = originalEvents.replace(marker, `${additions}\n${marker}`);
await writeFile(eventFile, nextEvents);

console.log("Rebrand type fixes applied.");
