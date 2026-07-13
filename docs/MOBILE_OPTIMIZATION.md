# Factomedia Studio — optimización móvil

## Objetivo

La experiencia móvil debe permitir capturar, verificar, revisar y distribuir una noticia sin necesitar la versión de escritorio ni perder funciones esenciales.

## Criterios implementados

- viewport con `viewport-fit=cover` y respeto de safe areas;
- navegación inferior de cinco destinos con acción central de captura;
- menú Más para Distribución, Aprendizajes, Portada y cambio de rol;
- controles táctiles de 44–48 px;
- inputs de 16 px para evitar zoom automático en iOS;
- paneles inferiores para comandos, navegación secundaria y feedback;
- soporte desde 320 px, orientación horizontal y pantallas con notch;
- jerarquía tipográfica y tarjetas reacomodadas sin scroll horizontal;
- filtros del Radar con desplazamiento horizontal controlado;
- fuentes y acciones del Radar adaptadas a una mano;
- KPIs y recomendaciones de Aprendizajes reordenados por prioridad;
- feedback elevado sobre la navegación inferior;
- reducción de movimiento cuando el sistema lo solicita;
- foco visible y cierre por Escape en paneles modales.

## Rutas críticas

- `/mi-dia/`
- `/buscar-noticia/`
- `/desk/noticias/nueva/`
- `/desk/noticias/sala/`
- `/redaccion/`
- `/distribucion/`
- `/aprendizajes/`

## Pruebas mínimas

Validar en anchos de 320, 360, 390, 430, 768 y 1024 px:

1. No existe scroll horizontal.
2. La navegación no tapa acciones ni contenido.
3. El teclado virtual no oculta el campo activo.
4. Las acciones principales pueden pulsarse con una mano.
5. Los paneles respetan safe areas y se pueden cerrar.
6. Los textos principales no se truncan de forma irreversible.
7. Captura, Radar, creación de historia y feedback conservan su estado.
8. La experiencia funciona con orientación horizontal y movimiento reducido.
