"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  FileText,
  Instagram,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { useDemoRole } from "@/lib/demo-role";
import { loadInstagramStory, reviewInstagramStory } from "@/lib/instagram-story-client";
import type { Story, StoryStatus, VerificationStatus } from "@/lib/types";
import { formatDate, slugify } from "@/lib/utils";

function demoStory(storyId: string): Story {
  const now = new Date().toISOString();
  const metro = storyId.includes("002") || storyId.includes("metro");
  return {
    id: storyId,
    slug: metro ? "servicio-provisional-linea-3" : "reduccion-jornada-laboral-congreso",
    title: metro ? "Metro mantiene servicio provisional en dos estaciones de la Línea 3" : "Congreso abre discusión sobre la reducción de la jornada laboral",
    summary: metro
      ? "El sistema de transporte informó que dos estaciones mantienen servicio provisional mientras continúa una revisión operativa."
      : "La discusión legislativa abre una nueva etapa para revisar la duración de la jornada laboral y sus efectos para trabajadores y empresas.",
    body: metro
      ? "El Metro informó mediante un Reel publicado por El Facto que dos estaciones de la Línea 3 mantienen servicio provisional mientras continúa una revisión operativa. La medida afecta temporalmente los traslados del tramo central. El contenido audiovisual y su caption ya pasaron por el proceso editorial interno de El Facto."
      : "El Congreso abrió una mesa de discusión sobre la reducción de la jornada laboral. El Reel de El Facto explica el inicio del proceso, sus principales posturas y las preguntas que todavía deben resolverse. La nota conserva el enfoque y los datos aprobados antes de publicar en Instagram.",
    category: "Política",
    status: storyId.includes("002") ? "approved" : "review",
    author: storyId.includes("002") ? "Pavel Martínez Gaona" : "Ilse Mariana Reyes Valle",
    responsible: "Equipo editorial",
    sources: [{ id: "origin", name: "El Facto — Reel revisado", url: "https://www.instagram.com/elfactonoticias", type: "link", note: "Origen editorial revisado" }],
    claims: [
      { id: "claim-1", text: metro ? "Dos estaciones mantienen servicio provisional" : "El Congreso abrió una mesa de discusión sobre la jornada laboral", status: "supported", sourceIds: ["origin"] },
      { id: "claim-2", text: metro ? "La revisión operativa continúa" : "La propuesta todavía debe atravesar discusión legislativa", status: "supported", sourceIds: ["origin"] },
    ],
    createdAt: now,
    updatedAt: now,
    corrections: [],
    events: [{ id: "event-origin", type: "Reel detectado y convertido en nota", actor: "Factomedia", occurredAt: now }],
    metrics: { views: 0, readsStarted: 0, readsCompleted: 0, shares: 0 },
    demo: true,
  };
}

export function InstagramStoryRoom({ storyId }: { storyId: string }) {
  const { role } = useDemoRole();
  const canDecide = role === "editor" || role === "admin";
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("Cargando la nota generada desde Instagram…");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const live = await loadInstagramStory(storyId);
      if (cancelled) return;
      if (live) {
        setStory(live);
        setNotice("Origen editorial y borrador cargados desde Supabase");
      } else if (storyId.startsWith("ig-") || storyId.includes("demo")) {
        setStory(demoStory(storyId));
        setNotice("Demo guiada · conecta Supabase para usar datos reales");
      } else {
        setNotice("No se encontró una nota asociada a este Reel");
      }
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [storyId]);

  const readiness = useMemo(() => {
    if (!story) return 0;
    const checks = [
      story.title.trim().length >= 12,
      story.summary.trim().length >= 40,
      story.body.trim().length >= 120,
      story.sources.some((source) => source.note === "Origen editorial revisado" || source.name.includes("Reel revisado")),
      story.claims.length > 0,
      story.claims.every((claim) => claim.status !== "pending"),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [story]);

  function edit(patch: Partial<Story>) {
    setStory((current) => current ? { ...current, ...patch, updatedAt: new Date().toISOString() } : current);
  }

  async function act(action: "save" | "request_review" | "approve" | "request_changes" | "publish", comment?: string) {
    if (!story) return;
    setSaving(true);
    setNotice(action === "publish" ? "Enviando al CMS…" : "Guardando cambios…");

    if (story.demo) {
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      const statusMap: Partial<Record<typeof action, StoryStatus>> = {
        request_review: "review",
        approve: "approved",
        request_changes: "developing",
        publish: "published",
      };
      const nextStatus = statusMap[action] ?? story.status;
      setStory({
        ...story,
        status: nextStatus,
        publishedAt: nextStatus === "published" ? new Date().toISOString() : story.publishedAt,
        updatedAt: new Date().toISOString(),
        events: [{ id: crypto.randomUUID(), type: `Acción demo: ${action}`, actor: "Equipo editorial", occurredAt: new Date().toISOString(), comment }, ...story.events],
      });
      setNotice(action === "publish" ? "Publicación simulada completada" : "Cambios guardados en la demo");
      setSaving(false);
      return;
    }

    const result = await reviewInstagramStory(story, action, comment);
    if (!result.ok) {
      setNotice(action === "publish" ? "No se publicó: falta configurar el CMS o revisar permisos" : "No se pudo completar la acción; revisa sesión y permisos");
      setSaving(false);
      return;
    }

    const nextStatus: StoryStatus = action === "approve" ? "approved" : action === "request_changes" ? "developing" : action === "request_review" ? "review" : action === "publish" ? "published" : story.status;
    setStory({ ...story, status: nextStatus, updatedAt: new Date().toISOString(), publishedAt: action === "publish" ? new Date().toISOString() : story.publishedAt });
    setNotice(action === "publish" ? "Nota publicada mediante el CMS" : "Acción guardada en el historial editorial");
    setSaving(false);
  }

  if (loading) return <Card><p>{notice}</p></Card>;
  if (!story) return <Card><h1>Nota no encontrada</h1><p>{notice}</p><Link href="/instagram" className="text-link">Volver a Instagram</Link></Card>;

  return (
    <div className="story-room instagram-review-room">
      <div className="story-room-header">
        <div>
          <Link href="/instagram" className="breadcrumb"><ArrowLeft size={14} /> Instagram / Bandeja editorial</Link>
          <h1>{story.title}</h1>
          <div className="story-meta"><StatusBadge status={story.status} /><span>Actualizada {formatDate(story.updatedAt)}</span></div>
        </div>
        <div className="header-actions"><Button variant="secondary" disabled={saving} onClick={() => void act("save")}><Save size={16} /> Guardar</Button></div>
      </div>

      <Card className="guide-overview">
        <div className="guide-progress-copy">
          <div><span className="eyebrow"><Instagram size={15} /> ORIGEN EDITORIAL REVISADO</span><h2>{readiness}% lista</h2><p>No repetimos la investigación ya aprobada en Instagram. Revisamos que la conversión a nota sea fiel.</p></div>
          <div className="readiness-number">{readiness}<span>%</span></div>
        </div>
        <div className="guide-progress"><span style={{ width: `${readiness}%` }} /></div>
        <div className="guided-next"><div><Clock3 size={19} /><span><small>ESTADO</small><strong>{notice}</strong></span></div></div>
      </Card>

      <div className="room-grid">
        <aside className="room-column evidence-column visible-mobile">
          <div className="column-heading"><div><span className="eyebrow">01 · ORIGEN Y CONTEXTO</span><h2>Fuentes</h2></div></div>
          <Card className="source-card"><div className="source-icon"><Instagram size={18} /></div><div><strong>Reel revisado por El Facto</strong><span>Fuente primaria del borrador</span></div></Card>
          <div className="source-list">{story.sources.map((source) => <div key={source.id} className="source-row"><FileText size={16} /><div><strong>{source.name}</strong><span>{source.note ?? source.type}</span>{source.url ? <a href={source.url} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Abrir</a> : null}</div></div>)}</div>
        </aside>

        <section className="room-column story-column visible-mobile">
          <div className="column-heading"><div><span className="eyebrow">02 · NOTA GENERADA</span><h2>Revisión editorial</h2></div><span className="autosave-copy">Revisión humana obligatoria</span></div>
          <label>Título<Input value={story.title} onChange={(event) => edit({ title: event.target.value, slug: slugify(event.target.value) })} /></label>
          <label>Bajada<Textarea rows={4} value={story.summary} onChange={(event) => edit({ summary: event.target.value })} /></label>
          <label>Cuerpo<Textarea rows={16} value={story.body} onChange={(event) => edit({ body: event.target.value })} /></label>
          <div className="claims-heading"><div><h3>Afirmaciones heredadas del Reel</h3><p>Se consideran revisadas salvo que la nota añada información nueva.</p></div></div>
          <div className="claim-list">{story.claims.map((claim, index) => <Card key={claim.id} className="claim-card"><span className="claim-index">{String(index + 1).padStart(2, "0")}</span><p>{claim.text}</p><select className="input compact" value={claim.status} onChange={(event) => edit({ claims: story.claims.map((item) => item.id === claim.id ? { ...item, status: event.target.value as VerificationStatus } : item) })}><option value="supported">Origen revisado</option><option value="pending">Revisar</option><option value="disputed">Contradicha</option><option value="false">Falsa</option></select></Card>)}</div>
        </section>

        <aside className="room-column actions-column visible-mobile">
          <div className="column-heading"><div><span className="eyebrow">03 · DECISIÓN</span><h2>Publicación</h2></div></div>
          <Card className="next-action-card"><CheckCircle2 size={20} /><span>Control editorial</span><strong>{readiness === 100 ? "La nota puede avanzar" : "Corrige los pendientes antes de aprobar"}</strong></Card>
          <div className="action-stack">
            <Button variant="secondary" disabled={saving || readiness < 100 || story.status === "review"} onClick={() => void act("request_review")}><Send size={16} /> Solicitar revisión</Button>
            <Button variant="secondary" disabled={saving || !canDecide || readiness < 100} title={!canDecide ? "Cambia al rol Editora o Administradora" : undefined} onClick={() => void act("approve")}><ShieldCheck size={16} /> Aprobar</Button>
            <Button disabled={saving || !canDecide || story.status !== "approved"} onClick={() => void act("publish")}><Check size={16} /> Publicar en la web</Button>
            <Button variant="secondary" disabled={saving || !canDecide} onClick={() => { const comment = window.prompt("¿Qué debe corregirse?"); if (comment) void act("request_changes", comment); }}><CircleAlert size={16} /> Solicitar cambios</Button>
          </div>
          <Card><span className="eyebrow">REGLA</span><p>Las fuentes externas enriquecen y comparan tiempos. No bloquean esta nota salvo contradicción, riesgo jurídico o información nueva añadida.</p></Card>
          <div className="timeline"><div className="timeline-title"><Clock3 size={17} /><strong>Historial</strong></div>{story.events.map((event) => <div className="timeline-row" key={event.id}><span className="timeline-dot" /><div><strong>{event.type}</strong><span>{event.actor} · {formatDate(event.occurredAt)}</span></div></div>)}</div>
        </aside>
      </div>
    </div>
  );
}
