# Instagram: carga inicial y sincronización continua

## Regla operativa

La integración trabaja en dos etapas:

1. **Carga inicial:** en la primera conexión importa los posts publicados durante los últimos 7 días corridos.
2. **Sincronización continua:** después de esa primera carga, cada ejecución consulta únicamente publicaciones nuevas, con un margen breve de solapamiento para evitar omisiones.

La carga de siete días no se repite en cada ciclo automático.

## Comportamiento esperado

### Primera ejecución

- no existe `last_synced_at` para la cuenta;
- la función entra en modo `initial_backfill`;
- consulta hasta cubrir 7 días;
- crea un registro y trabajo editorial por cada post nuevo;
- guarda la hora de sincronización.

### Ejecuciones posteriores

- existe `last_synced_at`;
- la función entra en modo `incremental`;
- usa como referencia la publicación más reciente almacenada y la última sincronización;
- aplica un margen de 10 minutos;
- se detiene al llegar a contenido anterior a esa referencia;
- los posts ya existentes solo se refrescan.

## Frecuencia

El orquestador `instagram-pipeline-tick` debe ejecutarse cada 2 minutos. Esto ofrece una operación casi en vivo sin depender de que una persona abra la plataforma.

## Reimportación manual

Una carga histórica puede forzarse enviando:

```json
{
  "mode": "backfill",
  "backfill_days": 7
}
```

Esta opción es administrativa y no forma parte del ciclo normal.

## Principio de seguridad

El sistema identifica cada post mediante `instagram_media_id`. Repetir una sincronización no debe crear publicaciones, notas ni trabajos duplicados.
