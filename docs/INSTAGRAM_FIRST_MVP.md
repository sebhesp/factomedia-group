# Factomedia — MVP Instagram primero

## Producto

El corazón del sistema es Instagram. El equipo continúa publicando Reels como hoy; Factomedia detecta el contenido, lo procesa y entrega una Nota Maestra lista para revisión.

## Promesa del MVP

> Un Reel publicado en @elfactonoticias se convierte automáticamente en una nota web estructurada, atribuida, verificable y lista para revisión humana.

## Alcance del MVP

### Incluido

1. Conexión de una cuenta profesional de Instagram.
2. Sincronización incremental de Reels propios.
3. Importación de caption, permalink, fecha, miniatura, duración y métricas disponibles.
4. Obtención segura del video propio cuando la API y permisos lo permitan.
5. Extracción de audio.
6. Transcripción en español.
7. Lectura del texto visible en pantalla.
8. Identificación de presentador o autor cuando exista una regla aprobada.
9. Separación de hechos, opiniones, declaraciones y datos pendientes.
10. Generación de Nota Maestra.
11. Panel de revisión humana.
12. Propuesta de imagen de portada usando frame del Reel o una imagen aprobada.
13. Publicación en la web.
14. Registro de origen, versiones, fuentes, correcciones y métricas.
15. Aprendizaje a partir de cambios editoriales, sin auto-publicación.

### No incluido en la primera entrega

- publicación automática en X o Threads;
- generación autónoma de columnas firmadas;
- publicación sin revisión humana;
- investigación completamente autónoma sin fuentes aprobadas;
- uso de scraping como dependencia principal;
- reconocimiento biométrico de personas.

## Flujo operativo

1. `DETECTED` — nuevo Reel localizado.
2. `IMPORTED` — metadatos y archivos guardados.
3. `TRANSCRIBING` — audio a texto.
4. `ANALYZING` — caption, transcripción y texto en pantalla se estructuran.
5. `RESEARCHING` — se buscan fuentes complementarias.
6. `DRAFTING` — se genera una Nota Maestra.
7. `NEEDS_REVIEW` — una persona revisa título, cuerpo, fuentes, autor e imagen.
8. `APPROVED` — editora aprueba.
9. `PUBLISHED` — nota publicada en la web.
10. `MEASURING` — se sincronizan métricas y cambios.

Estados de excepción:

- `MISSING_MEDIA_PERMISSION`;
- `TRANSCRIPTION_LOW_CONFIDENCE`;
- `AUTHOR_UNRESOLVED`;
- `CLAIMS_UNVERIFIED`;
- `IMAGE_REQUIRED`;
- `EDITORIAL_BLOCKED`;
- `FAILED_RETRYABLE`;
- `FAILED_MANUAL`.

## Criterio de autoría

La autoría no se infiere por reconocimiento facial.

Orden recomendado:

1. etiqueta interna añadida al Reel antes o después de publicar;
2. mención explícita en caption;
3. calendario de turnos aprobado;
4. selección manual en revisión.

Perfiles iniciales a configurar:

- Pavel Martínez Gaona;
- José Jesús López Lagos;
- Ilse Mariana Reyes Valle;
- Nadia Valentina Báez Patiño, pendiente confirmar alias «Valen».

## Estructura de salida

```json
{
  "source": {
    "platform": "instagram",
    "media_id": "...",
    "permalink": "...",
    "caption": "...",
    "published_at": "..."
  },
  "transcription": {
    "text": "...",
    "language": "es",
    "confidence": 0.93,
    "segments": []
  },
  "editorial": {
    "content_type": "news",
    "author_id": "...",
    "title": "...",
    "dek": "...",
    "lead": "...",
    "body": "...",
    "context": "...",
    "claims": [],
    "sources": [],
    "verification_status": "needs_review"
  },
  "assets": {
    "cover_strategy": "video_frame",
    "cover_timestamp_seconds": 4.2,
    "alt_text": "..."
  },
  "seo": {
    "slug": "...",
    "meta_title": "...",
    "meta_description": "..."
  }
}
```

## Arquitectura recomendada

### Frontend

- Next.js + TypeScript.
- Factomedia Studio como panel de revisión.
- Diseño móvil primero.

### Backend

- Supabase/PostgreSQL para datos, Auth, Storage y RLS.
- Cola de trabajos para procesamiento asíncrono.
- Worker separado para video, audio e IA.
- Vercel para frontend; un servicio de workers con mayor duración para procesamiento.

### Integración Meta

- Cuenta de Instagram profesional.
- Aplicación de Meta en modo desarrollo y después producción.
- OAuth; nunca compartir contraseña.
- Sincronización híbrida: consulta incremental periódica y webhooks disponibles.
- Guardar cursores y `media_id` para evitar duplicados.

### IA

- Transcripción: OpenAI Speech-to-Text o proveedor equivalente.
- Comprensión de video: Gemini API cuando el contexto visual aporte información que la transcripción no contiene.
- Redacción estructurada: OpenAI Responses API con Structured Outputs.
- Investigación: búsquedas limitadas a fuentes permitidas y registradas.
- Embeddings: memoria editorial, recuperación de guías y comparación con notas anteriores.

No se requiere Claude API para el MVP. Puede usarse como herramienta de desarrollo y evaluación, pero el producto debe evitar depender de tres proveedores de IA desde el primer lanzamiento.

## Estrategia de costos

Para controlar costo y complejidad:

1. transcribir todos los Reels;
2. analizar visualmente solo cuando texto en pantalla, imágenes o escenas sean necesarias;
3. usar un modelo económico para clasificación y extracción;
4. usar un modelo de mayor capacidad solo para redacción final o casos de riesgo;
5. cachear resultados por `media_id` y versión;
6. no reprocesar video completo por una corrección textual.

## Seguridad y privacidad

- secretos solo en variables de entorno;
- tokens de Meta cifrados y rotados;
- URLs temporales para archivos;
- auditoría de acceso;
- permisos por rol;
- separación entre material bruto, borrador y contenido publicado;
- logs sin transcripciones completas;
- eliminación y retención configurables;
- consentimiento contractual antes de usar correcciones para mejorar modelos.

## Criterio de éxito de la beta

Con 50 Reels reales:

- 90% detectados sin duplicado;
- 95% con transcripción utilizable;
- 80% convertidos en borrador de nota;
- menos de 15 minutos desde detección hasta borrador;
- menos de 8 minutos de edición humana promedio;
- 100% de notas publicadas con aprobación humana;
- cero atribuciones inventadas;
- cero publicaciones automáticas accidentales.

## Plan de entrega

### Semana 1 — acceso y definición

- crear app de Meta;
- confirmar CMS y dominio;
- aprobar autores, categorías y reglas editoriales;
- recopilar 30 Reels de prueba;
- definir nota web objetivo.

### Semanas 2 y 3 — ingestión

- OAuth de Instagram;
- sincronización de media;
- almacenamiento;
- cola y estados del pipeline;
- panel de Reels detectados.

### Semanas 4 y 5 — IA editorial

- transcripción;
- extracción estructurada;
- redacción;
- autoría;
- fuentes y estados de verificación.

### Semana 6 — revisión y publicación

- editor;
- comparación video/transcripción/nota;
- aprobación;
- integración con CMS;
- imagen y SEO.

### Semana 7 — métricas y aprendizaje

- métricas de Instagram y web;
- historial de correcciones;
- telemetría;
- panel de calidad.

### Semana 8 — beta controlada

- 50 Reels;
- corrección de fallos;
- seguridad;
- documentación;
- capacitación.
