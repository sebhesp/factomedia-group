"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Camera,
  CheckCircle2,
  ExternalLink,
  Link2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
} from "lucide-react";
import { demoSocialAlerts } from "@/lib/social-demo-data";
import type { SocialPlatform, SocialPost } from "@/lib/social-types";
import {
  engagementRate,
  getSocialPosts,
  interactions,
  latestMetrics,
  saveSocialPosts,
  simulateMetricsSync,
} from "@/lib/social-store";
import { Button, Card, Input } from "@/components/ui";

const platformLabels: Record<SocialPlatform, string> = {
  x: "X",
  instagram: "Instagram",
  threads: "Threads",
};

const platformIcons = {
  x: MessageCircle,
  instagram: Camera,
  threads: Send,
};

function compact(value: number) {
  return new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function full(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function Sparkline({ post }: { post: SocialPost }) {
  const values = post.metrics.map((metric) => metric.views);
  const max = Math.max(...values, 1);
  const width = 150;
  const height = 42;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
    const y = height - (value / max) * (height - 5);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="social-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Evolución de visualizaciones">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DistributionDashboard() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [tab, setTab] = useState<"overview" | "posts" | "stories" | "alerts">("overview");
  const [platform, setPlatform] = useState<"all" | SocialPlatform>("all");
  const [origin, setOrigin] = useState<"all" | "factomedia" | "native">("all");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [resolvedAlerts, setResolvedAlerts] = useState<string[]>([]);

  useEffect(() => {
    const handle = window.setTimeout(() => setPosts(getSocialPosts()), 0);
    return () => window.clearTimeout(handle);
  }, []);

  const filteredPosts = useMemo(() => posts.filter((post) => {
    const matchesPlatform = platform === "all" || post.platform === platform;
    const matchesOrigin = origin === "all" || post.origin === origin;
    const normalized = query.toLowerCase().trim();
    const matchesQuery = !normalized || post.text.toLowerCase().includes(normalized) || post.storyTitle?.toLowerCase().includes(normalized);
    return matchesPlatform && matchesOrigin && matchesQuery;
  }), [origin, platform, posts, query]);

  const totals = useMemo(() => posts.reduce((acc, post) => {
    const metric = latestMetrics(post);
    acc.views += metric.views;
    acc.interactions += interactions(metric);
    acc.clicks += metric.linkClicks ?? 0;
    acc.followers += metric.followersGained ?? 0;
    if (post.origin === "native") acc.external += 1;
    return acc;
  }, { views: 0, interactions: 0, clicks: 0, followers: 0, external: 0 }), [posts]);

  const storyGroups = useMemo(() => {
    const groups = new Map<string, { storyId: string; title: string; posts: SocialPost[] }>();
    posts.filter((post) => post.storyId && post.storyTitle).forEach((post) => {
      const key = post.storyId as string;
      const current = groups.get(key) ?? { storyId: key, title: post.storyTitle as string, posts: [] };
      current.posts.push(post);
      groups.set(key, current);
    });
    return [...groups.values()].map((group) => {
      const metrics = group.posts.map(latestMetrics);
      return {
        ...group,
        views: metrics.reduce((sum, metric) => sum + metric.views, 0),
        interactions: metrics.reduce((sum, metric) => sum + interactions(metric), 0),
        clicks: metrics.reduce((sum, metric) => sum + (metric.linkClicks ?? 0), 0),
        platforms: [...new Set(group.posts.map((post) => post.platform))],
      };
    }).sort((a, b) => b.views - a.views);
  }, [posts]);

  const activeAlerts = demoSocialAlerts.filter((alert) => !resolvedAlerts.includes(alert.id));
  const growingPosts = [...posts].sort((a, b) => {
    const aMetrics = a.metrics;
    const bMetrics = b.metrics;
    const aGrowth = aMetrics.length > 1 ? latestMetrics(a).views - aMetrics[aMetrics.length - 2].views : 0;
    const bGrowth = bMetrics.length > 1 ? latestMetrics(b).views - bMetrics[bMetrics.length - 2].views : 0;
    return bGrowth - aGrowth;
  }).slice(0, 3);

  function sync() {
    setSyncing(true);
    window.setTimeout(() => {
      const next = simulateMetricsSync(posts.length ? posts : getSocialPosts());
      setPosts(next);
      saveSocialPosts(next);
      setLastSync(new Date().toISOString());
      setSyncing(false);
    }, 850);
  }

  return (
    <div className="distribution-page">
      <header className="distribution-hero">
        <div>
          <span className="eyebrow">DISTRIBUCIÓN Y RENDIMIENTO</span>
          <h1>Todo lo publicado vuelve a Factomedia.</h1>
          <p>Monitorea publicaciones creadas dentro y fuera de la plataforma, relaciónalas con historias y entiende cómo crecen con el tiempo.</p>
        </div>
        <div className="distribution-hero-actions">
          <span className="sync-status"><span className="live-dot" /> {lastSync ? "Sincronizado ahora" : "Sincronización DEMO activa"}</span>
          <Button onClick={sync} disabled={syncing}><RefreshCw size={16} className={syncing ? "spin" : ""} /> {syncing ? "Sincronizando" : "Sincronizar ahora"}</Button>
        </div>
      </header>

      <nav className="distribution-tabs" aria-label="Vistas de distribución">
        <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>En vivo</button>
        <button className={tab === "posts" ? "active" : ""} onClick={() => setTab("posts")}>Publicaciones <span>{posts.length}</span></button>
        <button className={tab === "stories" ? "active" : ""} onClick={() => setTab("stories")}>Historias</button>
        <button className={tab === "alerts" ? "active" : ""} onClick={() => setTab("alerts")}>Alertas <span>{activeAlerts.length}</span></button>
      </nav>

      {tab === "overview" && (
        <div className="distribution-overview">
          <section className="distribution-kpis">
            <Card><span>Visualizaciones acumuladas</span><strong>{compact(totals.views)}</strong><small>Entre plataformas, no personas únicas</small></Card>
            <Card><span>Interacciones</span><strong>{compact(totals.interactions)}</strong><small>{totals.views ? ((totals.interactions / totals.views) * 100).toFixed(2) : "0"}% sobre visualizaciones</small></Card>
            <Card><span>Clics hacia historias</span><strong>{compact(totals.clicks)}</strong><small>Desde publicaciones con enlace medible</small></Card>
            <Card><span>Seguidores atribuidos</span><strong>+{full(totals.followers)}</strong><small>Estimación reportada por plataforma</small></Card>
            <Card className="external-kpi"><span>Publicados fuera de Factomedia</span><strong>{totals.external}</strong><small>Detectados e importados automáticamente</small></Card>
          </section>

          <section className="distribution-live-grid">
            <Card className="live-performance-card">
              <div className="section-card-heading"><div><span className="eyebrow">MOVIMIENTO AHORA</span><h2>Publicaciones creciendo</h2></div><Activity size={20} /></div>
              <div className="growing-list">
                {growingPosts.map((post, index) => {
                  const metric = latestMetrics(post);
                  const Icon = platformIcons[post.platform];
                  return (
                    <Link href={`/distribucion/post?id=${post.id}`} key={post.id} className="growing-post">
                      <span className="growing-rank">0{index + 1}</span>
                      <div className={`platform-mark ${post.platform}`}><Icon size={16} /></div>
                      <div className="growing-copy"><strong>{post.storyTitle ?? post.text}</strong><span>{platformLabels[post.platform]} · {post.origin === "native" ? "Publicado directamente" : "Desde Factomedia"}</span></div>
                      <div className="growing-metric"><TrendingUp size={15} /><strong>{compact(metric.views)}</strong><span>vistas</span></div>
                      <ArrowUpRight size={16} />
                    </Link>
                  );
                })}
              </div>
            </Card>

            <Card className="attention-card">
              <div className="section-card-heading"><div><span className="eyebrow">REQUIERE ATENCIÓN</span><h2>{activeAlerts.length} señales</h2></div><AlertTriangle size={20} /></div>
              <div className="alert-mini-list">
                {activeAlerts.slice(0, 3).map((alert) => (
                  <button key={alert.id} onClick={() => setTab("alerts")} className={`alert-mini ${alert.severity}`}>
                    <span />
                    <div><strong>{alert.title}</strong><p>{alert.description}</p></div>
                  </button>
                ))}
              </div>
              <Button variant="secondary" onClick={() => setTab("alerts")}>Revisar alertas</Button>
            </Card>
          </section>

          <section className="distribution-section">
            <div className="distribution-section-heading"><div><span className="eyebrow">ÚLTIMAS PUBLICACIONES</span><h2>Un solo registro, sin importar dónde se publicaron</h2></div><button onClick={() => setTab("posts")}>Ver todas <ArrowUpRight size={15} /></button></div>
            <div className="social-post-grid">
              {posts.slice(0, 4).map((post) => <SocialPostCard key={post.id} post={post} />)}
            </div>
          </section>

          <section className="distribution-section">
            <div className="distribution-section-heading"><div><span className="eyebrow">RENDIMIENTO POR HISTORIA</span><h2>La noticia como núcleo de distribución</h2></div><button onClick={() => setTab("stories")}>Explorar historias <ArrowUpRight size={15} /></button></div>
            <div className="story-performance-list">
              {storyGroups.slice(0, 3).map((story) => (
                <Card key={story.storyId} className="story-performance-row">
                  <div className="story-performance-title"><strong>{story.title}</strong><span>{story.posts.length} publicaciones · {story.platforms.map((item) => platformLabels[item]).join(", ")}</span></div>
                  <div><strong>{compact(story.views)}</strong><span>visualizaciones</span></div>
                  <div><strong>{compact(story.interactions)}</strong><span>interacciones</span></div>
                  <div><strong>{compact(story.clicks)}</strong><span>clics</span></div>
                  <Link href={`/desk/noticias/${story.storyId}`}><ArrowUpRight size={17} /></Link>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "posts" && (
        <section className="distribution-section posts-view">
          <div className="distribution-filters">
            <div className="social-search"><Search size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por texto o historia…" /></div>
            <select className="input" value={platform} onChange={(event) => setPlatform(event.target.value as "all" | SocialPlatform)}><option value="all">Todas las plataformas</option><option value="x">X</option><option value="instagram">Instagram</option><option value="threads">Threads</option></select>
            <select className="input" value={origin} onChange={(event) => setOrigin(event.target.value as "all" | "factomedia" | "native")}><option value="all">Todos los orígenes</option><option value="factomedia">Desde Factomedia</option><option value="native">Publicados directamente</option></select>
          </div>
          <div className="social-post-grid social-post-grid-wide">
            {filteredPosts.map((post) => <SocialPostCard key={post.id} post={post} />)}
          </div>
          {!filteredPosts.length && <Card className="empty-distribution"><Search size={28} /><h2>No encontramos publicaciones</h2><p>Prueba con otro término o elimina algún filtro.</p></Card>}
        </section>
      )}

      {tab === "stories" && (
        <section className="distribution-section">
          <div className="distribution-section-heading"><div><span className="eyebrow">HISTORIAS</span><h2>Impacto acumulado por Noticia Maestra</h2></div></div>
          <div className="story-performance-list story-performance-expanded">
            {storyGroups.map((story) => (
              <Card key={story.storyId} className="story-performance-row">
                <div className="story-performance-title"><strong>{story.title}</strong><span>{story.posts.length} publicaciones · {story.platforms.map((item) => platformLabels[item]).join(", ")}</span></div>
                <div><strong>{compact(story.views)}</strong><span>visualizaciones</span></div>
                <div><strong>{compact(story.interactions)}</strong><span>interacciones</span></div>
                <div><strong>{compact(story.clicks)}</strong><span>clics</span></div>
                <Link href={`/desk/noticias/${story.storyId}`}><ArrowUpRight size={17} /></Link>
              </Card>
            ))}
          </div>
          <Card className="measurement-note"><BarChart3 size={20} /><div><strong>Lectura responsable de datos</strong><p>Las visualizaciones de distintas plataformas se muestran acumuladas. No representan personas únicas y no deben presentarse como alcance deduplicado.</p></div></Card>
        </section>
      )}

      {tab === "alerts" && (
        <section className="distribution-section alerts-view">
          <div className="distribution-section-heading"><div><span className="eyebrow">ALERTAS EDITORIALES</span><h2>Señales para actuar, no notificaciones por ruido</h2></div></div>
          <div className="alerts-list">
            {activeAlerts.map((alert) => (
              <Card key={alert.id} className={`distribution-alert ${alert.severity}`}>
                <span className="alert-indicator" />
                <div><span>{alert.severity === "critical" ? "ACCIÓN NECESARIA" : alert.severity === "warning" ? "SEGUIMIENTO" : "APRENDIZAJE"}</span><h3>{alert.title}</h3><p>{alert.description}</p></div>
                <div className="distribution-alert-actions">
                  {alert.postId && <Link href={`/distribucion/post?id=${alert.postId}`} className="button button-secondary">Abrir publicación</Link>}
                  <Button variant="ghost" onClick={() => setResolvedAlerts((items) => [...items, alert.id])}><CheckCircle2 size={16} /> Marcar revisada</Button>
                </div>
              </Card>
            ))}
            {!activeAlerts.length && <Card className="empty-distribution"><CheckCircle2 size={30} /><h2>Todo está atendido</h2><p>Las nuevas señales aparecerán aquí cuando requieran una decisión.</p></Card>}
          </div>
        </section>
      )}
    </div>
  );
}

function SocialPostCard({ post }: { post: SocialPost }) {
  const metric = latestMetrics(post);
  const Icon = platformIcons[post.platform];
  const engagement = engagementRate(metric);

  return (
    <Link href={`/distribucion/post?id=${post.id}`} className="social-post-card">
      <div className="social-post-card-top">
        <div className={`platform-mark ${post.platform}`}><Icon size={16} /></div>
        <div><strong>{platformLabels[post.platform]}</strong><span>{post.origin === "native" ? `Publicado directamente en ${platformLabels[post.platform]}` : "Publicado desde Factomedia"}</span></div>
        <span className={`origin-pill ${post.origin}`}>{post.origin === "native" ? "IMPORTADO" : "FACTOMEDIA"}</span>
      </div>
      <p>{post.text}</p>
      <div className="social-post-story">{post.storyTitle ? <><Link2 size={13} /> {post.storyTitle}</> : <><AlertTriangle size={13} /> Sin Noticia Maestra relacionada</>}</div>
      <div className="social-post-chart"><Sparkline post={post} /><div><strong>{compact(metric.views)}</strong><span>visualizaciones</span></div></div>
      <div className="social-post-metrics"><span><strong>{compact(interactions(metric))}</strong> interacciones</span><span><strong>{engagement.toFixed(2)}%</strong> tasa</span><span><strong>{compact(metric.linkClicks ?? 0)}</strong> clics</span></div>
      <div className="social-post-footer"><span>{post.account}</span><span>Ver seguimiento <ExternalLink size={13} /></span></div>
    </Link>
  );
}
