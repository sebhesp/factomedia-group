# Salida de Squarespace y migración del sitio público

## Estado confirmado

El sitio anterior estaba construido en Squarespace y actualmente se encuentra vencido.

## Decisión de arquitectura

Squarespace no será el CMS de producción del nuevo sistema.

La nueva arquitectura será:

- **El Facto Noticias · Redacción**: aplicación interna para Instagram, transcripción, notas, revisión y métricas.
- **Supabase**: base de datos, autenticación, almacenamiento y estado editorial.
- **Next.js en Vercel**: sitio público y aplicación interna.
- **Dominio definitivo de El Facto Noticias**: conectado a Vercel después de validar staging.
- **GitHub Pages**: únicamente demo y respaldo visual; no producción.

Al aprobar y publicar una nota, el mismo registro de Supabase queda disponible en el sitio público. No existe una segunda copia que mantener manualmente.

## Qué recuperar de Squarespace antes de abandonarlo

1. Confirmar acceso a la cuenta propietaria.
2. Identificar si venció:
   - la suscripción del sitio;
   - el registro del dominio;
   - o ambos.
3. Renovar temporalmente solo si es necesario para recuperar información o proteger el dominio.
4. Descargar o documentar:
   - páginas existentes;
   - textos institucionales;
   - artículos y columnas;
   - fotografías originales;
   - logotipos;
   - metadatos SEO;
   - slugs y URLs antiguas;
   - autores y categorías;
   - formularios y contactos;
   - códigos de analítica;
   - registros DNS y correo.
5. Crear una tabla de redirecciones `URL anterior → URL nueva`.
6. No cancelar ni transferir el dominio hasta que la nueva web esté probada.

## Riesgo prioritario: dominio

La suscripción del sitio y el dominio son productos distintos. Antes de cualquier desarrollo adicional se debe comprobar en Squarespace:

- fecha de renovación del dominio;
- propietario registrante;
- correo de recuperación;
- auto-renovación;
- acceso al panel DNS;
- estado de Google Workspace o correo corporativo.

Si el dominio está vigente, se mantiene en Squarespace inicialmente y solo se cambian sus registros DNS cuando Vercel esté listo.

Si el dominio también está vencido, debe recuperarse o renovarse antes de intentar una transferencia.

## Publicación nativa

La función `instagram-review` ya está preparada para publicar directamente al nuevo sitio:

1. la editora aprueba;
2. el sistema genera o conserva el slug;
3. asigna URL canónica;
4. marca la nota como publicada;
5. la vista pública de Supabase la expone de forma segura;
6. Next.js sirve `/noticias/{slug}`;
7. el Reel original queda vinculado como origen editorial.

`CMS_PUBLISH_ENDPOINT` queda como integración opcional futura, no como dependencia.

## Plan de transición

### Fase A — Rescate

- recuperar acceso a Squarespace;
- confirmar dominio y correo;
- inventariar contenido;
- exportar o copiar material esencial;
- guardar redirecciones.

### Fase B — Staging

- desplegar El Facto Noticias en Vercel con subdominio temporal;
- conectar Supabase;
- publicar 10 notas de prueba;
- probar móvil, SEO, Open Graph y analítica;
- validar autores, secciones e imágenes.

### Fase C — Cambio de dominio

- bajar TTL de DNS;
- conectar el dominio definitivo y su versión `www` a Vercel;
- conservar MX y registros de correo;
- activar HTTPS;
- probar redirecciones;
- verificar Search Console y Analytics.

### Fase D — Cierre

- observar errores 7–14 días;
- corregir URLs rotas;
- confirmar indexación;
- cancelar únicamente el plan de sitio de Squarespace cuando todo esté respaldado;
- mantener o transferir el dominio según la decisión administrativa.

## Criterio de listo

- dominio bajo control y con renovación activa;
- staging funcional;
- notas públicas cargadas desde Supabase;
- publicación editorial probada;
- redirecciones definidas;
- correo intacto;
- analítica instalada;
- respaldo completo del contenido anterior;
- aprobación final de El Facto antes del cambio de DNS.
