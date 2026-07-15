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
    detail: "Construyendo contexto complementario",
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
          <span className="studio-date">MESA EDITORIAL · {today}</span>
          <h1>Todo lo importante, listo para decidir.</h1>
          <p>Instagram ya alimentó la redacción. Aquí encuentras las piezas que avanzaron, los pendientes reales y la siguiente acción editorial sin ruido alrededor.</p>
        </div>
        <div className="studio-presence" aria-label="Equipo activo">
          <span className="presence-avatars"><i>IR</i><i>PM</i><i>JL</i></span>
          <span><strong>Equipo en línea</strong><small>3 personas trabajando ahora</small></span>
          <Users size={17} />
        </div>
      </section>

      <section className="instagram-engine-kpis" aria-label="Resumen operativo de Instagram">
        <Card><span>PUBLICACIONES CAPTURADAS</span><strong>15</strong><small>contenidos detectados hoy en @elfactonoticias</small></Card>
        <Card><span>NOTAS PREPARADAS</span><strong>12</strong><small>borradores estructurados sin empezar desde cero</small></Card>
        <Card><span>DECISIONES PENDIENTES</span><strong>2</strong><small>piezas que requieren criterio humano</small></Card>
        <Card><span>PUBLICADAS HOY</span><strong>8</strong><small>notas con trazabilidad y registro editorial</small></Card>
      </section>

      <div className="studio-workspace-grid">
        <main className="studio-main-column">
          <section className="continue-section">
            <div className="studio-section-heading">
              <div><span className="eyebrow">MAYOR PRIORIDAD</span><h2>La siguiente decisión editorial</h2></div>
              <span className="quiet-copy">Ordenada por cercanía a publicación e impacto</span>
            </div>

            <Link href="/desk/noticias/sala?id=ig-001" className="priority-story" data-track-event="story_opened" data-track-id="instagram-priority-story" data-track-source="mi_mesa">
              <div className="priority-story-copy">
                <span className="story-category">POLÍTICA · ORIGEN INSTAGRAM</span>
                <h3>Congreso abre discusión sobre reducción de la jornada laboral</h3>
                <p>El video ya fue transcrito y convertido en nota. Solo falta confirmar una cifra antes de enviarla a revisión.</p>
                <div className="priority-action"><CircleAlert size={16} /><span><small>ACCIÓN REQUERIDA</small><strong>Resolver una afirmación pendiente</strong></span></div>
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
              <div><span className="eyebrow">FLUJO EN CURSO</span><h2>Publicaciones que ya están avanzando</h2></div>
              <Link href="/instagram" data-track-event="navigation_used" data-track-id="view-instagram-engine" data-track-destination="instagram">Abrir mesa de Instagram <ArrowRight size={14} /></Link>
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
            <span className="eyebrow">FLUJO PRINCIPAL</span>
            <h2>De publicación a nota, con trazabilidad.</h2>
            <p>El sistema captura el contenido, conserva su origen, estructura la información y entrega una nota preparada para revisión humana.</p>
            <div className="guide-principles">
              <span><CheckCircle2 size={15} /> Autoría y origen preservados</span>
              <span><CheckCircle2 size={15} /> Información lista para copiar</span>
              <span><CheckCircle2 size={15} /> Aprobación editorial obligatoria</span>
            </div>
            <Link href="/instagram" className="button button-primary">Abrir mesa de Instagram <ArrowRight size={15} /></Link>
          </Card>

          <Card className="studio-live-card">
            <div className="live-card-heading"><span><SearchCheck size={17} /> INVESTIGACIÓN</span><i /></div>
            <h3>Contexto solo cuando agrega valor.</h3>
            <p>El Radar encuentra antecedentes, documentos y contradicciones sin repetir la revisión ya realizada.</p>
            <Link href="/buscar-noticia">Abrir Radar <ArrowRight size={15} /></Link>
          </Card>

          <Card className="studio-live-card">
            <div className="live-card-heading"><span><Radio size={17} /> COBERTURA EN VIVO</span><i /></div>
            <h3>Una ruta directa para noticias urgentes.</h3>
            <p>Publica actualizaciones rápidas cuando el acontecimiento no puede esperar al flujo de Instagram.</p>
            <Link href="/redaccion">Abrir cobertura en vivo <ArrowRight size={15} /></Link>
          </Card>

          <div className="studio-day-summary">
            <span>Herramientas complementarias</span>
            <Link href="/desk/noticias/nueva"><FilePlus2 size={14} /> Capturar una noticia manual</Link>
            <Link href="/aprendizajes"><Sparkles size={14} /> Revisar aprendizajes del sistema</Link>
            <p>La captura manual permanece disponible, pero Instagram es el punto de entrada principal.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
