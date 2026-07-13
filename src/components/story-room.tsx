"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, ExternalLink, FileText, History, Link2, Plus, Save, Send, ShieldCheck } from "lucide-react";
import { demoStories } from "@/lib/demo-data";
import type { Story, StoryStatus, VerificationStatus } from "@/lib/types";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { getLocalStory, saveLocalStory } from "@/lib/demo-store";
import { useDemoRole } from "@/lib/demo-role";

export function StoryRoom({ storyId }: { storyId: string }) {
  const initial = useMemo(() => demoStories.find((item) => item.id === storyId), [storyId]);
  const [story, setStory] = useState<Story | null>(initial ?? null);
  const [tab, setTab] = useState<"evidence" | "story" | "actions">("story");
  const [saved, setSaved] = useState(false);
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

  function persist(next: Story) {
    setStory(next); saveLocalStory(next);
    setSaved(true); window.setTimeout(() => setSaved(false), 1400);
  }

  function changeStatus(status: StoryStatus, eventType: string) {
    if (!story) return;
    const now = new Date().toISOString();
    persist({ ...story, status, updatedAt: now, publishedAt: status === "published" ? now : story.publishedAt, events: [{ id: crypto.randomUUID(), type: eventType, actor: "Mariana Torres", occurredAt: now }, ...story.events] });
  }

  function addSource() {
    if (!story) return;
    const name = window.prompt("Nombre de la fuente"); if (!name) return;
    persist({ ...story, sources: [...story.sources, { id: crypto.randomUUID(), name, type: "person" }], events: [{ id: crypto.randomUUID(), type: "Fuente agregada", actor: "Mariana Torres", occurredAt: new Date().toISOString() }, ...story.events] });
  }

  function addClaim() {
    if (!story) return;
    const text = window.prompt("Escribe la afirmación verificable"); if (!text) return;
    persist({ ...story, claims: [...story.claims, { id: crypto.randomUUID(), text, status: "pending", sourceIds: [] }], events: [{ id: crypto.randomUUID(), type: "Afirmación creada", actor: "Mariana Torres", occurredAt: new Date().toISOString() }, ...story.events] });
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
    persist({ ...story, claims: story.claims.map((claim) => claim.id === id ? { ...claim, status } : claim) });
  }

  if (!story) return <Card><h1>Noticia no encontrada</h1><p>El borrador puede haber sido creado en otro navegador o haberse eliminado.</p><Link href="/desk/noticias/nueva" className="text-link">Crear otra noticia</Link></Card>;

  return (
    <div className="story-room">
      <div className="story-room-header"><div><div className="breadcrumb">Mi día / Noticias / {story.demo ? "DEMO" : story.id}</div><h1>{story.title}</h1><div className="story-meta"><StatusBadge status={story.status} /><span>Actualizada {formatDate(story.updatedAt)}</span>{saved && <span className="saved-indicator"><Check size={14} /> Guardado</span>}</div></div><div className="header-actions"><Button variant="secondary" onClick={() => persist({ ...story, updatedAt: new Date().toISOString() })}><Save size={16} /> Guardar</Button><Button onClick={() => changeStatus("review", "Revisión solicitada")}><Send size={16} /> Solicitar revisión</Button></div></div>
      <div className="room-tabs"><button onClick={() => setTab("evidence")} className={tab === "evidence" ? "active" : ""}>Evidencia</button><button onClick={() => setTab("story")} className={tab === "story" ? "active" : ""}>Noticia Maestra</button><button onClick={() => setTab("actions")} className={tab === "actions" ? "active" : ""}>Acciones</button></div>
      <div className="room-grid">
        <aside className={tab === "evidence" ? "room-column visible-mobile" : "room-column evidence-column"}>
          <div className="column-heading"><div><span className="eyebrow">01 · EVIDENCIA</span><h2>Material y fuentes</h2></div><button className="icon-button" onClick={addSource}><Plus size={18} /></button></div>
          <Card className="source-card"><div className="source-icon"><Link2 size={18} /></div><div><strong>{story.sources.length} fuentes registradas</strong><span>{story.sources.length ? "Base documental disponible" : "Agrega la primera fuente"}</span></div></Card>
          <div className="source-list">{story.sources.map((source) => <div key={source.id} className="source-row"><FileText size={16} /><div><strong>{source.name}</strong><span>{source.type}</span></div></div>)}</div>
          <Button variant="secondary" onClick={addSource}><Plus size={16} /> Agregar fuente</Button>
        </aside>
        <section className={tab === "story" ? "room-column story-column visible-mobile" : "room-column story-column"}>
          <div className="column-heading"><div><span className="eyebrow">02 · CONTENIDO</span><h2>Noticia Maestra</h2></div></div>
          <label>Título<Input value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} /></label>
          <label>Resumen<Textarea rows={4} value={story.summary} onChange={(e) => setStory({ ...story, summary: e.target.value })} /></label>
          <label>Cuerpo<Textarea rows={12} value={story.body} onChange={(e) => setStory({ ...story, body: e.target.value })} /></label>
          <div className="claims-heading"><div><h3>Afirmaciones verificables</h3><p>Separa los datos que necesitan respaldo.</p></div><Button variant="secondary" onClick={addClaim}><Plus size={16} /> Agregar</Button></div>
          <div className="claim-list">{story.claims.map((claim, index) => <Card key={claim.id} className="claim-card"><span className="claim-index">{String(index + 1).padStart(2, "0")}</span><p>{claim.text}</p><select className="input compact" value={claim.status} onChange={(e) => updateClaim(claim.id, e.target.value as VerificationStatus)}><option value="pending">Pendiente</option><option value="supported">Confirmada</option><option value="disputed">Disputada</option><option value="false">Falsa</option></select></Card>)}</div>
        </section>
        <aside className={tab === "actions" ? "room-column visible-mobile" : "room-column actions-column"}>
          <div className="column-heading"><div><span className="eyebrow">03 · SIGUIENTE PASO</span><h2>Control editorial</h2></div></div>
          <Card className="next-action-card"><CircleAlert size={20} /><span>Acción recomendada</span><strong>{story.claims.some((c) => c.status === "pending") ? "Verifica las afirmaciones pendientes" : story.status === "draft" ? "Solicita revisión editorial" : "Continúa con el flujo"}</strong></Card>
          <div className="action-stack"><Button variant="secondary" onClick={() => changeStatus("review", "Revisión solicitada")}><Send size={16} /> Solicitar revisión</Button><Button variant="secondary" disabled={!canEditWorkflow} title={!canEditWorkflow ? "Cambia al rol Editora para aprobar" : undefined} onClick={() => changeStatus("approved", "Noticia aprobada")}><ShieldCheck size={16} /> Aprobar</Button><Button disabled={!canEditWorkflow || story.status !== "approved"} title={!canEditWorkflow ? "Solo editoras y administradoras pueden publicar" : story.status !== "approved" ? "Primero aprueba la noticia" : undefined} onClick={() => changeStatus("published", "Noticia publicada")}><Check size={16} /> Publicar</Button><Button variant="secondary" disabled={!canEditWorkflow} onClick={requestChanges}>Solicitar cambio</Button>{story.publishedAt && <Button variant="secondary" disabled={!canEditWorkflow} onClick={registerCorrection}>Registrar corrección</Button>}{story.publishedAt && <Link href={story.id.startsWith("demo-") ? `/noticias/${story.slug}` : `/noticias/borrador-demo?id=${story.id}`} className="button button-secondary"><ExternalLink size={16} /> Abrir vista pública</Link>}</div>
          <div className="timeline"><div className="timeline-title"><History size={17} /><strong>Historial editorial</strong></div>{story.events.map((event) => <div className="timeline-row" key={event.id}><span className="timeline-dot" /><div><strong>{event.type}</strong><span>{event.actor} · {formatDate(event.occurredAt)}</span></div></div>)}</div>
        </aside>
      </div>
    </div>
  );
}
