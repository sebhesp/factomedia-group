# Primera importación: últimos 7 días de Instagram

## Resultado esperado

Al ejecutar la sincronización, El Facto Noticias debe:

1. consultar la cuenta profesional `@elfactonoticias`;
2. recorrer la paginación de publicaciones;
3. detenerse al alcanzar publicaciones anteriores a siete días;
4. guardar posts, Reels, imágenes y carruseles sin duplicarlos;
5. crear un trabajo editorial para cada publicación nueva;
6. mostrar cada pieza en la mesa de Instagram;
7. transcribir videos y generar los bloques de la nota mediante el worker.

## Requisitos

- Proyecto de Supabase creado y migraciones aplicadas.
- Funciones `instagram-sync`, `instagram-process`, `instagram-pipeline-tick` y `system-health` desplegadas.
- Cuenta profesional `@elfactonoticias` autorizada en la aplicación de Meta.
- `INSTAGRAM_USER_ID` y `INSTAGRAM_ACCESS_TOKEN` guardados como secretos de Supabase.
- Usuario editor autenticado en la plataforma.

Nunca guardes el token de Instagram en GitHub, Vercel como variable pública o el navegador.

## Desplegar la función actualizada

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy instagram-sync
```

## Configurar secretos

```bash
supabase secrets set INSTAGRAM_USER_ID="TU_ID_DE_INSTAGRAM"
supabase secrets set INSTAGRAM_USERNAME="elfactonoticias"
supabase secrets set INSTAGRAM_ACCESS_TOKEN="TU_TOKEN"
supabase secrets set INSTAGRAM_GRAPH_BASE_URL="https://graph.instagram.com"
supabase secrets set INSTAGRAM_GRAPH_VERSION="VERSION_APROBADA"
supabase secrets set INSTAGRAM_SYNC_CRON_SECRET="SECRETO_ALEATORIO"
```

La versión de Graph debe corresponder a la configurada y aprobada dentro de la aplicación de Meta.

## Ejecutar el backfill desde la plataforma

1. Abre `/instagram`.
2. Inicia sesión con un usuario autorizado.
3. Presiona **Sincronizar**.
4. La aplicación enviará `backfill_days: 7` y un máximo de 20 páginas.
5. Espera a que la lista se actualice.

## Ejecutar el backfill manualmente

```bash
curl -X POST \
  "https://TU_PROJECT_REF.supabase.co/functions/v1/instagram-sync" \
  -H "Authorization: Bearer TOKEN_DE_SESION_DE_UN_EDITOR" \
  -H "Content-Type: application/json" \
  -d '{"backfill_days":7,"max_pages":20}'
```

También puede ejecutarse desde un proceso seguro usando `x-cron-secret` en lugar de la sesión del editor.

## Respuesta esperada

La función devuelve un resumen similar a:

```json
{
  "ok": true,
  "account": "elfactonoticias",
  "backfill_days": 7,
  "pages_fetched": 2,
  "fetched": 18,
  "created": 18,
  "refreshed": 0,
  "ignored_older": 7
}
```

- `created`: publicaciones nuevas guardadas y enviadas a procesamiento.
- `refreshed`: publicaciones que ya existían y fueron actualizadas.
- `ignored_older`: publicaciones descartadas por ser anteriores al corte.

## Procesar la cola

Después del backfill, ejecuta el orquestador varias veces hasta vaciar la cola:

```bash
curl -X POST \
  "https://TU_PROJECT_REF.supabase.co/functions/v1/instagram-pipeline-tick" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: TU_SECRETO_CRON" \
  -d '{}'
```

En producción, programa este ciclo cada dos minutos. La primera importación puede contener varias publicaciones, por lo que el procesamiento completo no será instantáneo.

## Verificación

La activación se considera correcta cuando:

- la mesa muestra todas las publicaciones de los últimos siete días;
- ninguna aparece duplicada;
- cada publicación conserva caption, URL y hora original;
- los videos avanzan de `Detectado` a `Transcribiendo` y después a `Listo para revisar`;
- cada bloque editorial puede copiarse por separado;
- una segunda sincronización devuelve principalmente elementos `refreshed`, no nuevos duplicados.
