"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FilePlus2,
  Camera as Instagram,
  Radio,
  SearchCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui";

const queue = [
  {
    id: "ig-001",
    category: "POLÍTICA",
    title: "Congreso abre discusión sobre reducción de la jornada laboral",
    detail: "Nota redactada · una cifra pendiente",
    progress: 86,
    status: "review",
  },
  {
    id: "ig-002",
    category: "CIUDAD",
    title: "Servicio provisional en dos estaciones de la Línea 3",
    detail: "Lista para aprobación editorial",
    progress: 100,
    status: "ready",
  },
  {
    id: "ig-003",
    category: "DERECHOS",
    title: "Qué implica la nueva política de vivienda para las familias",
    detail: "Investigando fuentes complementarias",
    progress: 64,
    status: "processing",
  },
];

export function StudioHome() {
  const today = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <div className="studio-home">
      <section className="studio-welcome">
        <div>
          <span className="studio-date">{today}</span>
          <h1>Instagram ya empezó el trabajo.</h1>
          <p>El Facto Noticias detectó los Reels, avanzó las notas y te muestra únicamente lo que necesita una decisión humana.</p>
        </div>
        <div className="studio-presence" aria-label="Equipo activo">
          <span className="presence-avatars"><i>IR</i><i>PM</i><i>JL</i></span>
          <span><strong>3 personas activas</strong><small>La redacción está conectada</small></span>
          <Users size={17} />
        </div>
      </section>

      <section className="instagram-engine-kpis" aria-label="Resumen de Instagram">
        <Card><span>REELS HOY</span><strong>15</strong><small>detectados en @elfactonoticias</small></Card>
        <Card><span>BORRADORES CREADOS</span><strong>12</strong><small>sin empezar desde cero</small></Card>
        <Card><span>NECESITAN ACCIÓN</span><strong>2</strong><small>revisión o aprobación</small></Card>
        <Card><span>PUBLICADAS</span><strong>8</strong><small>con registro y métricas</small></Card>
      </section>

      <div className="studio-workspace-grid">
        <main className="studio-main-column">
          <section className="continue-section">
            <div className="studio-section-heading">
              <div><span className="eyebrow">TU ÚNICA PRIORIDAD</span><h2>Una decisión a la vez</h2></div>
              <span className="quiet-copy">La plataforma prioriza lo más cercano a publicación</span>
            </div>

            <Link href="/desk/noticias/sala?id=ig-001" className="priority-story" data-track-event="story_opened" data-track-id="instagram-priority-story" data-track-source="mi_mesa">
              <div className="priority-story-copy">
                <span className="story-category">POLÍTICA · DESDE INSTAGRAM</span>
                <h3>Congreso abre discusión sobre reducción de la jornada laboral</h3>
                <p>El video ya fue transcrito y convertido en nota. Solo falta confirmar una cifra antes de enviarla a revisión.</p>
                <div className="priority-action"><CircleAlert size={16} /><span><small>SIGUIENTE ACCIÓN</small><strong>Resolver una afirmación pendiente</strong></span></div>
              </div>
              <div className="priority-progress">
                <div className="progress-orbit" style={{ background: "conic-gradient(var(--accent) 86%, #e4e5df 0)" }}><span>86%</span></div>
                <span className="instagram-stage warning"><CircleAlert size={14} /> REVISAR</span>
                <span>Continuar <ArrowRight size={15} /></span>
              </div>
            </Link>
          </section>

          <section className="active-work-section">
            <div className="studio-section-heading">
              <div><span className="eyebrow">PIPELINE AUTOMÁTICO</span><h2>Qué está haciendo El Facto Noticias</h2></div>
              <Link href="/instagram" data-track-event="navigation_used" data-track-id="view-instagram-engine" data-track-destination="instagram">Ver todos los Reels <ArrowRight size={14} /></Link>
            </div>
            <div className="studio-story-list">
              {queue.map((item) => (
                <Link href={item.status === "processing" ? "/instagram" : `/desk/noticias/sala?id=${item.id}`} className="studio-story-row" key={item.id} data-track-event="story_opened" data-track-id={`instagram-${item.id}`} data-track-source="instagram_queue">
                  <span className={`story-state-icon ${item.status === "ready" ? "success" : item.status === "review" ? "warning" : "neutral"}`}>
                    {item.status === "ready" ? <CheckCircle2 size={17} /> : item.status === "review" ? <CircleAlert size={17} /> : <Clock3 size={17} />}
                  </span>
                  <div><span>{item.category}</span><strong>{item.title}</strong><small>{item.detail}</small></div>
                  <div className="story-readiness"><span>{item.progress}%</span><i><b style={{ width: `${item.progress}%` }} /></i></div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          </section>
        </main>

        <aside className="studio-side-column">
          <Card className="studio-guide-card">
            <div className="guide-card-icon"><Instagram size={19} /></div>
            <span className="eyebrow">MOTOR PRINCIPAL</span>
            <h2>Un Reel se convierte en Nota Maestra.</h2>
            <p>El sistema importa caption y video, transcribe, estructura, busca contexto y deja una nota lista para revisión.</p>
            <div className="guide-principles">
              <span><CheckCircle2 size={15} /> Autoría y origen preservados</span>
              <span><CheckCircle2 size={15} /> Fuentes y pendientes visibles</span>
              <span><CheckCircle2 size={15} /> Aprobación humana obligatoria</span>
            </div>
            <Link href="/instagram" className="button button-primary">Abrir Instagram Engine <ArrowRight size={15} /></Link>
          </Card>

          <Card className="studio-live-card">
            <div className="live-card-heading"><span><SearchCheck size={17} /> INVESTIGACIÓN</span><i /></div>
            <h3>Busca únicamente cuando haga falta.</h3>
            <p>El Radar complementa la transcripción con fuentes y contexto; no reemplaza la evidencia editorial.</p>
            <Link href="/buscar-noticia">Abrir Radar <ArrowRight size={15} /></Link>
          </Card>

          <Card className="studio-live-card">
            <div className="live-card-heading"><span><Radio size={17} /> COBERTURA EN VIVO</span><i /></div>
            <h3>Las noticias urgentes siguen teniendo una ruta propia.</h3>
            <p>Ahora permite publicar actualizaciones rápidas sin esperar a un Reel.</p>
            <Link href="/redaccion">Abrir redacción en vivo <ArrowRight size={15} /></Link>
          </Card>

          <div className="studio-day-summary">
            <span>Acciones secundarias</span>
            <Link href="/desk/noticias/nueva"><FilePlus2 size={14} /> Crear una noticia manual</Link>
            <Link href="/aprendizajes"><Sparkles size={14} /> Revisar aprendizajes del sistema</Link>
            <p>La captura manual existe, pero ya no es el punto de entrada principal.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
