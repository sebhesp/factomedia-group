# El Facto Noticias — Instagram — guía para pasar de demo a operación real

Este documento cubre la primera entrega real:

`@elfactonoticias → detección → transcripción → Nota Maestra → comparación temporal → revisión → CMS`

## Lo que ya existe en el repositorio

- esquema SQL del pipeline;
- sincronizador seguro de Instagram;
- procesador de transcripción y redacción;
- comparación temporal con otras publicaciones;
- bandeja que usa Supabase cuando está configurado y conserva demo como respaldo;
- sala de revisión específica para notas originadas en Instagram;
- acciones autenticadas para guardar, solicitar revisión, aprobar, solicitar cambios y publicar;
- publicación bloqueada hasta conectar un CMS real.

## Paso 1 — Crear el proyecto de Supabase

1. Crear un proyecto de Supabase para El Facto Noticias.
2. Guardar:
   - Project URL;
   - anon key;
   - service role key.
3. No enviar la service role key por WhatsApp ni ponerla en GitHub.
4. Instalar Supabase CLI en la computadora de desarrollo.
5. Vincular el repositorio:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
```

6. Aplicar migraciones:

```bash
supabase db push
```

La migración principal es:

```text
supabase/migrations/202607130001_instagram_editorial_pipeline.sql
```

## Paso 2 — Desplegar funciones

```bash
supabase functions deploy instagram-sync
supabase functions deploy instagram-process
supabase functions deploy instagram-compare-timing
supabase functions deploy instagram-review
```

## Paso 3 — Configurar secretos de Supabase

Generar dos secretos aleatorios diferentes:

```bash
openssl rand -hex 32
```

Configurar:

```bash
supabase secrets set \
  INSTAGRAM_USER_ID="..." \
  INSTAGRAM_USERNAME="elfactonoticias" \
  INSTAGRAM_ACCESS_TOKEN="..." \
  INSTAGRAM_GRAPH_BASE_URL="https://graph.instagram.com" \
  INSTAGRAM_GRAPH_VERSION="VERSION_APROBADA_EN_META" \
  INSTAGRAM_SYNC_CRON_SECRET="SECRETO_1" \
  INSTAGRAM_WORKER_SECRET="SECRETO_2" \
  OPENAI_API_KEY="..." \
  OPENAI_TRANSCRIPTION_MODEL="gpt-4o-mini-transcribe" \
  OPENAI_EDITORIAL_MODEL="MODELO_RESPONSES_DISPONIBLE"
```

No configurar `CMS_PUBLISH_ENDPOINT` todavía si el CMS no está confirmado. Sin esas variables el sistema permite aprobar, pero se niega a simular una publicación real.

## Paso 4 — Crear la aplicación de Meta

Debe hacerlo una persona con control legítimo del negocio y de `@elfactonoticias`.

1. Crear o usar el portafolio empresarial correcto.
2. Confirmar que Instagram sea una cuenta profesional.
3. Crear una app de Meta para el medio.
4. Agregar el producto de Instagram correspondiente.
5. Configurar OAuth y una URL de redirección del dominio final.
6. Solicitar únicamente los permisos necesarios para leer medios propios y sus métricas.
7. Obtener un token de larga duración conforme al flujo aprobado por Meta.
8. Registrar el Instagram User ID y el token como secretos en Supabase.
9. Nunca compartir la contraseña personal de Instagram con desarrollo.

La versión del Graph API se mantiene como variable de entorno para evitar fijar en código una versión que Meta pueda retirar.

## Paso 5 — Configurar la aplicación web

En Vercel o el hosting elegido, configurar únicamente variables públicas:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

No agregar tokens de Instagram, service role ni OpenAI al frontend.

## Paso 6 — Crear usuarios y roles

En Supabase Auth crear al menos:

- una colaboradora;
- una editora;
- una administradora.

En `app_metadata.role` usar:

```text
collaborator
editor
admin
```

Reglas:

- colaborador: editar y solicitar revisión;
- editor: aprobar, solicitar cambios y publicar;
- admin: las capacidades de editor más configuración.

La función `instagram-review` valida el rol en el servidor; cambiar el selector visual de la demo no concede permisos reales.

## Paso 7 — Primera sincronización controlada

Invocar manualmente `instagram-sync` desde una sesión autenticada o desde un cliente autorizado.

Resultado esperado:

- cuenta creada en `instagram_accounts`;
- Reels propios en `instagram_media`;
- un trabajo por Reel nuevo en `instagram_pipeline_jobs`;
- evento `instagram_media_detected`.

No procesar todavía toda la cuenta histórica. Para la beta usar un límite controlado de Reels recientes.

## Paso 8 — Procesar un Reel

Invocar `instagram-process` con el header interno:

```text
x-worker-secret: INSTAGRAM_WORKER_SECRET
```

Body opcional:

```json
{
  "media_id": "UUID_INTERNO"
}
```

El worker:

1. descarga temporalmente el video propio;
2. transcribe;
3. guarda la transcripción;
4. genera una nota con salida estructurada;
5. registra Instagram como origen editorial revisado;
6. deja la nota en `needs_review`;
7. nunca publica.

Para archivos por encima del límite o procesamiento intensivo, mover este worker a un servicio Node/FFmpeg de larga duración. La Edge Function es válida para la beta con Reels cortos y tamaño controlado.

## Paso 9 — Comparar publicaciones externas

Invocar `instagram-compare-timing` después de crear el borrador.

El comparador:

- busca artículos relacionados;
- intenta recuperar la hora declarada por cada página;
- usa la hora de detección del proveedor como respaldo;
- guarda la procedencia del timestamp;
- calcula `EARLY`, `AMONG_FIRST`, `FOLLOWING` o `NO_COMPARABLE_TIME`.

Importante: una hora recuperada por rastreo o metadatos no siempre equivale a la primera publicación absoluta de internet. La interfaz debe presentarla como comparación de fuentes detectadas, no como una afirmación universal.

## Paso 10 — Revisar en El Facto Noticias · Redacción

Ruta:

```text
/instagram
```

Al abrir un Reel, la sala específica permite:

- revisar la nota;
- editar título, bajada y cuerpo;
- consultar el Reel como origen;
- revisar fuentes externas;
- marcar afirmaciones que requieren revisión adicional;
- solicitar revisión;
- aprobar;
- solicitar cambios.

Las acciones reales requieren sesión de Supabase.

## Paso 11 — Conectar el CMS

El Facto Noticias no debe adivinar el CMS.

Crear un adaptador HTTP que reciba el borrador aprobado y responda:

```json
{
  "id": "ID_DEL_CMS",
  "url": "https://sitio.com/noticia"
}
```

Después configurar en Supabase:

```bash
supabase secrets set \
  CMS_PUBLISH_ENDPOINT="https://..." \
  CMS_PUBLISH_SECRET="..."
```

El endpoint debe:

- validar firma o bearer secret;
- aceptar únicamente borradores aprobados;
- crear borrador o publicación según la política acordada;
- asignar autor;
- guardar imagen, SEO y origen;
- ser idempotente para evitar notas duplicadas.

## Paso 12 — Automatizar la cola

Para beta:

- sincronización cada 2 minutos;
- procesamiento de un trabajo por ejecución;
- comparación temporal después del borrador;
- reintentos con espera progresiva;
- alerta después de tres fallos.

Puede ejecutarse con Supabase Cron, un worker permanente o un scheduler externo. No usar GitHub Pages para tareas de fondo.

## Checklist de salida beta

- [ ] Meta app creada y aprobada para la cuenta.
- [ ] Cuenta profesional conectada por OAuth.
- [ ] Migraciones aplicadas.
- [ ] Funciones desplegadas.
- [ ] Secretos configurados.
- [ ] Usuarios y roles creados.
- [ ] 10 Reels recientes sincronizados sin duplicados.
- [ ] 10 transcripciones revisadas manualmente.
- [ ] 10 notas comparadas contra el Reel.
- [ ] Cero nombres o cifras inventados.
- [ ] CMS en staging conectado.
- [ ] Publicación idempotente probada.
- [ ] Registro de errores y costos activo.
- [ ] Aprobación editorial requerida en todos los casos.

## Criterio de go-live

No se activa la automatización diaria hasta alcanzar:

- 95% de Reels detectados;
- 95% de transcripciones utilizables;
- 80% de notas aprovechables sin reescritura total;
- menos de 8 minutos de edición humana promedio;
- cero publicaciones accidentales;
- cero atribuciones inventadas;
- CMS de staging probado durante al menos una semana.
