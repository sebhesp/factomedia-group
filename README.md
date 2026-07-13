# Factomedia Group — MVP editorial

Factomedia Group es una plataforma interna para colaboradores y editores de un medio digital. El repositorio contiene tres superficies activas:

1. **FactoDesk**: operación editorial interna.
2. **Distribución y rendimiento**: seguimiento de publicaciones sociales creadas dentro y fuera de Factomedia.
3. **Landing pública**: proyección de Noticias Maestras publicadas.

La integración por WhatsApp quedó deliberadamente fuera de esta iteración y se realizará al final del proyecto, después de validar producto, seguridad y operación editorial.

## Estado actual

El proyecto puede ejecutarse sin credenciales en **modo DEMO**. Los borradores creados se guardan en `localStorage`, se pueden revisar, aprobar y publicar al cambiar el rol DEMO a Editora o Administradora. Las noticias publicadas localmente aparecen en la portada del mismo navegador.

El módulo de distribución también funciona en modo DEMO. Incluye publicaciones de X, Instagram y Threads, distingue las creadas en Factomedia de las publicadas directamente en cada plataforma, conserva snapshots de métricas, agrupa rendimiento por Noticia Maestra y permite simular nuevas sincronizaciones.

También existe la fundación para Supabase:

- clientes browser/server;
- esquema PostgreSQL editorial;
- esquema de distribución social;
- RLS inicial;
- migraciones y datos de referencia;
- variables de entorno documentadas.

La autenticación, persistencia y conexiones sociales reales se activan al conectar Supabase y credenciales de cada plataforma. El modo DEMO no simula que esos datos existen en servidor.

## Stack

- Next.js App Router
- React + TypeScript estricto
- Tailwind CSS
- Supabase Auth, PostgreSQL y Storage
- Zod y React Hook Form preparados en dependencias
- Vitest
- Playwright

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

### Recorrido DEMO editorial

1. Abre `/login`.
2. Pulsa **Entrar en modo DEMO**.
3. Crea una noticia desde **Crear noticia**.
4. Agrega fuentes y afirmaciones.
5. Solicita revisión.
6. Cambia el rol en la parte inferior de la barra lateral a **Editora**.
7. Aprueba y publica.
8. Abre la vista pública o vuelve a `/`.

### Recorrido DEMO de distribución

1. Entra a `/distribucion` desde la barra lateral.
2. Revisa publicaciones que están creciendo y alertas accionables.
3. Abre **Publicaciones** para filtrar por plataforma y origen.
4. Abre cualquier post para consultar snapshots, rendimiento, responsable y trazabilidad.
5. Relaciona publicaciones externas con una Noticia Maestra.
6. Pulsa **Sincronizar ahora** para generar un nuevo snapshot DEMO.

## Conectar Supabase

1. Crea un proyecto Supabase.
2. Copia `.env.example` a `.env.local`.
3. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Ejecuta `supabase/migrations/001_initial_schema.sql`.
5. Ejecuta `supabase/migrations/002_social_distribution.sql`.
6. Ejecuta `supabase/seed.sql`.
7. Crea usuarios en Supabase Auth y perfiles correspondientes en `public.users`.

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` ni tokens sociales en el navegador.

## Modelo editorial central

La entidad principal es `stories` (Noticia Maestra). Se relaciona con:

- `story_versions`: versiones relevantes;
- `sources`: fuentes;
- `claims` y `claim_sources`: afirmaciones y sus respaldos;
- `assets`: imágenes, audio, video y documentos;
- `assignments`: responsables y colaboraciones;
- `editorial_events`: trazabilidad;
- `approvals`: decisiones editoriales;
- `corrections`: correcciones públicas separadas;
- `public_pages`: proyección sin datos internos;
- `analytics_events`: métricas básicas;
- `goals` y `goal_progress`: metas simples.

## Modelo de distribución

- `social_accounts`: cuentas conectadas y estado de sincronización.
- `social_posts`: pieza publicada, origen, versión y relación editorial.
- `social_metric_snapshots`: evolución histórica sin sobrescribir datos anteriores.
- `social_actions`: generación, edición, aprobación, importación y cambios.
- `social_alerts`: señales accionables.
- `social_sync_cursors`: cursores incrementales, reintentos y próxima ejecución.
- `social_post_latest_metrics`: vista con la última captura por publicación.
- `story_social_performance`: rendimiento acumulado por Noticia Maestra.

La especificación completa está en `docs/SOCIAL_DISTRIBUTION_SYSTEM.md`.

## Comandos de calidad

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

## Alcance por fases

- **Fase 1 — Fundación y vertical funcional:** implementada en modo DEMO.
- **Fase 2 — Supabase real:** autenticación, repositorios de datos, Storage y protección de rutas.
- **Fase 3 — Flujo editorial completo:** versiones, asignaciones, comentarios, correcciones y aprobación persistentes.
- **Fase 4 — Distribución real:** OAuth, sincronización incremental, publicación, snapshots y reconciliación con X, Instagram y Threads.
- **Fase 5 — Landing y analítica real:** SEO, imágenes, eventos y reportes.
- **Fase 6 — Pruebas, accesibilidad y endurecimiento de seguridad.**
- **Fase final — WhatsApp:** captura rápida, consultas y acciones simples; nunca edición compleja.

## Decisiones de producto

- La interfaz prioriza la siguiente acción y evita formularios largos.
- Las métricas se presentan como contexto operativo, no como ranking individual.
- Todo post publicado fuera de Factomedia debe regresar mediante sincronización.
- Una métrica no disponible se muestra como `N/D`, nunca como cero.
- Las visualizaciones acumuladas entre plataformas no se presentan como personas únicas.
- Solo editoras, administradoras y dirección pueden aprobar o publicar.
- La landing consume una proyección pública separada para evitar fugas de información interna.
- La IA permanece como asistencia editable y no toma decisiones editoriales.
