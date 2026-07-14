# El Facto Noticias — Sistema de distribución y rendimiento

## Promesa de producto

Todo lo que El Facto Noticias publique, dentro o fuera de la plataforma, debe regresar como contexto, rendimiento y aprendizaje editorial.

El sistema no se limita a programar publicaciones. Mantiene una relación trazable entre la Noticia Maestra, cada pieza social, las personas que intervinieron y los datos que las plataformas entregan con el tiempo.

## Flujo operativo

1. Una publicación se crea desde El Facto Noticias o directamente en X, Instagram o Threads.
2. El conector consulta publicaciones nuevas mediante un cursor incremental o el último ID conocido.
3. El Facto Noticias evita duplicados usando `platform + account + externalId`.
4. La publicación se importa con su texto, fecha, formato, origen y métricas disponibles.
5. El motor de reconciliación propone una Noticia Maestra usando enlaces, similitud textual, entidades y proximidad temporal.
6. Coincidencias menores a 88% requieren confirmación humana.
7. Se registra un primer snapshot de métricas.
8. El sistema vuelve a consultar a los 5, 15 y 30 minutos; 1, 3, 6, 12 y 24 horas; 3, 7 y 30 días.
9. Alertas editoriales aparecen solo cuando requieren acción o contienen un aprendizaje relevante.

## Entidades principales

### SocialPost

- ID interno.
- ID externo.
- Plataforma y cuenta.
- Origen: El Facto Noticias, aplicación nativa o importación manual.
- Texto y formato editorial.
- Estado.
- Noticia Maestra relacionada.
- Responsable y persona aprobadora.
- Versión.
- Fecha de publicación, importación y última sincronización.
- Snapshots de métricas.
- Historial completo de acciones.

### SocialMetricSnapshot

Cada captura conserva el valor recibido en un momento determinado. No se sobrescriben métricas anteriores.

- Visualizaciones.
- Alcance, cuando existe.
- Likes.
- Respuestas.
- Reposts.
- Citas.
- Compartidos.
- Guardados.
- Clics.
- Visitas al perfil.
- Seguidores atribuidos.

Una métrica no disponible debe persistirse como `undefined`, nunca como cero.

### SocialAction

Registra generación, edición, aprobación, publicación, importación, sincronización, relación con historias, identificación de responsables, correcciones y eliminación.

## Integraciones reales

### X

La primera integración debe incluir:

- OAuth por cuenta editorial.
- Lectura incremental del timeline propio.
- Publicación y respuestas para construir hilos.
- Recuperación de métricas permitidas por el nivel de acceso.
- Reconciliación del historial de edición.
- Detección de publicaciones eliminadas.
- Persistencia del último ID sincronizado por cuenta.

### Instagram

La integración debe usar cuentas profesionales y permisos aprobados por Meta.

- Lectura de medios publicados por la cuenta.
- Importación de publicaciones creadas fuera de El Facto Noticias.
- Insights por tipo de contenido según disponibilidad.
- Registro explícito de métricas no disponibles.
- Manejo de expiración de tokens y pérdida de permisos.

### Threads

- Publicación de versiones contextuales.
- Lectura de publicaciones de la cuenta.
- Importación y snapshots según los campos disponibles en la API vigente.

## Frecuencia de sincronización

La frecuencia depende de la edad y velocidad de la publicación:

- Cobertura en vivo: cada 5 minutos durante la primera hora.
- Publicación reciente: cada 15 minutos durante 3 horas.
- Primer día: cada hora.
- Días 2 a 7: una vez al día.
- Hasta día 30: una vez por semana.

Se debe aplicar backoff cuando una API limite solicitudes.

## Alertas

Las alertas deben ser accionables:

- Publicación externa sin Noticia Maestra.
- Responsable sin identificar.
- Crecimiento acelerado.
- Corrección de la noticia no reflejada en redes.
- Métrica o sincronización detenida.
- Respuesta relevante de autoridad o fuente.
- Publicación eliminada o editada fuera de El Facto Noticias.
- Rendimiento inusual frente a piezas comparables.

## Integridad analítica

- No sumar visualizaciones como si fueran personas únicas.
- No comparar formatos incompatibles.
- Comparar por plataforma, formato, antigüedad, horario y categoría.
- Mostrar siempre el periodo de medición.
- Conservar datos crudos antes de calcular indicadores derivados.
- Identificar estimaciones y métricas atribuidas por la plataforma.

## Seguridad editorial

- Ninguna publicación sensible se publica sin aprobación configurada.
- La IA puede proponer texto, relación y aprendizaje; no puede confirmar hechos.
- Toda modificación automática debe ser reversible.
- Tokens se almacenan cifrados y nunca llegan al cliente.
- Las acciones de API se ejecutan en servicios de servidor, no en el navegador.

## Estado del MVP

La interfaz DEMO ya implementa:

- Centro de distribución.
- Publicaciones internas y externas.
- Filtros por plataforma y origen.
- Métricas acumuladas con advertencias de interpretación.
- Snapshots históricos simulados.
- Alertas editoriales.
- Agrupación por Noticia Maestra.
- Ficha avanzada de cada publicación.
- Relación manual con noticias.
- Identificación de responsables.
- Motor inicial de reconciliación.

La siguiente etapa es sustituir el almacén local por Supabase y ejecutar conectores y jobs programados desde backend.
