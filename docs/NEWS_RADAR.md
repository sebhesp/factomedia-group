# Factomedia Radar — búsqueda reciente y verificación

## Objetivo

`Buscar noticia` detecta cobertura publicada durante los últimos 15, 30, 60 o 180 minutos, agrupa piezas que parecen describir el mismo acontecimiento y muestra el nivel de respaldo disponible antes de crear una Noticia Maestra.

## Fuente abierta inicial

La primera versión consulta GDELT DOC 2.0 desde el navegador. GDELT permite búsquedas de cobertura reciente, salida JSON y CORS. La integración no requiere exponer una llave privada.

Cuando `NEXT_PUBLIC_NEWS_RADAR_ENDPOINT` está configurado, el cliente utiliza ese endpoint seguro en lugar de consultar GDELT directamente. Ese endpoint puede combinar GDELT, X Recent Search, feeds oficiales y proveedores comerciales sin revelar tokens en el navegador.

## Estados editoriales

- **Confirmada:** existe una fuente primaria u oficial y al menos una fuente independiente.
- **Corroborada:** tres o más dominios independientes coinciden en el acontecimiento principal.
- **En desarrollo:** dos dominios independientes coinciden, pero falta una fuente primaria o una tercera corroboración.
- **Por verificar:** solo existe una fuente localizada.

Estos estados describen respaldo documental, no una garantía matemática de verdad. La aprobación final sigue siendo humana.

## Flujo

1. La persona abre `Buscar noticia` desde Mi mesa, la barra lateral o `Cmd/Ctrl + K`.
2. Elige tema y ventana temporal.
3. El radar consulta cobertura reciente y agrupa titulares por similitud.
4. Se calcula diversidad de dominios y presencia de fuente primaria.
5. La persona abre las fuentes o crea una Noticia Maestra.
6. La Noticia Maestra conserva las fuentes, el estado inicial y un evento de trazabilidad.

## Integración con X

La búsqueda reciente de X requiere un Bearer Token y debe ejecutarse en un backend o función perimetral. Nunca debe colocarse el token dentro del bundle público de GitHub Pages. La arquitectura deja preparado `NEXT_PUBLIC_NEWS_RADAR_ENDPOINT` para conectar un proxy seguro.

Las señales de X deben ayudar a detectar velocidad y temas emergentes, pero no cuentan como confirmación editorial por sí solas. Deben contrastarse con fuentes primarias y medios independientes.

## Próximos controles

- detección explícita de contradicciones entre cifras;
- listas configurables de fuentes primarias por cobertura;
- reglas por ubicación y sección;
- integración segura con X Recent Search;
- alertas cuando una señal pasa de una a dos o más fuentes;
- registro de qué colaborador convirtió una señal en Noticia Maestra.
