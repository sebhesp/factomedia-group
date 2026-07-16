"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
} from "lucide-react";

const queue = [
  {
    id: "ig-001",
    category: "POLÍTICA",
    title: "Congreso abre discusión sobre reducción de la jornada laboral",
    detail: "Falta confirmar una cifra",
    status: "review",
  },
  {
    id: "ig-002",
    category: "CIUDAD",
    title: "Servicio provisional en dos estaciones de la Línea 3",
    detail: "Lista para aprobación editorial",
    status: "ready",
  },
  {
    id: "ig-003",
    category: "DERECHOS",
    title: "Qué implica la nueva política de vivienda para las familias",
    detail: "Construyendo contexto complementario",
    status: "processing",
  },
] as const;

const metricExplanations = [
  {
    value: "2",
    label: "Decisiones pendientes",
    detail: "Lo que necesita criterio humano ahora",
  },
  {
    value: "3",
    label: "Listas para revisión",
    detail: "Trabajo que ya puede avanzar hoy",
  },
  {
    value: "8",
    label: "Publicadas hoy",
    detail: "Resultado editorial completado",
  },
] as const;

export function StudioHome() {
  const today = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="clean-dashboard">
      <header className="clean-dashboard-head">
        <span className="clean-dashboard-date">{today}</span>
        <h1>Tu mesa editorial.</h1>
        <p>Solo lo que requiere atención, revisión o publicación.</p>
      </header>

      <section className="clean-metrics" aria-label="Métricas editoriales prioritarias">
        {metricExplanations.map((metric) => (
          <article key={metric.label}>
            <strong>{metric.value}</strong>
            <div>
              <span>{metric.label}</span>
              <small>{metric.detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="clean-priority" aria-labelledby="priority-heading">
        <div className="clean-section-heading">
          <div>
            <span>AHORA</span>
            <h2 id="priority-heading">La siguiente decisión</h2>
          </div>
          <Link href="/instagram">Ver Instagram <ArrowRight size={14} /></Link>
        </div>

        <Link
          href="/desk/noticias/sala?id=ig-001"
          className="clean-priority-card"
          data-track-event="story_opened"
          data-track-id="instagram-priority-story"
          data-track-source="mi_mesa"
        >
          <div>
            <span className="clean-category">POLÍTICA · INSTAGRAM</span>
            <h3>Congreso abre discusión sobre reducción de la jornada laboral</h3>
            <p>La nota está redactada. Solo falta confirmar una cifra antes de enviarla a revisión.</p>
          </div>
          <span className="clean-primary-action">
            <CircleAlert size={15} /> Revisar ahora <ArrowRight size={15} />
          </span>
        </Link>
      </section>

      <section className="clean-queue" aria-labelledby="queue-heading">
        <div className="clean-section-heading">
          <div>
            <span>EN CURSO</span>
            <h2 id="queue-heading">Notas que están avanzando</h2>
          </div>
        </div>

        <div className="clean-queue-list">
          {queue.map((item) => (
            <Link
              href={item.status === "processing" ? "/instagram" : `/desk/noticias/sala?id=${item.id}`}
              key={item.id}
              className="clean-queue-row"
              data-track-event="story_opened"
              data-track-id={`instagram-${item.id}`}
              data-track-source="instagram_queue"
            >
              <span className={`clean-state ${item.status}`} aria-hidden="true">
                {item.status === "ready" ? (
                  <CheckCircle2 size={16} />
                ) : item.status === "review" ? (
                  <CircleAlert size={16} />
                ) : (
                  <Clock3 size={16} />
                )}
              </span>
              <div>
                <span>{item.category}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </div>
              <span className={`clean-status-label ${item.status}`}>
                {item.status === "ready" ? "Lista" : item.status === "review" ? "Revisar" : "Procesando"}
              </span>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
