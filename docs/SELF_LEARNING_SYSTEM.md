# Factomedia — sistema de aprendizaje continuo

## Tesis

Factomedia debe mejorar con cada uso, pero no puede optimizar una sola métrica a costa de calidad editorial, privacidad o bienestar del equipo. El sistema sigue este ciclo:

1. **Observar:** registrar acciones, tiempos, bloqueos, errores y feedback sin capturar el contenido de las noticias.
2. **Entender:** agrupar señales por pantalla, etapa editorial, rol y sesión.
3. **Proponer:** generar recomendaciones con evidencia y nivel de confianza.
4. **Probar:** usar experimentos controlados y reversibles.
5. **Medir:** comparar una métrica principal y sus guardrails.
6. **Adoptar o descartar:** una persona responsable revisa el resultado y decide.

La aplicación nunca cambia por sí sola un criterio editorial, un flujo crítico o una política de verificación.

## North Star

### Historias terminadas con calidad y sin bloqueo

**Definición:** porcentaje de historias iniciadas que llegan a revisión con las fuentes y afirmaciones requeridas, sin reportes de bloqueo severo.

```text
historias enviadas a revisión con requisitos completos
------------------------------------------------------
historias iniciadas
```

Esta métrica combina finalización y calidad mínima. No premia publicar más rápido si aumenta errores o reduce verificación.

## KPI principales

### 1. Tasa de finalización editorial

- Inicio: `story_created`.
- Finalización: `story_submitted`.
- Segmentos: origen, sección, rol, dispositivo y tipo de cobertura.
- Decisión que informa: dónde simplificar o acompañar mejor el flujo.

### 2. Tiempo hasta valor

Mediana entre la primera acción de una historia y el momento en que queda lista para revisión.

- No se usa para presionar a una persona.
- Se analiza por tipo de historia y complejidad.
- El objetivo es reducir esperas, duplicación y pasos innecesarios.

### 3. Experiencia sin bloqueo

Porcentaje de sesiones editoriales sin:

- clics repetidos;
- errores no controlados;
- feedback `blocked`;
- abandono después de una acción crítica;
- más de dos regresos al mismo paso sin avance.

## Métricas conductoras

- Captura iniciada → captura terminada.
- Radar consultado → Noticia Maestra creada.
- Fuente agregada → afirmación verificada.
- Sugerencia de IA mostrada → aceptada, editada o rechazada.
- Solicitud de cambio → corrección terminada.
- Noticia aprobada → versión social preparada.
- Publicación social → clic o lectura en web.

## Guardrails

Toda mejora debe revisarse contra:

- tasa de correcciones editoriales;
- historias descartadas por falta de sustento;
- fuentes insuficientes;
- afirmaciones pendientes al enviar a revisión;
- errores y tiempo de carga;
- feedback negativo;
- volumen de datos recolectados;
- diferencias injustificadas entre roles o grupos.

## Taxonomía de eventos

La primera versión se encuentra en `src/lib/product-intelligence.ts`.

Convenciones:

- nombres en pasado o acción clara: `story_created`, `radar_search_completed`;
- propiedades pequeñas y categóricas;
- nunca enviar título, cuerpo, consulta de búsqueda, URL, correo, teléfono o contenido de fuentes;
- `session_id` y `visitor_id` seudónimos;
- `app_version` para comparar cambios;
- un evento debe responder una pregunta de producto concreta.

## Feedback

El feedback contextual conserva:

- ruta;
- momento;
- sesión;
- calificación de 1 a 5;
- categoría de fricción;
- comentario opcional.

No conserva automáticamente el contenido de la noticia. Los comentarios deben revisarse en conjunto con comportamiento y resultados; una sola opinión no activa un cambio.

## Detección de fricción

La primera instrumentación detecta:

- tres clics sobre la misma acción en menos de 1.8 segundos;
- errores de ventana y promesas no controladas;
- rendimiento de navegación;
- rutas y comandos utilizados;
- conversiones de captura y Radar;
- feedback de bloqueo.

Siguientes señales:

- abandono de formularios;
- campos corregidos repetidamente;
- tiempo inactivo antes de pedir ayuda;
- regresos entre etapas;
- sugerencias de IA deshechas;
- discrepancias entre “guardado” y estado real.

## Experimentos

Cada experimento debe contener:

- hipótesis;
- población;
- variantes;
- métrica principal;
- guardrails;
- duración mínima;
- criterio de adopción;
- responsable;
- plan de reversión.

Ejemplo:

```text
Hipótesis:
Mostrar Buscar noticia dentro de Mi mesa aumentará la creación de historias relevantes.

Métrica principal:
Noticia Maestra creada / sesión con Radar abierto.

Guardrails:
Historias descartadas, feedback negativo y fuentes insuficientes.
```

## Arquitectura

### Demostración actual

- eventos y feedback se conservan en `localStorage`;
- el Centro de Aprendizajes calcula recomendaciones localmente;
- `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENDPOINT` permite enviar eventos a un recolector externo;
- las propiedades sensibles se filtran antes de guardar o enviar.

### Producción

- endpoint autenticado y rate-limited;
- validación de esquema en servidor;
- tablas de Supabase en `supabase/product-intelligence.sql`;
- agregaciones diarias y semanales;
- retención limitada de eventos crudos;
- acceso a datos solo para roles autorizados;
- experimentos asignados de forma estable;
- insights revisables con estado, responsable y evidencia.

## Cadencia operativa

### Diario

- errores críticos;
- bloqueos;
- caídas de rendimiento;
- problemas de sincronización.

### Semanal

- finalización editorial;
- tiempo hasta valor;
- embudos por etapa;
- feedback recurrente;
- utilidad de IA;
- resultados de experimentos.

### Mensual

- cambios adoptados;
- métricas que dejaron de ser útiles;
- auditoría de privacidad;
- deuda de instrumentación;
- sesgos o incentivos no deseados.

## Principio final

> Factomedia aprende de las personas para reducir fricción y elevar calidad; no utiliza métricas para vigilar, presionar o sustituir el criterio editorial.
