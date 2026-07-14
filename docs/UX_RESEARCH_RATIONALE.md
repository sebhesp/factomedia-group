# El Facto Noticias · Redacción — investigación y justificación de UX

## Tesis de producto

El Facto Noticias · Redacción no debe comportarse como un CMS administrativo. Debe sentirse como un espacio editorial en el que capturar, investigar, escribir, verificar, revisar y distribuir ocurren sobre un mismo núcleo de contenido.

La interfaz se diseña alrededor de tres preguntas constantes:

1. ¿Qué está pasando?
2. ¿Qué falta para avanzar?
3. ¿Cuál es la siguiente acción útil?

## Referencias estudiadas

### Notion — contenido como interfaz

Fuente: https://www.notion.com/help/writing-and-editing-basics

Patrones relevantes:

- La página funciona primero como herramienta de escritura.
- Los bloques permiten mezclar texto, documentos, audio, video, datos y comentarios.
- El comando `/` revela tipos de contenido y acciones sin mantenerlos visibles permanentemente.
- Los comentarios, sugerencias y acciones de IA aparecen sobre el bloque relacionado.
- Las menciones permiten llevar a una persona al punto exacto que requiere atención.

Aplicación en El Facto Noticias:

- La Noticia Maestra es el lienzo principal.
- Fuentes, citas, afirmaciones, contexto y actualizaciones se tratan como bloques editoriales.
- Las herramientas especializadas aparecen según el elemento seleccionado.
- La ayuda editorial se ancla al contenido, no a un chat separado.

### Linear — foco, bloqueos y software de alta calidad

Fuente: https://linear.app/method

Patrones relevantes:

- Priorizar habilitadores y bloqueos.
- Reducir alcance y mantener dirección clara.
- Construir con usuarios y lanzar de forma incremental.
- Evitar que la interfaz compita con la tarea principal.

Aplicación en El Facto Noticias:

- `Mi mesa` ordena el trabajo por lo que desbloquea más avance.
- Cada historia presenta una sola siguiente acción recomendada.
- Los estados son compactos y consistentes.
- La navegación permanece corta: Mi mesa, Capturar, Ahora, Distribución y Portada.

### Descript — transformar complejidad mediante una metáfora conocida

Fuente: https://www.descript.com/video-editing

Patrones relevantes:

- El usuario edita video modificando texto.
- La complejidad técnica se traduce a una operación familiar.
- La IA actúa bajo dirección, ofrece sugerencias y mantiene la intención creativa.

Aplicación en El Facto Noticias:

- El colaborador modifica una sola Noticia Maestra.
- La web, X, Threads e Instagram se derivan de ese núcleo.
- El usuario no administra pipelines: escribe, confirma y decide.
- La IA ordena y adapta; nunca verifica, aprueba ni publica silenciosamente.

### Figma — colaboración sobre un estado compartido

Fuente: https://www.figma.com/blog/how-figmas-multiplayer-technology-works/

Patrones relevantes:

- Todas las personas acceden al estado actual sin exportar copias.
- La colaboración en vivo evita interrupciones y duplicación.
- Se puede continuar trabajando sin conexión y reconciliar cambios después.
- Comentarios y datos operativos pueden sincronizarse por mecanismos distintos al lienzo principal.

Aplicación en El Facto Noticias:

- Presencia visible y discreta del equipo.
- Una única versión actual de la historia, acompañada por historial y eventos.
- Comentarios anclados y decisiones editoriales trazables.
- Diseño futuro offline-first para cobertura en campo.

### Airtable — varias vistas sobre los mismos datos

Fuente: https://support.airtable.com/docs/getting-started-with-airtable-views

Patrones relevantes:

- Una tabla puede verse como grid, formulario, calendario, kanban, timeline, lista o gantt.
- Las vistas pueden ser colaborativas, personales o bloqueadas.
- Filtrar, agrupar y ordenar no requiere duplicar los registros.

Aplicación en El Facto Noticias:

- La misma Noticia Maestra se presenta como Mi mesa, Redacción, cobertura en vivo, distribución y archivo.
- Cada rol ve la superficie necesaria para su decisión.
- Los filtros modifican la vista, no crean copias de la información.

## Fundamentos generales de usabilidad

### Divulgación progresiva

Fuente: https://www.nngroup.com/articles/progressive-disclosure/

Decisión:

- Mostrar primero las acciones frecuentes.
- Revelar opciones especializadas únicamente cuando el usuario las solicita o cuando el proceso las necesita.
- Evitar que la primera pantalla contenga campos de SEO, configuración, administración o distribución.

### Visibilidad del estado

Fuente: https://www.nngroup.com/articles/ten-usability-heuristics/

Decisión:

- Mostrar guardado, sincronización, estado editorial, preparación y siguiente acción.
- Ninguna acción con consecuencias ocurre sin feedback visible.
- El estado se comunica con texto; el color es refuerzo y no único indicador.

### Reconocimiento sobre memoria

Fuentes:

- https://www.nngroup.com/articles/recognition-and-recall/
- https://www.nngroup.com/articles/ten-usability-heuristics/

Decisión:

- El colaborador nunca necesita memorizar el flujo.
- La interfaz muestra requisitos, ejemplos y acciones en contexto.
- `⌘K` acelera a usuarios expertos, pero todas las funciones permanecen disponibles mediante navegación visible.

### Control, prevención y recuperación

Fuente: https://www.nngroup.com/articles/ten-usability-heuristics/

Decisión:

- Guardado automático, cancelar, deshacer e historial.
- Confirmaciones antes de aprobar, publicar o corregir.
- Los errores explican qué ocurrió, por qué importa y cómo resolverlo.
- Se conserva todo el material ya capturado.

## Interacción humano–IA

Fuente: https://www.microsoft.com/en-us/haxtoolkit/

Principios adoptados:

- Definir desde el diseño qué puede y qué no puede hacer la IA.
- Anticipar fallos de lenguaje natural y ofrecer recuperación.
- Mostrar sugerencias antes de aplicarlas.
- Permitir aceptar, editar, descartar y deshacer.
- Comunicar la evidencia y el contexto utilizados.
- Mantener decisiones editoriales críticas bajo control humano.

## Traducción actual en el producto

### Mi mesa

- Captura universal como acción primaria.
- Continuidad de trabajo por encima de métricas.
- Una historia prioritaria y una siguiente acción.
- Lista secundaria ordenada por bloqueo.
- Presencia del equipo sin ruido.
- Acceso a Ahora.

### Shell de navegación

- Cinco destinos principales.
- Marca `El Facto Noticias · Redacción`.
- Estado de conexión visible.
- Paleta global `⌘K`.
- Navegación móvil reducida a las cuatro acciones internas principales.

### Captura universal

- Acepta texto, enlace, nota o intención de archivo.
- Crea una Noticia Maestra sin pedir campos administrativos.
- Genera título, resumen y categoría provisionales localmente.
- Envía directamente a la Sala de Noticia para continuar con evidencia.

## Criterios para evaluar las siguientes iteraciones

1. Tiempo hasta la primera captura útil.
2. Porcentaje de colaboradores que identifican la siguiente acción sin ayuda.
3. Abandono por etapa.
4. Número de campos o acciones visibles por pantalla.
5. Tiempo para recuperar un borrador o corregir un error.
6. Porcentaje de sugerencias de IA aceptadas, editadas y descartadas.
7. Correcciones causadas por automatizaciones no comprendidas.
8. Satisfacción cualitativa: calma, control, claridad y acompañamiento.

## Regla de diseño

> El colaborador se concentra en entender y contar lo que ocurre. El Facto Noticias organiza el sistema alrededor de esa intención.
