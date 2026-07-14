"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle2,
  ExternalLink,
  Link2,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { demoStories } from "@/lib/demo-data";
import type { SocialMetricSnapshot, SocialPlatform, SocialPost } from "@/lib/social-types";
import {
  engagementRate,
  getSocialPosts,
  interactions,
  latestMetrics,
  saveSocialPosts,
  simulateMetricsSync,
} from "@/lib/social-store";
import { Button, Card } from "@/components/ui";

const platformLabels: Record<SocialPlatform, string> = { x: "X", instagram: "Instagram", threads: "Threads" };
const platformIcons = { x: MessageCircle, instagram: Camera, threads: Send };

function number(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function date(value?: string) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function MetricsChart({ metrics }: { metrics: SocialMetricSnapshot[] }) {
  const width = 720;
  const height = 230;
  const padding = 22;
  const max = Math.max(...metrics.map((item) => item.views), 1);
  const points = metrics.map((metric, index) => {
    const x = metrics.length === 1 ? padding : padding + (index / (metrics.length - 1)) * (width - padding * 2);
    const y = height - padding - (metric.views / max) * (height - padding * 2);
    return { x, y, metric };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="metric-chart-wrap">
      <svg className="metric-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución histórica de visualizaciones">
        {[0.25, 0.5, 0.75].map((ratio) => <line key={ratio} x1={padding} y1={height * ratio} x2={width - padding} y2={height * ratio} className="chart-gridline" />)}
        <polyline points={line} fill="none" className="chart-line" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => <circle key={point.metric.capturedAt} cx={point.x} cy={point.y} r="5" className="chart-point" />)}
      </svg>
      <div className="chart-labels">
        {metrics.map((metric) => <span key={metric.capturedAt}>{new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" }).format(new Date(metric.capturedAt))}</span>)}
      </div>
    </div>
  );
}

export function SocialPostDetail({ postId }: { postId: string }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [syncing, setSyncing] = useState(false);
  const post = posts.find((item) => item.id === postId);

  useEffect(() => {
    const handle = window.setTimeout(() => setPosts(getSocialPosts()), 0);
    return () => window.clearTimeout(handle);
  }, []);

  const comparison = useMemo(() => {
    if (!post) return null;
    const peers = posts.filter((item) => item.id !== post.id && item.platform === post.platform && item.format === post.format);
    if (!peers.length) return null;
    const average = peers.reduce((sum, item) => sum + latestMetrics(item).views, 0) / peers.length;
    const current = latestMetrics(post).views;
    return average ? ((current - average) / average) * 100 : null;
  }, [post, posts]);

  function sync() {
    setSyncing(true);
    window.setTimeout(() => {
      const next = simulateMetricsSync(posts);
      setPosts(next);
      saveSocialPosts(next);
      setSyncing(false);
    }, 700);
  }

  function linkStory(storyId: string) {
    if (!post) return;
    const story = demoStories.find((item) => item.id === storyId);
    const next = posts.map((item) => item.id === post.id ? {
      ...item,
      storyId: story?.id,
      storyTitle: story?.title,
      actions: [{ id: crypto.randomUUID(), type: "Noticia Maestra relacionada", actor: "Mariana Torres", occurredAt: new Date().toISOString(), detail: story?.title }, ...item.actions],
    } : item);
    setPosts(next);
    saveSocialPosts(next);
  }

  function identifyAuthor(author: string) {
    if (!post) return;
    const next = posts.map((item) => item.id === post.id ? {
      ...item,
      author,
      actions: [{ id: crypto.randomUUID(), type: "Responsable confirmado", actor: author, occurredAt: new Date().toISOString() }, ...item.actions],
    } : item);
    setPosts(next);
    saveSocialPosts(next);
  }

  if (!post) return <Card className="empty-distribution"><BarChart3 size={28} /><h1>Publicación no encontrada</h1><p>Puede haber sido eliminada o todavía no se ha sincronizado en este navegador.</p><Link href="/distribucion" className="button button-primary">Volver a distribución</Link></Card>;

  const metric = latestMetrics(post);
  const first = post.metrics[0] ?? metric;
  const Icon = platformIcons[post.platform];
  const viewGrowth = first.views ? ((metric.views - first.views) / first.views) * 100 : 0;

  return (
    <div className="social-detail-page">
      <div className="social-detail-nav">
        <Link href="/distribucion"><ArrowLeft size={16} /> Volver a distribución</Link>
        <Button onClick={sync} disabled={syncing}><RefreshCw size={16} className={syncing ? "spin" : ""} /> {syncing ? "Actualizando" : "Actualizar métricas"}</Button>
      </div>

      <header className="social-detail-header">
        <div className={`platform-mark large ${post.platform}`}><Icon size={22} /></div>
        <div className="social-detail-title">
          <div><span>{platformLabels[post.platform]}</span><span className={`origin-pill ${post.origin}`}>{post.origin === "native" ? "PUBLICADO DIRECTAMENTE" : "DESDE EL FACTO NOTICIAS"}</span></div>
          <h1>{post.storyTitle ?? "Publicación sin relacionar"}</h1>
          <p>{post.account} · {date(post.publishedAt)}</p>
        </div>
        {post.url && <a className="button button-secondary" href={post.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Abrir en {platformLabels[post.platform]}</a>}
      </header>

      {!post.storyId && (
        <Card className="relationship-banner">
          <AlertTriangle size={21} />
          <div><strong>Esta publicación está fuera del flujo editorial</strong><p>Relaciónala con una Noticia Maestra para integrar métricas, correcciones y aprendizajes.</p></div>
          <select className="input" defaultValue="" onChange={(event) => event.target.value && linkStory(event.target.value)}>
            <option value="" disabled>Seleccionar noticia…</option>
            {demoStories.map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}
          </select>
        </Card>
      )}

      <section className="social-detail-kpis">
        <Card><span>Visualizaciones</span><strong>{number(metric.views)}</strong><small><TrendingUp size={13} /> +{viewGrowth.toFixed(0)}% desde el primer snapshot</small></Card>
        <Card><span>Interacciones</span><strong>{number(interactions(metric))}</strong><small>{engagementRate(metric).toFixed(2)}% tasa de interacción</small></Card>
        <Card><span>Clics hacia la historia</span><strong>{metric.linkClicks === undefined ? "N/D" : number(metric.linkClicks)}</strong><small>{metric.linkClicks === undefined ? "La plataforma no entregó este dato" : "Tráfico atribuido a esta publicación"}</small></Card>
        <Card><span>Seguidores atribuidos</span><strong>{metric.followersGained === undefined ? "N/D" : `+${number(metric.followersGained)}`}</strong><small>Dato informado por plataforma</small></Card>
        <Card><span>Rendimiento relativo</span><strong>{comparison === null ? "Sin base" : `${comparison >= 0 ? "+" : ""}${comparison.toFixed(0)}%`}</strong><small>Frente a publicaciones comparables</small></Card>
      </section>

      <div className="social-detail-grid">
        <main className="social-detail-main">
          <Card className="published-copy-card">
            <div className="section-card-heading"><div><span className="eyebrow">TEXTO PUBLICADO</span><h2>Versión {post.version}</h2></div><span className={`status-dot ${post.status}`}>{post.status}</span></div>
            <blockquote>{post.text}</blockquote>
            <div className="published-copy-meta"><span>{post.format}</span><span>{post.text.length} caracteres</span><span>ID externo: {post.externalId ?? "No disponible"}</span></div>
          </Card>

          <Card className="performance-chart-card">
            <div className="section-card-heading"><div><span className="eyebrow">CRECIMIENTO</span><h2>Evolución de visualizaciones</h2></div><Sparkles size={19} /></div>
            <MetricsChart metrics={post.metrics} />
            <div className="snapshot-table">
              <div className="snapshot-row snapshot-head"><span>Captura</span><span>Vistas</span><span>Interacciones</span><span>Clics</span><span>Tasa</span></div>
              {[...post.metrics].reverse().map((snapshot) => (
                <div className="snapshot-row" key={snapshot.capturedAt}><span>{date(snapshot.capturedAt)}</span><strong>{number(snapshot.views)}</strong><strong>{number(interactions(snapshot))}</strong><strong>{snapshot.linkClicks === undefined ? "N/D" : number(snapshot.linkClicks)}</strong><strong>{engagementRate(snapshot).toFixed(2)}%</strong></div>
              ))}
            </div>
          </Card>
        </main>

        <aside className="social-detail-side">
          <Card className="post-context-card">
            <span className="eyebrow">CONTEXTO EDITORIAL</span>
            <div><span>Noticia Maestra</span>{post.storyId ? <Link href={`/desk/noticias/${post.storyId}`}><strong>{post.storyTitle}</strong><Link2 size={14} /></Link> : <strong>Sin relacionar</strong>}</div>
            <div><span>Responsable</span><strong>{post.author ?? "Sin identificar"}</strong></div>
            <div><span>Aprobación</span><strong>{post.approvedBy ?? (post.origin === "native" ? "Publicada fuera del flujo" : "Sin registrar")}</strong></div>
            <div><span>Última sincronización</span><strong>{date(post.lastSyncedAt)}</strong></div>
            {post.author === "Sin identificar" && <select className="input" defaultValue="" onChange={(event) => event.target.value && identifyAuthor(event.target.value)}><option value="" disabled>Identificar responsable…</option><option>Mariana Torres</option><option>Elena Ruiz</option><option>Diego Salas</option><option>Cuenta institucional</option></select>}
          </Card>

          <Card className="derived-insights-card">
            <span className="eyebrow">LECTURA AUTOMÁTICA</span>
            <div><TrendingUp size={18} /><p><strong>{viewGrowth > 500 ? "Crecimiento acelerado" : "Crecimiento estable"}</strong> La publicación multiplicó sus vistas desde la primera medición.</p></div>
            <div><BarChart3 size={18} /><p><strong>{engagementRate(metric).toFixed(2)}% de interacción.</strong> Compárala con piezas del mismo formato, no con todo el contenido.</p></div>
            {!post.storyId && <div><AlertTriangle size={18} /><p><strong>Falta relación editorial.</strong> Las métricas todavía no se suman a ninguna historia.</p></div>}
          </Card>

          <Card className="post-timeline-card">
            <span className="eyebrow">TRAZABILIDAD</span>
            <div className="post-action-timeline">
              {post.actions.map((action) => (
                <div key={action.id}><span className="timeline-dot" /><div><strong>{action.type}</strong><span>{action.actor} · {date(action.occurredAt)}</span>{action.detail && <p>{action.detail}</p>}</div></div>
              ))}
            </div>
          </Card>

          <Card className="integrity-note">
            <CheckCircle2 size={18} />
            <div><strong>Métricas con contexto</strong><p>Los datos reflejan respuestas de cada plataforma. Una métrica no disponible se muestra como N/D, nunca como cero.</p></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
