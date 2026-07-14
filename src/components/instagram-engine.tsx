"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  ExternalLink,
  Camera as Instagram,
  RefreshCw,
  Search,
} from "lucide-react";
import { trackProductEvent } from "@/lib/product-intelligence";
import {
  loadInstagramEngineItems,
  requestInstagramSync,
  type InstagramEngineItem,
  type InstagramEngineStage,
} from "@/lib/instagram-pipeline-client";

const stageLabels: Record<InstagramEngineStage, string> = {
  detected: "Detectado",
  transcribing: "Transcribiendo",
  researching: "Preparando nota",
  review: "Listo para revisar",
  ready: "Aprobado",
  published: "Publicado",
};

const initialReels: InstagramEngineItem[] = [
  {
    id: "ig-001",
    title: "Congreso abre discusión sobre reducción de la jornada laboral",
    publishedAgo: "hace 4 min",
    publishedAt: "2026-07-13T20:16:00-06:00",
    presenter: "Ilse Mariana Reyes Valle",
    duration: "01:18",
    stage: "review",
    progress: 100,
    note: "La información ya está estructurada y lista para copiar o revisar.",
    externalMatches: 3,
    timingComparison: "El Facto Noticias publicó 6 min antes que el primer medio comparable",
    sourceUrl: "https://www.instagram.com/elfactonoticias/",
    caption: "El Congreso abrió la discusión sobre la reducción de la jornada laboral. La propuesta plantea una transición gradual y mantiene pendiente la definición de plazos y sectores.",
    transcript: "El Congreso comenzó la discusión sobre la reducción de la jornada laboral. La propuesta busca pasar de 48 a 40 horas semanales mediante una transición gradual. Todavía deben definirse los plazos, los sectores y la forma en que se aplicará.",
    dek: "La propuesta contempla una transición gradual de 48 a 40 horas semanales; los plazos y mecanismos de aplicación siguen en discusión.",
    lead: "El Congreso abrió la discusión sobre la reducción de la jornada laboral, una propuesta que busca disminuir de 48 a 40 las horas de trabajo semanales.",
    body: "El Congreso abrió la discusión sobre la reducción de la jornada laboral, una propuesta que busca disminuir de 48 a 40 las horas de trabajo semanales.\n\nEl planteamiento considera una transición gradual. Durante el proceso legislativo deberán definirse los plazos, los sectores involucrados y los mecanismos de aplicación.\n\nLa discusión tendrá impacto directo en las condiciones laborales, la organización de las empresas y el tiempo disponible para cuidados, descanso y vida personal.",
    context: "La reducción de la jornada forma parte de una discusión más amplia sobre productividad, derechos laborales y distribución del tiempo de trabajo.",
    seoTitle: "Congreso discute reducción de la jornada laboral a 40 horas",
    seoDescription: "El Congreso abrió la discusión para reducir la jornada laboral de 48 a 40 horas semanales mediante una transición gradual.",
    slug: "congreso-discute-reduccion-jornada-laboral-40-horas",
  },
  {
    id: "ig-002",
    title: "Servicio provisional en dos estaciones de la Línea 3",
    publishedAgo: "hace 11 min",
    publishedAt: "2026-07-13T20:09:00-06:00",
    presenter: "Pavel Martínez Gaona",
    duration: "00:54",
    stage: "ready",
    progress: 100,
    note: "Nota aprobada y lista para publicación web.",
    externalMatches: 4,
    timingComparison: "El Facto Noticias estuvo entre las primeras tres cuentas en publicarlo",
    sourceUrl: "https://www.instagram.com/elfactonoticias/",
    caption: "Se estableció servicio provisional en dos estaciones de la Línea 3. Autoridades pidieron anticipar traslados y seguir los avisos oficiales.",
    transcript: "Hay servicio provisional en dos estaciones de la Línea 3. Las autoridades recomendaron anticipar los traslados y consultar los avisos oficiales mientras continúan las labores.",
    dek: "Las autoridades recomendaron anticipar traslados y consultar los avisos oficiales mientras continúan las labores.",
    lead: "Dos estaciones de la Línea 3 operan con servicio provisional, de acuerdo con la información difundida por las autoridades.",
    body: "Dos estaciones de la Línea 3 operan con servicio provisional.\n\nLas autoridades recomendaron a las personas usuarias anticipar sus traslados y consultar los avisos oficiales mientras continúan las labores.\n\nLa duración de la afectación no fue precisada en el material publicado.",
    context: "La información puede cambiar conforme avancen las labores, por lo que la nota debe conservar la hora de actualización.",
    seoTitle: "Línea 3 opera con servicio provisional en dos estaciones",
    seoDescription: "Dos estaciones de la Línea 3 tienen servicio provisional. Autoridades pidieron anticipar traslados y revisar avisos oficiales.",
    slug: "linea-3-servicio-provisional-dos-estaciones",
  },
  {
    id: "ig-003",
    title: "Qué implica la nueva política de vivienda para las familias",
    publishedAgo: "hace 18 min",
    publishedAt: "2026-07-13T20:02:00-06:00",
    presenter: "José Jesús López Lagos",
    duration: "01:32",
    stage: "researching",
    progress: 72,
    note: "La transcripción está lista; la nota y el contexto siguen en proceso.",
    externalMatches: 5,
    timingComparison: "Se detectaron publicaciones previas; se está comparando el contexto",
    sourceUrl: "https://www.instagram.com/elfactonoticias/",
    caption: "La nueva política de vivienda plantea cambios en acceso, financiamiento y construcción. Te explicamos qué puede significar para las familias.",
    transcript: "La nueva política de vivienda plantea cambios en el acceso, el financiamiento y la construcción. El alcance para las familias dependerá de las reglas de operación y de quiénes puedan acceder a los programas.",
    dek: "",
    lead: "",
    body: "",
    context: "",
    seoTitle: "",
    seoDescription: "",
    slug: "",
  },
  {
    id: "ig-004",
    title: "Inflación mensual y cambios en la canasta básica",
    publishedAgo: "hace 27 min",
    publishedAt: "2026-07-13T19:53:00-06:00",
    presenter: null,
    duration: "00:47",
    stage: "transcribing",
    progress: 38,
    note: "El audio y el texto visible se están procesando.",
    externalMatches: 2,
    timingComparison: "Comparación temporal pendiente",
    sourceUrl: "https://www.instagram.com/elfactonoticias/",
    caption: "Revisamos los cambios mensuales de inflación y su efecto en productos de la canasta básica.",
    transcript: "",
    dek: "",
    lead: "",
    body: "",
    context: "",
    seoTitle: "",
    seoDescription: "",
    slug: "",
  },
];

type DataMode = "loading" | "demo" | "live";

type CopyFieldProps = {
  fieldKey: string;
  label: string;
  value: string;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
  wide?: boolean;
};

function CopyField({ fieldKey, label, value, copiedKey, onCopy, wide = false }: CopyFieldProps) {
  const available = Boolean(value.trim());
  return (
    <section className={`ig-copy-field${wide ? " wide" : "}`}>
      <header>
        <span>{label}</span>
        <button type="button" onClick={() => onCopy(fieldKey, value)} disabled={!available} aria-label={`Copiar ${label}`}>
          {copiedKey === fieldKey ? <Check size={14} /> : <Copy size={14} />}
          {copiedKey === fieldKey ? "Copiado" : "Copiar"}
        </button>
      </header>
      <div className={!available ? "empty" : ""}>{available ? value : "Pendiente de procesamiento"}</div>
    </section>
  );
}

function formatPublishedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function InstagramEngine() {
  const [items, setItems] = useState<InstagramEngineItem[]>(initialReels);
  const [selectedId, setSelectedId] = useState(initialReels[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>("loading");
  const [connectionNote, setConnectionNote] = useState("Comprobando conexión…");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadLiveData = useCallback(async (showStatus = true) => {
    const result = await loadInstagramEngineItems();
    if (result.mode === "live") {
      setItems(result.items);
      setSelectedId((current) => result.items.some((item) => item.id === current) ? current : result.items[0]?.id ?? "");
      setDataMode("live");
      if (showStatus) setConnectionNote(result.items.length ? "Datos reales sincronizados" : "Conectado · todavía no hay posts importados");
      return true;
    }
    setDataMode("demo");
    if (showStatus) setConnectionNote(result.error ? "Demo activa · falta iniciar sesión o aplicar la base de datos" : "Demo activa · Supabase aún no está configurado");
    return false;
  }, []);

  useEffect(() => {
    void loadLiveData();
  }, [loadLiveData]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => [item.title, item.caption, item.presenter ?? "", stageLabels[item.stage]].join(" ").toLowerCase().includes(normalized));
  }, [items, query]);

  const selected = items.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null;
  const readyCount = items.filter((item) => item.stage === "review" || item.stage === "ready").length;

  async function copyText(key: string, value: string) {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => current === key ? null : current), 1400);
    trackProductEvent("instagram_copy_field", { field: key, media_id: selected?.id ?? null });
  }

  function copyCompleteNote(item: InstagramEngineItem) {
    const sections = [
      ["TÍTULO", item.title],
      ["BAJADA", item.dek],
      ["LEAD", item.lead],
      ["CUERPO", item.body],
      ["CONTEXTO", item.context],
      ["AUTOR", item.presenter ?? "Por confirmar"],
      ["SEO TITLE", item.seoTitle],
      ["SEO DESCRIPTION", item.seoDescription],
      ["SLUG", item.slug],
      ["FUENTE", item.sourceUrl],
    ].filter(([, value]) => value.trim());
    void copyText("complete", sections.map(([label, value]) => `${label}\n${value}`).join("\n\n"));
  }

  function simulateSync() {
    const id = `ig-${Date.now()}`;
    setSyncing(true);
    window.setTimeout(() => {
      const newItem: InstagramEngineItem = {
        id,
        title: "Nuevo post detectado en Instagram",
        publishedAgo: "ahora",
        publishedAt: new Date().toISOString(),
        presenter: null,
        duration: "REEL",
        stage: "detected",
        progress: 5,
        note: "Post detectado; el procesamiento comenzará automáticamente.",
        externalMatches: 0,
        timingComparison: "Comparación temporal pendiente",
        sourceUrl: "https://www.instagram.com/elfactonoticias/",
        caption: "",
        transcript: "",
        dek: "",
        lead: "",
        body: "",
        context: "",
        seoTitle: "",
        seoDescription: "",
        slug: "",
      };
      setItems((current) => [newItem, ...current]);
      setSelectedId(id);
      setSyncing(false);
      setConnectionNote("Demo actualizada con un post simulado");
    }, 700);
  }

  async function syncInstagram() {
    if (dataMode !== "live") {
      simulateSync();
      return;
    }
    setSyncing(true);
    setConnectionNote("Consultando Instagram…");
    const result = await requestInstagramSync();
    if (!result.ok) {
      setConnectionNote(result.reason === "not_authenticated" ? "Inicia sesión para sincronizar" : "No se pudo sincronizar; revisa el backend");
      setSyncing(false);
      return;
    }
    await loadLiveData(false);
    setConnectionNote("Instagram sincronizado correctamente");
    setSyncing(false);
  }

  return (
    <div className="ig-copy-desk">
      <header className="ig-desk-header">
        <div>
          <span className="ig-kicker"><Instagram size={15} /> @elfactonoticias</span>
          <h1>Información de Instagram</h1>
          <p>Selecciona un post y copia únicamente el bloque que necesitas.</p>
        </div>
        <div className="ig-header-tools">
          <label className="ig-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar posts" aria-label="Buscar posts" />
          </label>
          <button type="button" className="ig-sync-button" onClick={() => void syncInstagram()} disabled={syncing || dataMode === "loading"}>
            <RefreshCw size={15} className={syncing ? "spin" : ""} />
            {syncing ? "Sincronizando" : "Sincronizar"}
          </button>
        </div>
      </header>

      <div className="ig-connection-line">
        <span className={`ig-mode-dot ${dataMode}`} />
        <span>{connectionNote}</span>
        <b>{items.length} posts</b>
        <b>{readyCount} listos para revisión</b>
      </div>

      <div className="ig-copy-layout">
        <aside className="ig-post-panel" aria-label="Posts de Instagram">
          <div className="ig-panel-title">
            <strong>Posts</strong>
            <span>{filteredItems.length}</span>
          </div>
          <div className="ig-post-list">
            {filteredItems.map((item) => (
              <button type="button" key={item.id} className={`ig-post-item${selected?.id === item.id ? " active" : ""}`} onClick={() => setSelectedId(item.id)}>
                <div className="ig-post-item-top">
                  <span className={`ig-stage-dot ${item.stage}`} />
                  <span>{stageLabels[item.stage]}</span>
                  <time>{item.publishedAgo}</time>
                </div>
                <strong>{item.title}</strong>
                <div className="ig-post-item-meta">
                  <span>{item.presenter ?? "Autor por confirmar"}</span>
                  <span>{item.duration}</span>
                </div>
                {item.progress < 100 ? <i className="ig-mini-progress"><b style={{ width: `${item.progress}%` }} /></i> : null}
              </button>
            ))}
            {!filteredItems.length ? <p className="ig-list-empty">No hay posts que coincidan con la búsqueda.</p> : null}
          </div>
        </aside>

        <main className="ig-detail-panel">
          {selected ? (
            <>
              <header className="ig-detail-header">
                <div>
                  <div className="ig-detail-meta">
                    <span className={`ig-status-pill ${selected.stage}`}>{stageLabels[selected.stage]}</span>
                    <span>{formatPublishedAt(selected.publishedAt)}</span>
                    <span>{selected.presenter ?? "Autor por confirmar"}</span>
                  </div>
                  <h2>{selected.title}</h2>
                  <p>{selected.note}</p>
                </div>
                <div className="ig-detail-actions">
                  <a href={selected.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Ver post</a>
                  <button type="button" onClick={() => copyCompleteNote(selected)}>
                    {copiedKey === "complete" ? <Check size={15} /> : <Copy size={15} />}
                    {copiedKey === "complete" ? "Nota copiada" : "Copiar nota completa"}
                  </button>
                  {(selected.stage === "review" || selected.stage === "ready") ? <Link href={`/desk/noticias/sala?id=${selected.id}`}>Abrir revisión</Link> : null}
                </div>
              </header>

              <div className="ig-section-heading">
                <h3>Origen</h3>
                <span>Información capturada directamente del post</span>
              </div>
              <div className="ig-field-grid">
                <CopyField fieldKey="caption" label="Caption original" value={selected.caption} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} wide />
                <CopyField fieldKey="transcript" label="Transcripción" value={selected.transcript} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} wide />
              </div>

              <div className="ig-section-heading">
                <h3>Nota lista para usar</h3>
                <span>Cada bloque se puede copiar por separado</span>
              </div>
              <div className="ig-field-grid">
                <CopyField fieldKey="title" label="Título" value={selected.title} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} />
                <CopyField fieldKey="dek" label="Bajada" value={selected.dek} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} />
                <CopyField fieldKey="lead" label="Lead" value={selected.lead} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} wide />
                <CopyField fieldKey="body" label="Cuerpo de la nota" value={selected.body} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} wide />
                <CopyField fieldKey="context" label="Contexto" value={selected.context} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} wide />
              </div>

              <div className="ig-section-heading">
                <h3>Publicación y SEO</h3>
                <span>Datos operativos del contenido</span>
              </div>
              <div className="ig-field-grid compact">
                <CopyField fieldKey="author" label="Autor" value={selected.presenter ?? ""} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} />
                <CopyField fieldKey="source" label="URL de Instagram" value={selected.sourceUrl} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} />
                <CopyField fieldKey="seo-title" label="SEO title" value={selected.seoTitle} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} />
                <CopyField fieldKey="slug" label="Slug" value={selected.slug} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} />
                <CopyField fieldKey="seo-description" label="SEO description" value={selected.seoDescription} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} wide />
                <CopyField fieldKey="timing" label="Comparación de horarios" value={`${selected.timingComparison}. Coincidencias externas: ${selected.externalMatches}.`} copiedKey={copiedKey} onCopy={(key, value) => void copyText(key, value)} wide />
              </div>
            </>
          ) : (
            <div className="ig-detail-empty">Selecciona un post para consultar su información.</div>
          )}
        </main>
      </div>
    </div>
  );
}
