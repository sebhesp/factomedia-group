# Comandos exactos de despliegue — Instagram Engine

## 1. Vincular Supabase

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

## 2. Desplegar funciones

La verificación JWT por función está definida en `supabase/config.toml`.

```bash
supabase functions deploy instagram-sync
supabase functions deploy instagram-process
supabase functions deploy instagram-compare-timing
supabase functions deploy instagram-pipeline-tick
supabase functions deploy instagram-review
supabase functions deploy system-health
```

## 3. Configurar secretos

```bash
supabase secrets set \
  INSTAGRAM_USER_ID="TU_INSTAGRAM_USER_ID" \
  INSTAGRAM_USERNAME="elfactonoticias" \
  INSTAGRAM_ACCESS_TOKEN="TU_TOKEN" \
  INSTAGRAM_GRAPH_BASE_URL="https://graph.instagram.com" \
  INSTAGRAM_GRAPH_VERSION="VERSION_DE_META" \
  INSTAGRAM_SYNC_CRON_SECRET="SECRETO_CRON" \
  INSTAGRAM_WORKER_SECRET="SECRETO_WORKER" \
  OPENAI_API_KEY="TU_OPENAI_API_KEY" \
  OPENAI_TRANSCRIPTION_MODEL="gpt-4o-mini-transcribe" \
  OPENAI_EDITORIAL_MODEL="TU_MODELO_RESPONSES"
```

## 4. Probar un ciclo completo

```bash
curl -X POST \
  "https://TU_PROJECT_REF.supabase.co/functions/v1/instagram-pipeline-tick" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: SECRETO_CRON" \
  -d '{}'
```

Resultado esperado:

```json
{
  "ok": true,
  "sync": {},
  "process": {},
  "comparison": {}
}
```

## 5. Programar el ciclo

Programar una petición POST cada 2 minutos a:

```text
https://TU_PROJECT_REF.supabase.co/functions/v1/instagram-pipeline-tick
```

Header requerido:

```text
x-cron-secret: SECRETO_CRON
```

Puede utilizarse Supabase Cron, un scheduler de Cloudflare, Vercel Cron en un proyecto con funciones o cualquier scheduler que proteja el secreto.

## 6. Variables del frontend

En el hosting web:

```text
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://TU_DOMINIO
```

Nunca exponer en el frontend:

- service role key;
- token de Instagram;
- OpenAI API key;
- secretos de cron o worker;
- secreto del CMS.
