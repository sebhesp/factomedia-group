"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  FlaskConical,
  Gauge,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui";
import {
  buildProductInsights,
  listProductEvents,
  listProductFeedback,
  type ProductEvent,
  type ProductFeedback,
  type ProductInsight,
} from "@/lib/product-intelligence";

function percentage(value: number, total: number) {
  if (!total) return "—";
  return `${Math.round((value / total) * 100)}%`;
}

function count(events: ProductEvent[], name: ProductEvent["name"]) {
  return events.filter((event) => event.name === name).length;
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function severityIcon(severity: ProductInsight["severity"]) {
  if (severity === "critical") return CircleAlert;
  if (severity === "attention") return Activity;
  return Sparkles;
}

export function LearningCenter() {
  const [events, setEvents] = useState<ProductEvent[]>([]);
  const [feedback, setFeedback] = useState<ProductFeedback[]>([]);

  useEffect(() => {
    function refresh() {
      setEvents(listProductEvents());
      setFeedback(listProductFeedback());
    }
    refresh();
    window.addEventListener("el-facto-noticias:product-event", refresh);
    window.addEventListener("el-facto-noticias:feedback-submitted", refresh);
    return () => {
      window.removeEventListener("el-facto-noticias:product-event", refresh);
      window.removeEventListener("el-facto-noticias:feedback-submitted", refresh);
    };
  }, []);

  const metrics = useMemo(() => {
    const sessions = new Set(events.map((event) => event.sessionId)).size;
    const capturesStarted = count(events, "capture_started");
    const capturesCompleted = count(events, "capture_completed");
    const radarSearches = count(events, "radar_search_completed");
    const radarStories = count(events, "radar_story_created");
    const aiShown = count(events, "ai_suggestion_shown");
    const aiAccepted = count(events, "ai_suggestion_accepted");
    const feedbackScores = feedback.map((item) => item.score);
    const averageFeedback = average(feedbackScores);
    return {
      sessions,
      capturesStarted,
      capturesCompleted,
      radarSearches,
      radarStories,
      aiShown,
      aiAccepted,
      friction: count(events, "friction_detected"),
      errors: count(events, "app_error"),
      averageFeedback,
    };
  }, [events, feedback]);

  const insights = useMemo(() => buildProductInsights(events, feedback), [events, feedback]);
  const recentEvents = useMemo(() => [...events].slice(-12).reverse(), [events]);

  return (
    <div className="learning-center">
      <header className="learning-header">
        <div>
          <Link href="/mi-dia" className="radar-back"><ArrowLeft size={15} /> Volver a Mi mesa</Link>
          <span className="eyebrow">INTELIGENCIA DE PRODUCTO</span>
          <h1>Aprendizajes</h1>
          <p>Convierte cada interacción, bloqueo, experimento y comentario en decisiones concretas para mejorar El Facto Noticias.</p>
        </div>
        <div className="learning-guardrail"><ShieldCheck size={20} /><span><strong>Aprender no significa cambiar a ciegas.</strong><small>Las recomendaciones requieren evidencia, revisión humana y métricas de protección.</small></span></div>
      </header>

      <section className="learning-kpis">
        <Card><span><Gauge size={17} /> ACTIVACIÓN</span><strong>{percentage(metrics.capturesCompleted, metrics.capturesStarted)}</strong><small>capturas terminadas de las iniciadas</small></Card>
        <Card><span><TrendingUp size={17} /> RADAR → HISTORIA</span><strong>{percentage(metrics.radarStories, metrics.radarSearches)}</strong><small>Noticias Maestras por búsqueda</small></Card>
        <Card><span><BrainCircuit size={17} /> IA ÚTIL</span><strong>{percentage(metrics.aiAccepted, metrics.aiShown)}</strong><small>sugerencias aceptadas</small></Card>
        <Card><span><MessageSquareText size={17} /> CLARIDAD</span><strong>{metrics.averageFeedback ? metrics.averageFeedback.toFixed(1) : "—"}</strong><small>promedio de feedback sobre 5</small></Card>
      </section>

      <div className="learning-grid">
        <main>
          <section className="learning-section">
            <div className="learning-section-heading"><div><span className="eyebrow">RECOMENDACIONES</span><h2>Qué conviene mejorar ahora</h2></div><span>{insights.length} hallazgos activos</span></div>
            <div className="insight-list">
              {insights.map((insight) => {
                const Icon = severityIcon(insight.severity);
                return (
                  <Card key={insight.id} className={`learning-insight ${insight.severity}`}>
                    <div className="learning-insight-icon"><Icon size={18} /></div>
                    <div><span>{insight.evidence}</span><h3>{insight.title}</h3><p>{insight.explanation}</p><strong>Siguiente decisión: {insight.recommendedAction}</strong></div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="learning-section">
            <div className="learning-section-heading"><div><span className="eyebrow">SEÑALES RECIENTES</span><h2>Qué está ocurriendo en el producto</h2></div><span>Sin contenido editorial</span></div>
            <Card className="event-stream">
              {recentEvents.length ? recentEvents.map((event) => (
                <div key={event.id}><span className="event-dot" /><div><strong>{event.name.replaceAll("_", " ")}</strong><small>{event.path} · {new Date(event.occurredAt).toLocaleString("es-MX")}</small></div></div>
              )) : <div className="learning-empty"><Activity size={27} /><strong>Todavía no hay suficientes eventos.</strong><small>La instrumentación ya está activa y empezará a construir una línea base.</small></div>}
            </Card>
          </section>
        </main>

        <aside className="learning-side">
          <Card className="learning-loop-card">
            <div className="learning-loop-icon"><BrainCircuit size={20} /></div>
            <span className="eyebrow">CICLO DE APRENDIZAJE</span>
            <h2>Observar → entender → probar → medir.</h2>
            <ol><li><b>1</b><span>Detectar una fricción real.</span></li><li><b>2</b><span>Formular una hipótesis concreta.</span></li><li><b>3</b><span>Probar el cambio con una parte del equipo.</span></li><li><b>4</b><span>Adoptarlo solo si mejora el resultado sin dañar calidad.</span></li></ol>
          </Card>

          <Card className="experiment-card">
            <span><FlaskConical size={17} /> EXPERIMENTOS</span>
            <h3>Próximo experimento sugerido</h3>
            <p>Comparar “Buscar noticia” en la barra superior contra una tarjeta contextual dentro de Mi mesa.</p>
            <div><small>ÉXITO</small><strong>Más historias relevantes creadas</strong></div>
            <div><small>GUARDRAIL</small><strong>Sin aumentar noticias descartadas</strong></div>
          </Card>

          <Card className="learning-health-card">
            <span><CheckCircle2 size={17} /> SALUD DE MEDICIÓN</span>
            <dl><div><dt>Sesiones</dt><dd>{metrics.sessions}</dd></div><div><dt>Eventos</dt><dd>{events.length}</dd></div><div><dt>Feedback</dt><dd>{feedback.length}</dd></div><div><dt>Errores</dt><dd>{metrics.errors}</dd></div><div><dt>Fricciones</dt><dd>{metrics.friction}</dd></div></dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
