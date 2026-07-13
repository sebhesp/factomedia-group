"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Link2,
  Mic2,
  Paperclip,
  Radio,
  Sparkles,
  Type,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { currentUser, demoStories } from "@/lib/demo-data";
import { saveLocalStory } from "@/lib/demo-store";
import type { Story } from "@/lib/types";
import { slugify } from "@/lib/utils";

const captureModes = [
  { id: "text", label: "Escribir", icon: Type },
  { id: "link", label: "Pegar enlace", icon: Link2 },
  { id: "note", label: "Nota de voz", icon: Mic2 },
  { id: "file", label: "Adjuntar", icon: Paperclip },
] as const;

type CaptureMode = (typeof captureModes)[number]["id"];

function nextAction(story: Story) {
  if (!story.sources.length) return { label: "Agregar la fuente principal", reason: "La historia todavía no tiene evidencia registrada.", tone: "warning" };
  if (!story.claims.length) return { label: "Separar afirmaciones", reason: "Identifica los datos que deberán comprobarse.", tone: "warning" };
  if (story.claims.some((claim) => claim.status === "pending")) return { label: "Confirmar una afirmación", reason: "Hay información pendiente antes de la revisión.", tone: "warning" };
  if (story.status === "review") return { label: "Esperando revisión", reason: "La editora ya tiene esta historia en su mesa.", tone: "neutral" };
  return { label: "Solicitar revisión", reason: "La base editorial está completa.", tone: "success" };
}

function readiness(story: Story) {
  const checks = [
    story.title.trim().length >= 8,
    story.summary.trim().length >= 25,
    story.body.trim().length >= 80,
    story.sources.length > 0,
    story.claims.length > 0,
    story.claims.length > 0 && story.claims.every((claim) => claim.status !== "pending"),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function titleFromCapture(value: string) {
  const first = value.split(/[.!?\n]/).find((part) => part.trim().length > 12)?.trim() ?? value.trim();
  const compact = first.split(/\s+/).slice(0, 12).join(" ");
  return compact.length > 82 ? `${compact.slice(0, 79)}…` : compact.replace(/^./, (letter) => letter.toUpperCase());
}

function summaryFromCapture(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length <= 220 ? compact : `${compact.slice(0, 217).replace(/\s+\S*$/, "")}…`;
}

function categoryFromCapture(value: string) {
  const text = value.toLowerCase();
  if (/música|artista|festival|concierto|álbum/.test(text)) return "Música";
  if (/gobierno|congreso|president|elección|política/.test(text)) return "Política";
  if (/tecnología|software|aplicación|inteligencia artificial|digital/.test(text)) return "Tecnología";
  if (/economía|precio|mercado|empresa|empleo/.test(text)) return "Economía";
  if (/museo|cine|libro|cultura|exposición/.test(text)) return "Cultura";
  return "Ciudad";
}

export function StudioHome() {
  const router = useRouter();
  const [capture, setCapture] = useState("");
  const [mode, setMode] = useState<CaptureMode>("text");
  const activeStories = useMemo(() => demoStories.filter((story) => story.status !== "published"), []);
  const priority = activeStories[0];
  const today = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  function beginCapture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = capture.trim();
    if (!value) {
      router.push("/desk/noticias/nueva");
      return;
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const title = titleFromCapture(value) || "Nueva historia";
    const story: Story = {
      id,
      slug: slugify(title),
      title,
      summary: summaryFromCapture(value),
      body: value,
      category: categoryFromCapture(value),
      status: "draft",
      author: "Mariana Torres",
      responsible: "Mariana Torres",
      sources: [],
      claims: [],
      createdAt: now,
      updatedAt: now,
      corrections: [],
      events: [{ id: crypto.randomUUID(), type: "Captura universal creada", actor: "Mariana Torres", occurredAt: now, comment: `Entrada rápida desde ${mode}` }],
      metrics: { views: 0, readsStarted: 0, readsCompleted: 0, shares: 0 },
      demo: true,
    };

    saveLocalStory(story);
    router.push(`/desk/noticias/sala?id=${id}`);
  }

  return (
    <div className="studio-home">
      <section className="studio-welcome">
        <div>
          <span className="studio-date">{today}</span>
          <h1>Hola, {currentUser.name}.</h1>
          <p>Continúa lo importante o captura una señal nueva. Factomedia te mostrará el siguiente paso.</p>
        </div>
        <div className="studio-presence" aria-label="Equipo activo">
          <span className="presence-avatars"><i>MT</i><i>ER</i><i>DS</i></span>
          <span><strong>3 personas activas</strong><small>La redacción está conectada</small></span>
          <Users size={17} />
        </div>
      </section>

      <form className="universal-capture" onSubmit={beginCapture}>
        <div className="capture-heading">
          <span><Sparkles size={17} /> CAPTURA UNIVERSAL</span>
          <small>No necesitas ordenar nada antes de empezar</small>
        </div>
        <textarea
          value={capture}
          onChange={(event) => setCapture(event.target.value)}
          placeholder="¿Qué está pasando? Escribe, pega un enlace o deja una nota para investigar…"
          rows={4}
          aria-label="Material inicial para una noticia"
        />
        <div className="capture-footer">
          <div className="capture-modes">
            {captureModes.map(({ id, label, icon: Icon }) => (
              <button type="button" key={id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <button type="submit" className="capture-submit">
            {capture.trim() ? "Organizar material" : "Abrir espacio nuevo"} <ArrowRight size={17} />
          </button>
        </div>
      </form>

      <div className="studio-workspace-grid">
        <main className="studio-main-column">
          {priority && (
            <section className="continue-section">
              <div className="studio-section-heading">
                <div><span className="eyebrow">CONTINÚA DONDE TE QUEDASTE</span><h2>Una cosa a la vez</h2></div>
                <span className="quiet-copy">Ordenado por lo que desbloquea más trabajo</span>
              </div>

              <Link href={`/desk/noticias/sala?id=${priority.id}`} className="priority-story">
                <div className="priority-story-copy">
                  <span className="story-category">{priority.category}</span>
                  <h3>{priority.title}</h3>
                  <p>{nextAction(priority).reason}</p>
                  <div className="priority-action"><CircleAlert size={16} /><span><small>SIGUIENTE ACCIÓN</small><strong>{nextAction(priority).label}</strong></span></div>
                </div>
                <div className="priority-progress">
                  <div className="progress-orbit" style={{ background: `conic-gradient(var(--accent) ${readiness(priority)}%, #e4e5df 0)` }}><span>{readiness(priority)}%</span></div>
                  <StatusBadge status={priority.status} />
                  <span>Continuar <ArrowRight size={15} /></span>
                </div>
              </Link>
            </section>
          )}

          <section className="active-work-section">
            <div className="studio-section-heading">
              <div><span className="eyebrow">TU TRABAJO ACTIVO</span><h2>Historias en movimiento</h2></div>
              <Link href="/redaccion">Ver toda la redacción <ArrowRight size={14} /></Link>
            </div>
            <div className="studio-story-list">
              {activeStories.slice(1).map((story) => {
                const action = nextAction(story);
                return (
                  <Link href={`/desk/noticias/sala?id=${story.id}`} className="studio-story-row" key={story.id}>
                    <span className={`story-state-icon ${action.tone}`}>
                      {action.tone === "success" ? <CheckCircle2 size={17} /> : action.tone === "neutral" ? <Clock3 size={17} /> : <CircleAlert size={17} />}
                    </span>
                    <div><span>{story.category}</span><strong>{story.title}</strong><small>{action.label}</small></div>
                    <div className="story-readiness"><span>{readiness(story)}%</span><i><b style={{ width: `${readiness(story)}%` }} /></i></div>
                    <ArrowRight size={17} />
                  </Link>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="studio-side-column">
          <Card className="studio-guide-card">
            <div className="guide-card-icon"><Sparkles size={19} /></div>
            <span className="eyebrow">ACOMPAÑAMIENTO</span>
            <h2>No tienes que recordar el proceso.</h2>
            <p>La plataforma detecta qué falta, abre la herramienta correcta y conserva todo lo que ya avanzaste.</p>
            <div className="guide-principles">
              <span><CheckCircle2 size={15} /> Una siguiente acción visible</span>
              <span><CheckCircle2 size={15} /> Ayuda de IA revisable</span>
              <span><CheckCircle2 size={15} /> Guardado y trazabilidad</span>
            </div>
          </Card>

          <Card className="studio-live-card">
            <div className="live-card-heading"><span><Radio size={17} /> AHORA</span><i /></div>
            <h3>La cobertura en vivo está lista.</h3>
            <p>Convierte una señal en un acontecimiento verificable y prepara actualizaciones para X desde un solo núcleo.</p>
            <Link href="/redaccion">Abrir redacción en vivo <ArrowRight size={15} /></Link>
          </Card>

          <div className="studio-day-summary">
            <span>Tu ritmo de hoy</span>
            <div><strong>{currentUser.completed}</strong><small>historias avanzaron</small></div>
            <div><strong>1</strong><small>espera una decisión</small></div>
            <p>Estas cifras describen el flujo; no son un ranking personal.</p>
          </div>
        </aside>
      </div>

      <footer className="studio-shortcuts">
        <span><kbd>⌘</kbd><kbd>K</kbd> buscar o ejecutar</span>
        <span><FileText size={14} /> Todo cambio queda guardado</span>
      </footer>
    </div>
  );
}
