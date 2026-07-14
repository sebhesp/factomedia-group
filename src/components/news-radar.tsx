"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FilePlus2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { Card } from "@/components/ui";
import { saveLocalStory } from "@/lib/demo-store";
import { searchLiveNews, type RadarCluster, type RadarVerificationStatus } from "@/lib/news-radar";
import { trackProductEvent } from "@/lib/product-intelligence";
import type { Story } from "@/lib/types";
import { slugify } from "@/lib/utils";

const scopes = [
  { id: "mexico", label: "México", query: '(Mexico OR CDMX OR "Ciudad de Mexico" OR gobierno OR congreso OR economia OR seguridad OR salud OR cultura) sourcelang:spanish' },
  { id: "politica", label: "Política", query: '(gobierno OR congreso OR presidenta OR elecciones OR reforma OR gabinete) sourcecountry:mexico sourcelang:spanish' },
  { id: "ciudad", label: "Ciudad", query: '(CDMX OR "Ciudad de Mexico" OR metro OR movilidad OR alcaldia OR seguridad OR vivienda) sourcelang:spanish' },
  { id: "economia", label: "Economía", query: '(economia OR empleo OR inflacion OR empresas OR mercado OR salario) sourcecountry:mexico sourcelang:spanish' },
  { id: "mundo", label: "Mundo", query: '(gobierno OR elecciones OR conflicto OR economia OR clima OR derechos) sourcelang:spanish' },
] as const;

const statusCopy: Record<RadarVerificationStatus, { label: string; detail: string }> = {
  confirmed: { label: "Confirmada", detail: "Fuente primaria más corroboración independiente" },
  corroborated: { label: "Corroborada", detail: "Tres o más medios independientes coinciden" },
  developing: { label: "En desarrollo", detail: "Dos fuentes coinciden; falta confirmación fuerte" },
  unverified: { label: "Por verificar", detail: "Solo una fuente localizada" },
};

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes === 1) return "hace 1 minuto";
  if (minutes < 60) return `hace ${minutes} minutos`;
  return `hace ${Math.round(minutes / 60)} h`;
}

function summaryFromCluster(cluster: RadarCluster) {
  const sourceText = cluster.domains.slice(0, 4).join(", ");
  return `${cluster.verificationReason} Fuentes localizadas: ${sourceText}.`;
}

export function NewsRadar() {
  const router = useRouter();
  const initialSearchStarted = useRef(false);
  const [scope, setScope] = useState<(typeof scopes)[number]["id"]>("mexico");
  const [customQuery, setCustomQuery] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [clusters, setClusters] = useState<RadarCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>();

  const selectedScope = useMemo(() => scopes.find((item) => item.id === scope) ?? scopes[0], [scope]);
  const verifiedCount = clusters.filter((cluster) => cluster.verificationStatus === "confirmed" || cluster.verificationStatus === "corroborated").length;

  const runSearch = useCallback(async () => {
    const controller = new AbortController();
    const searchMode = customQuery.trim() ? "custom" : "preset";
    setLoading(true);
    setError("");
    trackProductEvent("radar_search_started", { scope, minutes, search_mode: searchMode });
    try {
      const query = customQuery.trim()
        ? `(${customQuery.trim()}) sourcelang:spanish`
        : selectedScope.query;
      const result = await searchLiveNews(query, minutes, controller.signal);
      const confirmed = result.filter((cluster) => cluster.verificationStatus === "confirmed" || cluster.verificationStatus === "corroborated").length;
      setClusters(result);
      setLastUpdated(new Date().toISOString());
      trackProductEvent("radar_search_completed", {
        scope,
        minutes,
        search_mode: searchMode,
        cluster_count: result.length,
        verified_count: confirmed,
        source_count: result.reduce((sum, cluster) => sum + cluster.domains.length, 0),
      });
      if (!result.length) setError("No encontramos cobertura reciente con esos filtros. Amplía la ventana o cambia el tema.");
    } catch {
      trackProductEvent("app_error", { kind: "radar_search_failed", scope, minutes });
      setError("No fue posible consultar el radar. No se mostrará información inventada ni desactualizada.");
      setClusters([]);
    } finally {
      setLoading(false);
    }
  }, [customQuery, minutes, scope, selectedScope.query]);

  useEffect(() => {
    if (initialSearchStarted.current) return;
    initialSearchStarted.current = true;
    trackProductEvent("radar_opened", { source: "route" });
    void runSearch();
  }, [runSearch]);

  function createStory(cluster: RadarCluster) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const sources = cluster.articles.slice(0, 8).map((article) => ({
      id: crypto.randomUUID(),
      name: article.domain,
      url: article.url,
      type: "link" as const,
      note: article.sourceType === "official" ? "Fuente primaria u oficial detectada por el radar" : "Fuente independiente detectada por el radar",
    }));
    const story: Story = {
      id,
      slug: slugify(cluster.title),
      title: cluster.title,
      summary: summaryFromCluster(cluster),
      body: `Señal localizada por Radar de noticias.\n\nEstado: ${statusCopy[cluster.verificationStatus].label}.\n${cluster.verificationReason}\n\nLa información debe revisarse antes de publicar.`,
      category: scope === "ciudad" ? "Ciudad" : scope === "politica" ? "Política" : scope === "economia" ? "Economía" : "Actualidad",
      status: cluster.verificationStatus === "confirmed" || cluster.verificationStatus === "corroborated" ? "verification" : "waiting_information",
      author: "Mariana Torres",
      responsible: "Mariana Torres",
      sources,
      claims: [{
        id: crypto.randomUUID(),
        text: cluster.title,
        status: cluster.verificationStatus === "confirmed" ? "supported" : "pending",
        sourceIds: cluster.verificationStatus === "confirmed" ? sources.map((source) => source.id) : [],
      }],
      createdAt: now,
      updatedAt: now,
      corrections: [],
      events: [{
        id: crypto.randomUUID(),
        type: "Noticia creada desde Radar",
        actor: "Mariana Torres",
        occurredAt: now,
        comment: `${cluster.domains.length} fuentes localizadas · ${statusCopy[cluster.verificationStatus].label}`,
      }],
      metrics: { views: 0, readsStarted: 0, readsCompleted: 0, shares: 0 },
      demo: true,
    };
    saveLocalStory(story);
    trackProductEvent("radar_story_created", {
      scope,
      verification_status: cluster.verificationStatus,
      source_count: cluster.domains.length,
      verification_score: cluster.verificationScore,
    });
    trackProductEvent("story_created", { source: "radar", category: story.category });
    router.push(`/desk/noticias/sala?id=${id}`);
  }

  return (
    <div className="news-radar-page">
      <header className="radar-header">
        <div>
          <Link href="/mi-dia" className="radar-back" data-track-event="navigation_used" data-track-id="radar-back" data-track-destination="mi-dia"><ArrowLeft size={15} /> Volver a Mi mesa</Link>
          <span className="eyebrow">RADAR DE NOTICIAS</span>
          <h1>Buscar noticia</h1>
          <p>Detecta cobertura de los últimos minutos, agrupa fuentes y muestra qué puede sostenerse y qué sigue pendiente.</p>
        </div>
        <div className="radar-integrity-note"><ShieldCheck size={20} /><span><strong>La popularidad no equivale a verificación.</strong><small>El radar exige diversidad de fuentes y deja visible la incertidumbre.</small></span></div>
      </header>

      <Card className="radar-controls">
        <div className="radar-scope-row">
          <span>Explorar</span>
          <div>{scopes.map((item) => <button key={item.id} type="button" className={scope === item.id ? "active" : ""} onClick={() => { setScope(item.id); setCustomQuery(""); }} data-track-event="navigation_used" data-track-id={`radar-scope-${item.id}`} data-track-destination={item.id}>{item.label}</button>)}</div>
        </div>
        <div className="radar-search-row">
          <label><Search size={18} /><input value={customQuery} onChange={(event) => setCustomQuery(event.target.value)} placeholder="Tema, persona, institución o lugar…" /></label>
          <select value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} aria-label="Ventana de tiempo">
            <option value={15}>Últimos 15 min</option>
            <option value={30}>Últimos 30 min</option>
            <option value={60}>Última hora</option>
            <option value={180}>Últimas 3 horas</option>
          </select>
          <button type="button" className="button button-primary" onClick={() => void runSearch()} disabled={loading} data-track-id="radar-search-submit">
            <RefreshCw size={16} className={loading ? "spin" : ""} /> {loading ? "Buscando" : "Buscar noticias"}
          </button>
        </div>
      </Card>

      <section className="radar-summary-strip">
        <div><strong>{clusters.length}</strong><span>acontecimientos agrupados</span></div>
        <div><strong>{verifiedCount}</strong><span>con corroboración fuerte</span></div>
        <div><strong>{clusters.reduce((sum, cluster) => sum + cluster.domains.length, 0)}</strong><span>fuentes distintas</span></div>
        <div><TimerReset size={17} /><span>{lastUpdated ? `Actualizado ${timeAgo(lastUpdated)}` : "Esperando búsqueda"}</span></div>
      </section>

      {error && <div className="radar-message"><CircleAlert size={18} /><span>{error}</span></div>}

      <div className="radar-results">
        {clusters.map((cluster) => {
          const copy = statusCopy[cluster.verificationStatus];
          const Icon = cluster.verificationStatus === "confirmed" || cluster.verificationStatus === "corroborated" ? ShieldCheck : ShieldAlert;
          return (
            <Card key={cluster.id} className={`radar-story ${cluster.verificationStatus}`}>
              <div className="radar-story-main">
                <div className="radar-story-meta"><span className={`verification-badge ${cluster.verificationStatus}`}><Icon size={14} /> {copy.label}</span><span>{timeAgo(cluster.latestAt)}</span><span>{cluster.domains.length} fuentes</span></div>
                <h2>{cluster.title}</h2>
                <p>{cluster.verificationReason}</p>
                <div className="radar-score"><span><i style={{ width: `${cluster.verificationScore}%` }} /></span><strong>{cluster.verificationScore}/100</strong><small>{copy.detail}</small></div>
                <div className="radar-source-list">
                  {cluster.articles.slice(0, 5).map((article) => <a key={article.id} href={article.url} target="_blank" rel="noreferrer" data-track-event="navigation_used" data-track-id={`radar-source-${article.id}`} data-track-destination="external_source"><span>{article.domain}</span>{article.sourceType === "official" && <small>PRIMARIA</small>}<ExternalLink size={13} /></a>)}
                </div>
              </div>
              <aside className="radar-story-actions">
                <span className="radar-rank"><Sparkles size={16} /> Prioridad sugerida</span>
                <p>{cluster.verificationStatus === "unverified" ? "Busca una segunda fuente antes de redactar." : "La señal ya tiene suficiente respaldo para abrir una investigación editorial."}</p>
                <button type="button" className="button button-primary" onClick={() => createStory(cluster)} data-track-id={`radar-create-${cluster.id}`}><FilePlus2 size={16} /> Crear Noticia Maestra</button>
                <button type="button" className="button button-secondary" onClick={() => window.open(cluster.articles[0]?.url, "_blank", "noopener,noreferrer")} data-track-event="navigation_used" data-track-id={`radar-primary-${cluster.id}`} data-track-destination="primary_source">Abrir fuente principal <ArrowRight size={15} /></button>
              </aside>
            </Card>
          );
        })}
      </div>

      {!loading && !clusters.length && !error && <Card className="radar-empty"><Search size={30} /><h2>Busca una señal reciente</h2><p>El Facto Noticias no mostrará resultados de relleno. Usa un tema o amplía la ventana temporal.</p></Card>}

      <footer className="radar-method"><CheckCircle2 size={17} /><p><strong>Qué significa “confirmada”.</strong> El radar detecta coincidencia entre fuentes, pero la editora conserva la decisión final. Una noticia solo recibe confirmación fuerte cuando hay una fuente primaria u oficial más corroboración independiente.</p></footer>
    </div>
  );
}
