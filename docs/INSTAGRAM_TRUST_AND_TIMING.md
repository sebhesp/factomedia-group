# Instagram confiable y comparación temporal

## Decisión de producto

El contenido publicado en `@elfactonoticias` ya pasó por revisión editorial interna. Por ello, Factomedia lo trata como **origen editorial revisado**, no como una señal externa pendiente de confirmar desde cero.

## Qué puede hacer el sistema sin bloquearse

A partir de un Reel propio puede:

1. importar caption, video, miniatura y hora exacta de publicación;
2. transcribir audio y leer texto visible;
3. conservar presentador, autor y sección;
4. generar título, bajada, cuerpo, imagen y SEO;
5. crear una Nota Maestra lista para revisión final;
6. publicar en la web después de aprobación humana.

## Para qué se consultan otras fuentes

Las fuentes externas no son un requisito universal. Se consultan para:

- ampliar contexto;
- añadir antecedentes;
- encontrar documentos originales;
- detectar cambios posteriores;
- advertir contradicciones;
- medir quién publicó primero;
- comparar el tiempo de reacción de El Facto con otros medios.

## Reloj editorial

Cada historia debe registrar:

- `instagram_published_at`: hora exacta del Reel;
- `detected_at`: hora en que Factomedia lo detectó;
- `draft_ready_at`: hora en que quedó lista la nota;
- `reviewed_at`: hora de revisión humana;
- `web_published_at`: hora de publicación web;
- `first_external_match_at`: primera coincidencia externa localizada;
- `external_median_published_at`: mediana de publicación de medios comparables.

## Métricas

- tiempo Reel → detección;
- tiempo detección → borrador;
- tiempo borrador → aprobación;
- tiempo Reel → nota web;
- diferencia frente al primer medio comparable;
- posición temporal aproximada;
- cantidad de fuentes que aparecieron después;
- número de actualizaciones necesarias.

## Estados sugeridos

- `ORIGIN_REVIEWED`: Reel propio aprobado internamente;
- `CONTEXT_ADDED`: contexto externo añadido;
- `EARLY`: El Facto publicó antes que la mediana detectada;
- `AMONG_FIRST`: estuvo entre las primeras publicaciones localizadas;
- `FOLLOWING`: existían publicaciones anteriores;
- `CONTRADICTION_FOUND`: una fuente posterior contradice un dato material;
- `UPDATE_REQUIRED`: la nota debe actualizarse.

## Reglas de bloqueo

No se bloquea una nota solo porque no existan fuentes externas.

Sí se detiene cuando:

- la IA añade información material ausente del Reel y caption;
- aparece una contradicción relevante;
- hay una acusación, cifra de víctimas o riesgo jurídico;
- el acontecimiento cambia después de publicar;
- la editora solicita corroboración adicional.

## Principio

> Confiar en la revisión ya hecha por El Facto, automatizar la conversión a nota y usar el ecosistema externo para enriquecer, actualizar y medir velocidad, no para duplicar trabajo.
