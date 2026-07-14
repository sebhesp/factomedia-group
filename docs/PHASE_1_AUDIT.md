# Fase 1 — Auditoría, arquitectura y primera vertical funcional

## 1. Auditoría del repositorio

El proyecto se creó desde cero con Next.js App Router y TypeScript estricto. No había código legado que conservar. La base actual incluye una landing pública, acceso interno, Redacción, creación progresiva de Noticias Maestras, Sala de Noticia, Redacción en vivo, datos DEMO, esquema Supabase y pruebas.

La app funciona sin servicios externos. En ese modo, los datos creados se guardan en el navegador y están marcados explícitamente como DEMO. Supabase no se presenta como conectado mientras falten sus variables de entorno.

## 2. Supuestos confirmados y supuestos corregidos

### Confirmados

- El usuario principal es el colaborador interno.
- La Noticia Maestra es la unidad central.
- La edición compleja pertenece a Redacción.
- La landing debe mostrar solo una proyección pública.
- La calidad, las fuentes y la trazabilidad son tan importantes como el alcance.
- El MVP debe reducir carga cognitiva.

### Corregidos

- No se construirá todo el ecosistema en una sola vertical técnica.
- WhatsApp no forma parte de las primeras fases y queda para el final final.
- La IA permanece como contrato DEMO, sin autoridad editorial ni llamadas externas.
- Las métricas iniciales son descriptivas y operativas, no evaluación automática de personas.
- En DEMO, una publicación local aparece únicamente en el mismo navegador; la publicación multiusuario requiere Supabase.

## 3. Arquitectura propuesta

Se usa un monolito modular de Next.js:

- `app/`: rutas públicas e internas.
- `components/`: presentación e interacción.
- `lib/`: tipos, reglas, datos DEMO y adaptadores.
- `supabase/`: migraciones, RLS y datos de referencia.
- `tests/`: pruebas end-to-end.

La persistencia se abstrae en dos etapas:

1. DEMO con `localStorage` para probar la experiencia sin infraestructura.
2. Supabase con PostgreSQL, Auth, Storage y RLS para producción.

No se usan microservicios. La proyección `public_pages` evita que la landing consulte directamente campos internos de `stories`.

## 4. Estructura de carpetas propuesta

```text
src/
  app/
    (desk)/
      mi-dia/
      redaccion/
      desk/noticias/
    login/
    noticias/
  components/
  lib/
    ai/
    supabase/
supabase/
  migrations/
  seed.sql
tests/
  e2e/
docs/
```

La futura integración de WhatsApp no debe añadirse hasta la última fase. Cuando llegue, vivirá aislada en una capa de integración y no contaminará el dominio editorial.

## 5. Modelo de datos inicial

- `users`: perfil interno vinculado a Auth.
- `roles`: catálogo explicativo de roles.
- `teams`: equipos o secciones.
- `categories`: clasificación pública/editorial.
- `stories`: Noticia Maestra.
- `story_versions`: fotografías relevantes del contenido.
- `sources`: fuentes de una noticia.
- `claims`: afirmaciones verificables.
- `claim_sources`: respaldo de afirmaciones.
- `assets`: imágenes, audio, video y documentos.
- `assignments`: participación y responsabilidad.
- `goals` / `goal_progress`: metas simples.
- `editorial_events`: historial inmutable de acciones.
- `approvals`: decisiones editoriales.
- `corrections`: correcciones transparentes.
- `public_pages`: proyección pública segura.
- `analytics_events`: eventos básicos de lectura.
- `notifications`: pendientes y avisos internos.

Los campos y relaciones completos están en `supabase/migrations/001_initial_schema.sql`.

## 6. Plan por fases

1. Fundación y vertical DEMO funcional.
2. Persistencia y autenticación Supabase reales.
3. Flujo editorial persistente y colaboración.
4. Landing, SEO, medios y analítica reales.
5. Reportes, pruebas, accesibilidad y seguridad.
6. Integraciones editoriales adicionales.
7. WhatsApp al final final.

## 7. Riesgos principales

- La complejidad puede reducir adopción.
- Un modelo de permisos incompleto puede permitir publicaciones indebidas.
- Mezclar datos internos y públicos puede filtrar información.
- Métricas mal presentadas pueden incentivar volumen sobre calidad.
- Archivos grandes requieren límites, validación y políticas de Storage.
- El modo DEMO no sustituye pruebas multiusuario con Supabase.
- RLS debe verificarse con usuarios y sesiones reales antes de producción.

## 8. Tareas inmediatas de la primera iteración

Completadas:

- sistema visual responsive;
- portada pública;
- página de noticia con `NewsArticle`;
- login real preparado y acceso DEMO;
- Mi día;
- creación progresiva;
- Sala de Noticia;
- fuentes y afirmaciones;
- roles DEMO y acciones restringidas;
- aprobación, publicación y correcciones DEMO;
- historial editorial;
- Redacción en vivo;
- esquema SQL y RLS;
- README, `.env.example`, pruebas unitarias y smoke test E2E.

Siguiente iteración:

- conectar un proyecto Supabase;
- reemplazar almacenamiento DEMO por repositorios reales;
- proteger rutas en servidor;
- implementar subida real a Storage;
- probar políticas RLS con cada rol;
- persistir metas, eventos y analítica;
- ampliar pruebas end-to-end.
