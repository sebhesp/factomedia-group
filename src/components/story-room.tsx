"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  CircleAlert,
  ExternalLink,
  FileText,
  History,
  Link2,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { demoStories } from "@/lib/demo-data";
import type { Story, StoryStatus, VerificationStatus } from "@/lib/types";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, slugify } from "@/lib/utils";
import { getLocalStory, saveLocalStory } from "@/lib/demo-store";
import { useDemoRole } from "@/lib/demo-role";

type RoomTab = "evidence" | "story" | "actions";
type GuideCheck = {
  id: "title" | "summary" | "body" | "sources" | "claims" | "verification";
  label: string;
  done: boolean;
  action: string;
  tab: RoomTab;
};
type AssistantSuggestion = {
  kind: "headline" | "summary" | "claims" | "gaps";
  title: string;
  explanation: string;
  text?: string;
  claims?: string[];
};

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function draftSummary(story: Story) {
  const source = compactText(story.body || story.summary);
  if (!source) return "";
  if (source.length <= 260) return source;
  return `${source.slice(0, 257).replace(/\s+\S*$/, "")}…`;
}

function draftHeadline(story: Story) {
  const source = compactText(story.summary || story.body);
  const firstSentence = source.split(/[.!?]/).find((part) => part.trim().length > 12)?.trim() ?? source;
  const candidate = firstSentence.split(/\s+/).slice(0, 13).join(" ");
  return candidate.length > 86 ? `${candidate.slice(0, 83)}…` : candidate;
}

function extractClaimCandidates(story: Story) {
  const sentences = story.body
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => compactText(sentence))
    .filter((sentence) => sentence.length > 28);
  const factual = sentences.filter((sentence) => /\d|anunc|confirm|inform|señal|registr|ocurri|realiz|present/i.test(sentence));
  return (factual.length ? factual : sentences).slice(0, 3);
}

export function StoryRoom({ storyId }: { storyId: string }) {
  const initial = useMemo(() => demoStories.find((item) => item.id === storyId), [storyId]);
  const [story, setStory] = useState<Story | null>(initial ?? null);
  const [tab, setTab] = useState<RoomTab>("story");
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [claimDraft, setClaimDraft] = useState("");
  const [assistantSuggestion, setAssistantSuggestion] = useState<AssistantSuggestion | null>(null);
  const { role } = useDemoRole();
  const canEditWorkflow = role === "editor" || role === "admin";

  useEffect(() => {
    if (initial) return;
    const timer = window.setTimeout(() => {
      const localStory = getLocalStory(storyId);
      if (localStory) setStory(localStory);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initial, storyId]);

  useEffect(() => {
    if (!story || !dirty) return;
    const timer = window.setTimeout(() => {
      saveLocalStory(story);
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
    }, 850);
    return () => window.clearTimeout(timer);
  }, [story, dirty]);

  const checks = useMemo<GuideCheck[]>(() => {
    if (!story) return [];
    return [
      { id: "title", label: "Título claro", done: story.title.trim().length >= 12, action: "Aclarar el título", tab: "story" },
      { id: "summary", label: "Resumen útil", done: story.summary.trim().length >= 45, action: "Completar el resumen", tab: "story" },
      { id: "body", label: "Contexto suficiente", done: story.body.trim().length >= 120, action: "Agregar contexto", tab: "story" },
      { id: "sources", label: "Al menos una fuente", done: story.sources.length > 0, action: "Agregar una fuente", tab: "evidence" },
      { id: "claims", label: "Afirmaciones separadas", done: story.claims.length > 0, action: "Separar afirmaciones", tab: "story" },
      { id: "verification", label: "Afirmaciones verificadas", done: story.claims.length > 0 && story.claims.every((claim) => claim.status === "supported"), action: "Verificar afirmaciones", tab: "story" },
    ];
  }, [story]);

  const completedChecks = checks.filter((check) => check.done).length;
  const readiness = checks.length ? Math.round((completedChecks / checks.length) * 100) : 0;
  const nextCheck = checks.find((check) => !check.done);
  const canRequestReview = checks.length > 0 && checks.every((check) => check.done);

  function persist(next: Story) {
    setStory(next);
    saveLocalStory(next);
    setDirty(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  function editStory(patch: Partial<Story>) {
    setStory((current) => current ? { ...current, ...patch, updatedAt: new Date().toISOString() } : current);
    setDirty(true);
  }

  function changeStatus(status: StoryStatus, eventType: string) {
    if (!story) return;
    const now = new Date().toISOString();
    persist({
      ...story,
      status,
      updatedAt: now,
      publishedAt: status === "published" ? now : story.publishedAt,
      events: [{ id: crypto.randomUUID(), type: eventType, actor: "Mariana Torres", occurredAt: now }, ...story.events],
    });
  }

  function saveSource() {
    if (!story || !sourceName.trim()) return;
    const now = new Date().toISOString();
    persist({
      ...story,
      sources: [...story.sources, {
        id: crypto.randomUUID(),
        name: sourceName.trim(),
        url: sourceUrl.trim() || undefined,
        type: sourceUrl.trim() ? "link" : "person",
      }],
      updatedAt: now,
      events: [{ id: crypto.randomUUID(), type: "Fuente agregada", actor: "Mariana Torres", occurredAt: now }, ...story.events],
    });
    setSourceName("");
    setSourceUrl("");
    setShowSourceForm(false);
  }

  function saveClaim() {
    if (!story || !claimDraft.trim()) return;
    const now = new Date().toISOString();
    persist({
      ...story,
      claims: [...story.claims, { id: crypto.randomUUID(), text: claimDraft.trim(), status: "pending", sourceIds: [] }],
      updatedAt: now,
      events: [{ id: crypto.randomUUID(), type: "Afirmación creada", actor: "Mariana Torres", occurredAt: now }, ...story.events],
    });
    setClaimDraft("");
    setShowClaimForm(false);
  }

  function requestChanges() {
    if (!story || !canEditWorkflow) return;
    const comment = window.prompt("¿Qué necesita cambiar?");
    if (!comment) return;
    const now = new Date().toISOString();
    persist({ ...story, status: "developing", updatedAt: now, events: [{ id: crypto.randomUUID(), type: "Cambio solicitado", actor: "Elena Ruiz", occurredAt: now, comment }, ...story.events] });
  }

  function registerCorrection() {
    if (!story || !canEditWorkflow) return;
    const correction = window.prompt("Describe la corrección de forma transparente");
    if (!correction) return;
    const now = new Date().toISOString();
    persist({ ...story, status: "corrected", updatedAt: now, corrections: [...story.corrections, correction], events: [{ id: crypto.randomUUID(), type: "Corrección registrada", actor: "Elena Ruiz", occurredAt: now, comment: correction }, ...story.events] });
  }

  function updateClaim(id: string, status: VerificationStatus) {
    if (!story) return;
    persist({ ...story, claims: story.claims.map((claim) => claim.id === id ? { ...claim, status } : claim), updatedAt: new Date().toISOString() });
  }

  function resolveNext() {
    if (!story) return;
    if (!nextCheck) {
      if (story.status === "draft" || story.status === "developing" || story.status === "verification") changeStatus("review", "Revisión solicitada");
      else setTab("actions");
      return;
    }

    setTab(nextCheck.tab);
    if (nextCheck.id === "sources") setShowSourceForm(true);
    if (nextCheck.id === "claims") setShowClaimForm(true);
    if (nextCheck.id === "summary") runAssistant("summary");
    if (nextCheck.id === "title") runAssistant("headline");
    if (nextCheck.id === "verification") setAssistantSuggestion({
      kind: "gaps",
      title: "Revisa las afirmaciones pendientes",
      explanation: "Abre cada afirmación y marca como confirmada únicamente las que tengan respaldo suficiente. La IA no debe decidir esta parte por ti.",
    });
  }

  function runAssistant(kind: AssistantSuggestion["kind"]) {
    if (!story) return;
    setTab(kind === "gaps" ? "actions" : "story");

    if (kind === "summary") {
      const text = draftSummary(story);
      setAssistantSuggestion(text ? {
        kind,
        title: "Resumen sugerido",
        explanation: "Condensa el material disponible. Revisa precisión, contexto y tono antes de usarlo.",
        text,
      } : {
        kind: "gaps",
        title: "Todavía falta material",
        explanation: "Agrega dos o tres oraciones de contexto en el cuerpo para que podamos proponer un resumen útil.",
      });
      return;
    }

    if (kind === "headline") {
      const text = draftHeadline(story);
      setAssistantSuggestion(text ? {
        kind,
        title: "Título sugerido",
        explanation: "Prioriza claridad sobre impacto. Puedes aceptarlo o editarlo directamente.",
        text,
      } : {
        kind: "gaps",
        title: "No hay suficiente contexto",
        explanation: "Escribe primero qué ocurrió; después podremos ayudarte a convertirlo en un título claro.",
      });
      return;
    }

    if (kind === "claims") {
      const claims = extractClaimCandidates(story).filter((candidate) => !story.claims.some((claim) => claim.text === candidate));
      setAssistantSuggestion(claims.length ? {
        kind,
        title: "Posibles afirmaciones verificables",
        explanation: "Son frases que parecen contener hechos. Tú decides cuáles necesitan respaldo y cuáles son contexto.",
        claims,
      } : {
        kind: "gaps",
        title: "No detectamos afirmaciones claras",
        explanation: "Agrega fechas, cifras, declaraciones o hechos concretos al cuerpo de la historia y vuelve a intentarlo.",
      });
      return;
    }

    const missing = checks.filter((check) => !check.done).map((check) => check.label.toLowerCase());
    setAssistantSuggestion({
      kind: "gaps",
      title: missing.length ? "Esto está bloqueando la revisión" : "La historia ya puede enviarse",
      explanation: missing.length ? `Falta: ${missing.join(", ")}. Resuelve primero el elemento superior para avanzar sin dispersarte.` : "Todos los requisitos editoriales básicos están completos. El siguiente paso es solicitar revisión.",
    });
  }

  function acceptAssistantSuggestion() {
    if (!story || !assistantSuggestion) return;
    if (assistantSuggestion.kind === "summary" && assistantSuggestion.text) {
      persist({ ...story, summary: assistantSuggestion.text, updatedAt: new Date().toISOString() });
    }
    if (assistantSuggestion.kind === "headline" && assistantSuggestion.text) {
      persist({ ...story, title: assistantSuggestion.text, slug: slugify(assistantSuggestion.text), updatedAt: new Date().toISOString() });
    }
    if (assistantSuggestion.kind === "claims" && assistantSuggestion.claims) {
      persist({
        ...story,
        claims: [...story.claims, ...assistantSuggestion.claims.map((text) => ({ id: crypto.randomUUID(), text, status: "pending" as const, sourceIds: [] }))],
        updatedAt: new Date().toISOString(),
      });
    }
    setAssistantSuggestion(null);
  }

  if (!story) return <Card><h1>Noticia no encontrada</h1><p>El borrador puede haber sido creado en otro navegador o haberse eliminado.</p><Link href="/desk/noticias/nueva" className="text-link">Crear otra noticia</Link></Card>;

  const workflowMessage = nextCheck
    ? nextCheck.action
    : story.status === "review"
      ? "La historia está esperando revisión editorial"
      : story.status === "approved"
        ? "La historia está aprobada y lista para publicar"
        : story.status === "published"
          ? "La historia está publicada"
          : "Solicitar revisión editorial";

  return (
    <div className="story-room">
      <div className="story-room-header">
        <div>
          <div className="breadcrumb">Mi día / Noticias / {story.demo ? "DEMO" : story.id}</div>
          <h1>{story.title}</h1>
          <div className="story-meta"><StatusBadge status={story.status} /><span>Actualizada {formatDate(story.updatedAt)}</span>{saved && <span className="saved-indicator"><Check size={14} /> Guardado automáticamente</span>}</div>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => persist({ ...story, updatedAt: new Date().toISOString() })}><Save size={16} /> Guardar</Button>
          <Button onClick={resolveNext}>{nextCheck ? nextCheck.action : story.status === "draft" ? "Solicitar revisión" : "Ver siguiente paso"} <ArrowRight size={16} /></Button>
        </div>
      </div>

      <Card className="guide-overview">
        <div className="guide-progress-copy">
          <div>
            <span className="eyebrow">RUTA HACIA REVISIÓN</span>
            <h2>{readiness}% lista</h2>
            <p>No tienes que recordar el proceso. Completa una cosa a la vez.</p>
          </div>
          <div className="readiness-number">{completedChecks}<span>/{checks.length}</span></div>
        </div>
        <div className="guide-progress"><span style={{ width: `${readiness}%` }} /></div>
        <div className="guide-checks">
          {checks.map((check) => (
            <button key={check.id} type="button" className={check.done ? "done" : nextCheck?.id === check.id ? "current" : ""} onClick={() => setTab(check.tab)}>
              {check.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              <span>{check.label}</span>
            </button>
          ))}
        </div>
        <div className="guided-next">
          <div><CircleAlert size={19} /><span><small>SIGUIENTE ACCIÓN</small><strong>{workflowMessage}</strong></span></div>
          {(nextCheck || canRequestReview) && <Button onClick={resolveNext}>{nextCheck ? "Resolver ahora" : "Enviar a revisión"}</Button>}
        </div>
      </Card>

      <div className="room-tabs">
        <button onClick={() => setTab("evidence")} className={tab === "evidence" ? "active" : ""}>Evidencia</button>
        <button onClick={() => setTab("story")} className={tab === "story" ? "active" : ""}>Noticia Maestra</button>
        <button onClick={() => setTab("actions")} className={tab === "actions" ? "active" : ""}>Guía e IA</button>
      </div>

      <div className="room-grid">
        <aside className={tab === "evidence" ? "room-column visible-mobile" : "room-column evidence-column"}>
          <div className="column-heading"><div><span className="eyebrow">01 · EVIDENCIA</span><h2>Material y fuentes</h2></div><button className="icon-button" onClick={() => setShowSourceForm(true)}><Plus size={18} /></button></div>
          <Card className="source-card"><div className="source-icon"><Link2 size={18} /></div><div><strong>{story.sources.length} fuentes registradas</strong><span>{story.sources.length ? "Base documental disponible" : "Empieza por la fuente que originó la historia"}</span></div></Card>

          {showSourceForm && <Card className="inline-editor">
            <span className="eyebrow">NUEVA FUENTE</span>
            <label>Nombre o descripción<Input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Ej. Comunicado de la Secretaría" autoFocus /></label>
            <label>Enlace opcional<Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} type="url" placeholder="https://…" /></label>
            <div><Button variant="ghost" onClick={() => setShowSourceForm(false)}>Cancelar</Button><Button onClick={saveSource} disabled={!sourceName.trim()}>Guardar fuente</Button></div>
          </Card>}

          <div className="source-list">{story.sources.map((source) => <div key={source.id} className="source-row"><FileText size={16} /><div><strong>{source.name}</strong><span>{source.type}{source.url ? " · con enlace" : ""}</span></div></div>)}</div>
          {!showSourceForm && <Button variant="secondary" onClick={() => setShowSourceForm(true)}><Plus size={16} /> Agregar fuente</Button>}
        </aside>

        <section className={tab === "story" ? "room-column story-column visible-mobile" : "room-column story-column"}>
          <div className="column-heading"><div><span className="eyebrow">02 · CONTENIDO</span><h2>Noticia Maestra</h2></div><span className="autosave-copy">Guardado automático</span></div>
          <label>Título<Input value={story.title} onChange={(event) => editStory({ title: event.target.value, slug: slugify(event.target.value) })} /></label>
          <label>Resumen<Textarea rows={4} value={story.summary} onChange={(event) => editStory({ summary: event.target.value })} /></label>
          <label>Cuerpo<Textarea rows={12} value={story.body} onChange={(event) => editStory({ body: event.target.value })} /></label>

          <div className="claims-heading"><div><h3>Afirmaciones verificables</h3><p>Fechas, cifras, declaraciones y hechos que necesitan respaldo.</p></div><Button variant="secondary" onClick={() => setShowClaimForm(true)}><Plus size={16} /> Agregar</Button></div>

          {showClaimForm && <Card className="inline-editor">
            <span className="eyebrow">NUEVA AFIRMACIÓN</span>
            <Textarea value={claimDraft} onChange={(event) => setClaimDraft(event.target.value)} rows={3} placeholder="Escribe un hecho que deba comprobarse…" autoFocus />
            <div><Button variant="ghost" onClick={() => setShowClaimForm(false)}>Cancelar</Button><Button onClick={saveClaim} disabled={!claimDraft.trim()}>Agregar afirmación</Button></div>
          </Card>}

          <div className="claim-list">{story.claims.map((claim, index) => <Card key={claim.id} className="claim-card"><span className="claim-index">{String(index + 1).padStart(2, "0")}</span><p>{claim.text}</p><select className="input compact" value={claim.status} onChange={(event) => updateClaim(claim.id, event.target.value as VerificationStatus)}><option value="pending">Pendiente</option><option value="supported">Confirmada</option><option value="disputed">Disputada</option><option value="false">Falsa</option></select></Card>)}</div>
          {!story.claims.length && !showClaimForm && <div className="empty-guidance"><Sparkles size={20} /><div><strong>¿No sabes qué convertir en afirmación?</strong><p>La IA puede detectar frases que parecen contener hechos verificables.</p><Button variant="secondary" onClick={() => runAssistant("claims")}>Detectar afirmaciones</Button></div></div>}
        </section>

        <aside className={tab === "actions" ? "room-column visible-mobile" : "room-column actions-column"}>
          <div className="column-heading"><div><span className="eyebrow">03 · ACOMPAÑAMIENTO</span><h2>Guía e IA</h2></div></div>

          <Card className="ai-copilot">
            <div className="ai-copilot-heading"><span><Sparkles size={18} /></span><div><strong>Asistente editorial</strong><small>DEMO · revisión humana obligatoria</small></div></div>
            <p>Úsalo para ordenar y detectar faltantes. Nunca verifica fuentes, aprueba ni publica por ti.</p>
            <div className="ai-actions">
              <button onClick={() => runAssistant("headline")}>Proponer título</button>
              <button onClick={() => runAssistant("summary")}>Redactar resumen</button>
              <button onClick={() => runAssistant("claims")}>Extraer afirmaciones</button>
              <button onClick={() => runAssistant("gaps")}>¿Qué me falta?</button>
            </div>
          </Card>

          {assistantSuggestion && <Card className="ai-suggestion">
            <span className="eyebrow">SUGERENCIA · NO APLICADA</span>
            <h3>{assistantSuggestion.title}</h3>
            <p>{assistantSuggestion.explanation}</p>
            {assistantSuggestion.text && <div className="suggestion-content">{assistantSuggestion.text}</div>}
            {assistantSuggestion.claims && <ul>{assistantSuggestion.claims.map((claim) => <li key={claim}>{claim}</li>)}</ul>}
            <div className="suggestion-actions">
              <Button variant="ghost" onClick={() => setAssistantSuggestion(null)}>Descartar</Button>
              {assistantSuggestion.kind !== "gaps" && <Button onClick={acceptAssistantSuggestion}>Aceptar sugerencia</Button>}
            </div>
          </Card>}

          <Card className="next-action-card"><CircleAlert size={20} /><span>Acción recomendada</span><strong>{workflowMessage}</strong>{nextCheck && <Button onClick={resolveNext}>Ir al paso</Button>}</Card>

          <div className="action-stack">
            <Button variant="secondary" disabled={!canRequestReview || story.status === "review"} title={!canRequestReview ? "Completa la ruta de revisión primero" : undefined} onClick={() => changeStatus("review", "Revisión solicitada")}><Send size={16} /> Solicitar revisión</Button>
            <Button variant="secondary" disabled={!canEditWorkflow} title={!canEditWorkflow ? "Cambia al rol Editora para aprobar" : undefined} onClick={() => changeStatus("approved", "Noticia aprobada")}><ShieldCheck size={16} /> Aprobar</Button>
            <Button disabled={!canEditWorkflow || story.status !== "approved"} title={!canEditWorkflow ? "Solo editoras y administradoras pueden publicar" : story.status !== "approved" ? "Primero aprueba la noticia" : undefined} onClick={() => changeStatus("published", "Noticia publicada")}><Check size={16} /> Publicar</Button>
            <Button variant="secondary" disabled={!canEditWorkflow} onClick={requestChanges}>Solicitar cambio</Button>
            {story.publishedAt && <Button variant="secondary" disabled={!canEditWorkflow} onClick={registerCorrection}>Registrar corrección</Button>}
            {story.publishedAt && <Link href={story.id.startsWith("demo-") ? `/noticias/${story.slug}` : `/noticias/borrador-demo?id=${story.id}`} className="button button-secondary"><ExternalLink size={16} /> Abrir vista pública</Link>}
          </div>

          <div className="timeline"><div className="timeline-title"><History size={17} /><strong>Historial editorial</strong></div>{story.events.map((event) => <div className="timeline-row" key={event.id}><span className="timeline-dot" /><div><strong>{event.type}</strong><span>{event.actor} · {formatDate(event.occurredAt)}</span></div></div>)}</div>
        </aside>
      </div>
    </div>
  );
}
