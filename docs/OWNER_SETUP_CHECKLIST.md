# Checklist del propietario — llevar El Facto Noticias a producción

Esta lista indica qué debe resolver Sebastián/El Facto y qué debe quedar implementado antes de considerar el producto listo.

## 0. Decisiones que deben confirmarse por escrito

- [ ] Instagram será el origen principal del MVP.
- [ ] Ninguna nota se publica sin aprobación humana.
- [ ] Confirmar si «Valen» corresponde a Nadia Valentina Báez Patiño.
- [ ] Confirmar quién puede aprobar y publicar.
- [ ] Confirmar si las columnas se incluyen en el MVP o quedan para fase 2.
- [ ] Confirmar el CMS de la página pública y quién administra sus credenciales.
- [ ] Confirmar la política de imágenes: frame del Reel, biblioteca propia, agencia o búsqueda externa.

## 1. Meta e Instagram

Responsable: propietario de las cuentas de El Facto.

- [ ] Verificar que @elfactonoticias sea una cuenta profesional.
- [ ] Identificar el Business Portfolio de Meta que posee o administra la cuenta.
- [ ] Crear una aplicación en Meta for Developers con una cuenta corporativa, no personal temporal.
- [ ] Añadir a las personas técnicas mediante roles; nunca compartir contraseñas.
- [ ] Configurar URL de privacidad, términos, eliminación de datos y dominio verificado.
- [ ] Completar verificación empresarial si Meta la solicita.
- [ ] Crear una cuenta de prueba o entorno controlado para no probar con producción.
- [ ] Preparar el proceso de App Review para permisos de lectura de media e insights.
- [ ] Definir quién renovará y auditará tokens.

Entregables necesarios:

- ID de la aplicación de Meta.
- ID de la cuenta profesional de Instagram.
- Business Portfolio asociado.
- Usuario técnico con permisos suficientes.
- Cuenta de prueba.

No enviar por WhatsApp ni pegar en documentos:

- App Secret;
- access tokens;
- contraseñas;
- códigos de recuperación.

Todo secreto se guarda directamente en el gestor de variables del proyecto.

## 2. Web y CMS

- [ ] Confirmar dominio definitivo.
- [ ] Confirmar CMS: WordPress, headless, desarrollo propio u otro.
- [ ] Entregar acceso de desarrollo o API con permisos limitados.
- [ ] Definir estructura de URL para notas.
- [ ] Definir categorías y etiquetas.
- [ ] Definir autoría y páginas de autor.
- [ ] Definir campos de SEO y Open Graph.
- [ ] Definir estado de borrador, revisión y publicación.
- [ ] Crear un entorno staging separado del sitio público.

## 3. Cuentas técnicas que debe abrir el propietario

### Obligatorias

- [ ] GitHub Organization o repositorio corporativo.
- [ ] Vercel Pro o plataforma equivalente para frontend.
- [ ] Supabase Pro para Auth, PostgreSQL y Storage.
- [ ] OpenAI Platform con billing y límites mensuales.
- [ ] Google Cloud/AI Studio con billing para comprensión visual de video.
- [ ] Servicio de workers: Railway, Render, Fly.io, Cloud Run o equivalente.
- [ ] Sentry para errores y trazabilidad técnica.

### Recomendadas

- [ ] Cloudflare para DNS, protección y almacenamiento/R2 si conviene.
- [ ] Resend/Postmark para notificaciones del sistema.
- [ ] 1Password Business o gestor equivalente para secretos.

Las cuentas deben pertenecer a El Facto o a la entidad que contrata el proyecto. El desarrollador recibe acceso por rol; no debe ser propietario único de infraestructura crítica.

## 4. Material real para entrenar y evaluar el flujo

Entregar una carpeta controlada con:

- [ ] 30 Reels representativos.
- [ ] Caption original de cada Reel.
- [ ] Nota final esperada, cuando exista.
- [ ] Nombre correcto del presentador.
- [ ] Fuentes usadas.
- [ ] Imagen final usada o criterio de selección.
- [ ] Correcciones hechas por una editora.
- [ ] 5 casos difíciles: ruido, múltiples voces, texto en pantalla, ironía, declaración no corroborada.
- [ ] 5 casos de desinformación o verificación.
- [ ] 3 columnas por autor que se quiera modelar en fase posterior.

Este conjunto será el benchmark interno. No se debe optimizar el sistema únicamente con ejemplos «fáciles».

## 5. Reglas editoriales que debe entregar El Facto

- [ ] Manual de estilo existente.
- [ ] Lista de fuentes preferidas.
- [ ] Lista de fuentes prohibidas o de baja confianza.
- [ ] Reglas para «última hora».
- [ ] Número mínimo de fuentes por tipo de nota.
- [ ] Política de correcciones.
- [ ] Política de uso de imágenes y créditos.
- [ ] Reglas jurídicas para acusaciones, menores, víctimas y datos personales.
- [ ] Palabras, etiquetas y enfoques que requieren revisión jurídica.
- [ ] Longitud objetivo de una nota.
- [ ] Ejemplos de titulares aprobados y rechazados.

## 6. Proveedores de IA del MVP

### OpenAI API

Uso inicial:

- transcripción;
- extracción estructurada;
- generación de borrador;
- comparación entre transcripción y nota;
- clasificación de afirmaciones;
- embeddings o recuperación editorial, si se necesita.

No basta con ChatGPT Plus. La aplicación necesita una cuenta de API con billing independiente.

### Gemini API

Uso selectivo:

- comprender escenas relevantes;
- leer texto visual complejo;
- identificar elementos del video que no están en el audio;
- comparar caption, escena y transcripción.

No se procesará visualmente el video completo en todos los casos. Primero se decide si aporta información editorial.

### Claude

No es dependencia de producción para el MVP. Puede utilizarse para desarrollo, revisión de prompts y evaluación comparativa.

## 7. Costos mensuales aproximados

Supuesto inicial:

- 15 Reels diarios;
- 450 Reels mensuales;
- duración promedio de 60–90 segundos;
- una sola cuenta de Instagram;
- 5–10 colaboradores;
- revisión humana antes de publicar.

### Infraestructura beta

- Vercel Pro: USD 20–50.
- Supabase Pro: desde aproximadamente USD 25, más uso.
- Worker de video/audio: USD 15–80.
- Storage y transferencia: USD 5–40.
- Monitoreo y correo: USD 0–30.

### IA beta

- Transcripción: aproximadamente USD 5–20 al mes para ese volumen, dependiendo del modelo y duración.
- Redacción y extracción: USD 15–80.
- Comprensión visual selectiva: USD 5–40.
- Investigación o grounding: USD 0–100, según frecuencia y proveedor.

### Total operativo estimado

- Beta controlada: USD 85–300 al mes.
- Producción inicial con mayor observabilidad y volumen: USD 200–700 al mes.

No incluye:

- desarrollo;
- diseño;
- soporte;
- compra o licencia de fotografías;
- servicios de agencia de noticias;
- costos del CMS existente;
- impuestos.

Se configurarán topes de gasto, alertas y presupuesto por Reel antes de producción.

## 8. Tiempo de implementación

Con accesos y decisiones disponibles a tiempo:

- Semana 1: definición, Meta, CMS y benchmark.
- Semanas 2–3: ingestión de Reels, almacenamiento y estados.
- Semanas 4–5: transcripción, IA y Nota Maestra.
- Semana 6: revisión, imagen, SEO y publicación en staging.
- Semana 7: métricas, aprendizaje, seguridad y observabilidad.
- Semana 8: beta con 50 Reels.
- Semanas 9–10: correcciones de beta y salida controlada.

Riesgos que pueden extender el calendario:

- App Review de Meta;
- falta de acceso al CMS;
- cambios constantes de alcance;
- ausencia de ejemplos editoriales corregidos;
- permisos insuficientes;
- decisiones jurídicas o de imágenes sin resolver.

## 9. Definición de «listo»

El MVP está listo cuando:

- [ ] detecta nuevos Reels sin duplicarlos;
- [ ] conserva caption, video, miniatura y permalink;
- [ ] transcribe con calidad aceptable;
- [ ] señala segmentos de baja confianza;
- [ ] propone autor sin reconocimiento facial;
- [ ] genera una Nota Maestra estructurada;
- [ ] vincula cada afirmación con su origen;
- [ ] impide publicación con bloqueos críticos;
- [ ] permite aprobar y publicar en staging;
- [ ] registra versiones y correcciones;
- [ ] muestra costo, duración y errores por Reel;
- [ ] tiene respaldo, alertas y recuperación de fallos;
- [ ] supera la evaluación de 50 Reels reales.

## 10. Primera reunión de arranque

Duración: 60 minutos.

Asistentes mínimos:

- Sebastián / producto;
- jefa o responsable final;
- Ilse o responsable de información;
- responsable de Instagram;
- responsable de CMS/web;
- desarrollo.

Decisiones que deben salir de esa reunión:

1. cuenta y propiedad de infraestructura;
2. flujo actual de publicación;
3. aprobadores;
4. CMS;
5. autores;
6. imagen;
7. fuentes;
8. fecha objetivo de beta;
9. presupuesto mensual máximo;
10. responsable de entregar los 30 Reels de benchmark.
