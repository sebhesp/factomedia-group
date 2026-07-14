# Activación de producción — Instagram → nota

El repositorio queda preparado para funcionar con datos reales. La activación requiere cuentas y credenciales propiedad de El Facto Noticias; nunca deben guardarse en GitHub ni enviarse por chat.

## 1. Requisitos del propietario

- cuenta profesional `@elfactonoticias`;
- acceso administrativo al portafolio de Meta;
- proyecto de Supabase;
- proyecto de OpenAI API con facturación;
- proyecto de Vercel;
- dominio final de El Facto Noticias;
- una persona con rol `editor` o `admin` para aprobar publicaciones.

## 2. Preparar el entorno local

```bash
cp .env.example .env.local
```

Completa `.env.local` y valida sin imprimir secretos:

```bash
npm run check:readiness
```

La plantilla también se valida en CI:

```bash
npm run check:readiness:template
```

## 3. Desplegar Supabase

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
supabase functions deploy instagram-sync
supabase functions deploy instagram-process
supabase functions deploy instagram-compare-timing
supabase functions deploy instagram-pipeline-tick
supabase functions deploy instagram-review
supabase functions deploy system-health
```

Configura los secretos indicados en `.env.example` con `supabase secrets set`. Los valores `NEXT_PUBLIC_*` van únicamente en Vercel.

## 4. Verificar antes de procesar contenido

```bash
npm run smoke:health
```

El diagnóstico comprueba:

- variables obligatorias;
- migraciones y tablas;
- estado de la cuenta de Instagram;
- cantidad de trabajos pendientes.

## 5. Primer ciclo real

Publica o selecciona un Reel de prueba. Después ejecuta:

```bash
CONFIRM_PRODUCTION_SMOKE=YES npm run smoke:instagram
```

Resultado esperado:

1. `instagram-sync` detecta el Reel;
2. `instagram-process` descarga, transcribe y redacta;
3. `instagram-compare-timing` registra coincidencias externas;
4. la nota aparece en `/instagram` como `Necesita revisión`;
5. una editora la aprueba y publica;
6. la URL pública se genera desde `PUBLIC_SITE_URL`.

## 6. Automatización

Programa `instagram-pipeline-tick` cada dos minutos con el header:

```text
x-cron-secret: INSTAGRAM_SYNC_CRON_SECRET
```

No actives el cron hasta que el smoke test complete un Reel sin nombres, cifras o citas inventadas.

## Definición de listo

- CI verde: branding, TypeScript, lint, pruebas y build;
- diagnóstico `ready: true`;
- un Reel real convertido en nota;
- revisión y publicación con un usuario editor;
- dominio y URL canónica correctos;
- secretos almacenados solo en Supabase/Vercel;
- cero publicación automática sin aprobación humana.
