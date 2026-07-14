import { readFile, writeFile } from "node:fs/promises";

async function patchInstagramEngine() {
  const path = "src/components/instagram-engine.tsx";
  let source = await readFile(path, "utf8");
  source = source.replace(
    'import { useEffect, useMemo, useState } from "react";',
    'import { useCallback, useEffect, useMemo, useState } from "react";',
  );
  source = source.replace(
    "  async function loadLiveData(showStatus = true) {",
    "  const loadLiveData = useCallback(async (showStatus = true) => {",
  );
  source = source.replace(
    '    return false;\n  }\n\n  useEffect(() => {\n    void loadLiveData();\n  }, []);',
    '    return false;\n  }, []);\n\n  useEffect(() => {\n    void loadLiveData();\n  }, [loadLiveData]);',
  );
  await writeFile(path, source);
}

async function patchDeployGuide() {
  const path = "docs/INSTAGRAM_DEPLOY_COMMANDS.md";
  let source = await readFile(path, "utf8");
  if (!source.includes("supabase functions deploy system-health")) {
    source = source.replace(
      "supabase functions deploy instagram-review",
      "supabase functions deploy instagram-review\nsupabase functions deploy system-health",
    );
  }
  await writeFile(path, source);
}

async function patchReadme() {
  const path = "README.md";
  let source = await readFile(path, "utf8");
  if (!source.includes("## Activar Instagram real")) {
    source += `\n\n## Activar Instagram real\n\nLa ruta completa de activación está en [docs/ACTIVATE_PRODUCTION.md](docs/ACTIVATE_PRODUCTION.md). Antes de desplegar credenciales ejecuta:\n\n\`\`\`bash\nnpm run check:readiness:template\nnpm run check:readiness\n\`\`\`\n\nDespués de desplegar Supabase, valida el diagnóstico con \`npm run smoke:health\` y ejecuta el primer ciclo controlado con \`CONFIRM_PRODUCTION_SMOKE=YES npm run smoke:instagram\`.\n`;
  }
  await writeFile(path, source);
}

await patchInstagramEngine();
await patchDeployGuide();
await patchReadme();
console.log("Release preparation patch applied.");
