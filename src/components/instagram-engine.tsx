"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Instagram,
  Mic2,
  RefreshCw,
  SearchCheck,
  Sparkles,
  UserRoundCheck,
  Video,
} from "lucide-react";
import { Card } from "@/components/ui";
import { trackProductEvent } from "@/lib/product-intelligence";
import {
  loadInstagramEngineItems,
  requestInstagramSync,
  type InstagramEngineItem,
} from "@/lib/instagram-pipeline-client";

const stages = {
  detected: { label: "Detectado", icon: Instagram, tone: "neutral" },
  transcribing: { label: "Transcribiendo", icon: Mic2, tone: "progress" },
  researching: { label: "Buscando contexto", icon: SearchCheck, tone: "progress" },
  review: { label: "Necesita revisión", icon: CircleAlert, tone: "warning" },
  ready: { label: "Nota lista", icon: CheckCircle2, tone: "success" },
  published: { label: "Publicada", icon: FileText, tone: "success" },
} as const;

const initialReels: InstagramEngineItem[] = [
  {
    id: "ig-001",
    title: "Congreso abre discusión sobre reducción de la jornada laboral",
    publishedAgo: "hace 4 min",
    presenter: "Ilse Mariana Reyes Valle",
    duration: "01:18",
    stage: "review",
    progress: 92,
    note: "El Reel ya fue revisado por El Facto Noticias. La nota está redactada; falta decidir si se añade una cifra externa.",
    externalMatches: 3,
    timingComparison: "El Facto Noticias publicó 6 min antes que el primer medio comparable",
  },
  {
    id: "ig-002",
    title: "Servicio provisional en dos estaciones de la Línea 3",
    publishedAgo: "hace 11 min",
    presenter: "Pavel Martínez Gaona",
    duration: "00:54",
    stage: "ready",
    progress: 100,
    note: "Origen editorial revisado. Transcripción, autor, portada y nota listas para aprobación.",
    externalMatches: 4,
    timingComparison: "El Facto Noticias estuvo entre las primeras 3 cuentas en publicarlo",
  },
  {
    id: "ig-003",
    title: "Qué implica la nueva política de vivienda para las familias",
    publishedAgo: "hace 18 min",
    presenter: "José Jesús López Lagos",
    duration: "01:32",
    stage: "researching",
    progress: 72,
    note: "La nota ya puede generarse. El sistema busca antecedentes y posibles contradicciones para enriquecerla.",
    externalMatches: 5,
    timingComparison: "Se detectaron publicaciones previas; se está comparando el contexto",
  },
  {
    id: "ig-004",
    title: "Inflación mensual y cambios en la canasta básica",
    publishedAgo: "hace 27 min",
    presenter: null,
    duration: "00:47",
    stage: "transcribing",
    progress: 38,
    note: "Procesando audio, caption y texto visible. El contenido de Instagram es el origen editorial de la nota.",
    externalMatches: 2,
    timingComparison: "Comparación temporal pendiente",
  },
  {
    id: "ig-005",
    title: "Museos públicos amplían horarios durante vacaciones",
    publishedAgo: "hace 41 min",
    presenter: "Nadia Valentina Báez Patiño",
    duration: "00:42",
    stage: "published",
    progress: 100,
    note: "Nota publicada desde el Reel y métricas sincronizadas.",
    externalMatches: 3,
    timingComparison: "El Facto Noticias publicó 12 min antes que la mediana detectada",
  },
];

type DataMode = "loading" | "demo" | "live";

export function InstagramEngine() {
  const [items, setItems] = useState<InstagramEngineItem[]>(initialReels);
  const [syncing, setSyncing] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>("loading");
  const [connectionNote, setConnectionNote] = useState("Comprobando conexión…");
  const needsAction = useMemo(() => items.filter((item) => item.stage === "review" || item.stage === "ready"), [items]);
  const published = useMemo(() => items.filter((item) => item.stage === "published").length, [items]);

  async function loadLiveData(showStatus = true) {
    const result = await loadInstagramEngineItems();
    if (result.mode === "live") {
      if (result.items.length) setItems(result.items);
      setDataMode("live");
      if (showStatus) setConnectionNote(result.items.length ? "Datos reales sincronizados" : "Conectado · todavía no hay Reels importados");
      return true;
    }
    setDataMode("demo");
    if (showStatus) setConnectionNote(result.error ? "Demo activa · falta iniciar sesión o aplicar la base de datos" : "Demo activa · Supabase aún no está configurado");
    return false;
  }

  useEffect(() => {
    void loadLiveData();
  }, []);

  function simulateSync() {
    setSyncing(true);
    trackProductEvent("instagram_sync_started", { surface: "instagram_engine", demo: true });
    window.setTimeout(() => {
      setItems((current) => [
        {
          id: `ig-${Date.now()}`,
          title: "Nuevo Reel detectado: actualización política en desarrollo",
          publishedAgo: "ahora",
          presenter: null,
          duration: "00:36",
          stage: "detected",
          progress: 8,
          note: "Origen editorial detectado. Esperando importación de caption, video y miniatura.",
          externalMatches: 0,
          timingComparison: "Buscando publicaciones comparables",
        },
        ...current,
      ]);
      setSyncing(false);
      setConnectionNote("Demo actualizada con un Reel simulado");
      trackProductEvent("instagram_sync_completed", { surface: "instagram_engine", demo: true, new_items: 1 });
    }, 900);
  }

  async function syncInstagram() {
    if (dataMode !== "live") {
      simulateSync();
      return;
    }

    setSyncing(true);
    setConnectionNote("Consultando Instagram…");
    trackProductEvent("instagram_sync_started", { surface: "instagram_engine", demo: false });
    const result = await requestInstagramSync();
    if (!result.ok) {
      setConnectionNote(result.reason === "not_authenticated" ? "Inicia sesión para sincronizar" : "No se pudo sincronizar; revisa la configuración del backend");
      setSyncing(false);
      trackProductEvent("instagram_sync_failed", { surface: "instagram_engine", reason: result.reason });
      return;
    }

    await loadLiveData(false);
    setConnectionNote("Instagram sincronizado correctamente");
    setSyncing(false);
    trackProductEvent("instagram_sync_completed", { surface: "instagram_engine", demo: false });
  }

  return (
    <div className="instagram-engine">
      <section className="instagram-engine-hero">
        <div>
          <span className="eyebrow"><Instagram size={15} /> INSTAGRAM ES EL ORIGEN EDITORIAL</span>
          <h1>De Reel revisado a nota, sin repetir el trabajo.</h1>
          <p>El Facto Noticias confía en el contenido publicado por @elfactonoticias como origen editorial revisado. El sistema transcribe, estructura y prepara la nota; las fuentes externas aportan contexto, contradicciones y comparación de tiempos.</p>
        </div>
        <Card className="instagram-account-card">
          <div className="instagram-account-heading">
            <span className="instagram-account-mark"><Instagram size={19} /></span>
            <div><strong>@elfactonoticias</strong><small>Origen editorial confiable · {dataMode === "live" ? "CONECTADO" : dataMode === "loading" ? "CONECTANDO" : "DEMO"}</small></div>
          </div>
          <div className="instagram-account-state"><i /> {connectionNote}</div>
          <button type="button" className="button button-primary" onClick={() => void syncInstagram()} disabled={syncing || dataMode === "loading"}>
            <RefreshCw size={15} className={syncing ? "spin" : ""} /> {syncing ? "Buscando Reels…" : dataMode === "live" ? "Sincronizar Instagram" : "Simular sincronización"}
          </button>
        </Card>
      </section>

      <section className="instagram-engine-kpis" aria-label="Estado del motor editorial">
        <Card><span>REELS EN BANDEJA</span><strong>{items.length}</strong><small>{dataMode === "live" ? "importados desde Instagram" : "demostración operativa"}</small></Card>
        <Card><span>EN PROCESO</span><strong>{items.filter((item) => ["detected", "transcribing", "researching"].includes(item.stage)).length}</strong><small>sin repetir revisión editorial</small></Card>
        <Card><span>NECESITAN ACCIÓN</span><strong>{needsAction.length}</strong><small>edición o aprobación final</small></Card>
        <Card><span>PUBLICADAS</span><strong>{published}</strong><small>con origen y tiempos registrados</small></Card>
      </section>

      <div className="instagram-engine-layout">
        <main>
          <div className="instagram-section-heading"><div><span className="eyebrow">BANDEJA EDITORIAL</span><h2>Últimos Reels detectados</h2></div><small>Ordenados por la acción que requieren</small></div>
          <div className="instagram-reel-list">
            {items.map((item) => {
              const config = stages[item.stage];
              const Icon = config.icon;
              return (
                <Card className="instagram-reel-row" key={item.id}>
                  <div className="instagram-reel-preview"><Video size={21} /><span>{item.duration}</span></div>
                  <div className="instagram-reel-copy">
                    <div className="instagram-reel-meta"><span>{item.publishedAgo}</span><span>{item.presenter ?? "Autor por confirmar"}</span></div>
                    <h3>{item.title}</h3>
                    <p>{item.note}</p>
                    <p><strong>{item.externalMatches} coincidencias externas</strong> · {item.timingComparison}</p>
                    <div className="instagram-progress"><i><b style={{ width: `${item.progress}%` }} /></i><span>{item.progress}%</span></div>
                  </div>
                  <div className="instagram-reel-action">
                    <span className={`instagram-stage ${config.tone}`}><Icon size={14} /> {config.label}</span>
                    {item.stage === "review" || item.stage === "ready" ? (
                      <Link href={`/desk/noticias/sala?id=${item.id}`} className="button button-primary" data-track-event="story_opened" data-track-source="instagram_engine">
                        {item.stage === "ready" ? "Aprobar nota" : "Revisar nota"} <ArrowRight size={15} />
                      </Link>
                    ) : item.stage === "published" ? (
                      <Link href="/registro" className="button button-ghost">Ver registro <ArrowRight size={15} /></Link>
                    ) : (
                      <span className="instagram-auto-note"><Clock3 size={14} /> El sistema continúa automáticamente</span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </main>

        <aside className="instagram-engine-rail">
          <Card className="instagram-next-card">
            <span className="eyebrow">SIGUIENTE ACCIÓN</span>
            <h2>{needsAction.length ? "Revisar una sola nota." : "La bandeja está al día."}</h2>
            <p>{needsAction.length ? "No tienes que volver a verificar desde cero. Revisa que la transcripción y la nota respeten lo ya aprobado en Instagram." : "El Facto Noticias continuará procesando los nuevos Reels en cuanto aparezcan."}</p>
            {needsAction[0] ? <Link href={`/desk/noticias/sala?id=${needsAction[0].id}`} className="button button-primary">Continuar revisión <ArrowRight size={15} /></Link> : null}
          </Card>

          <Card>
            <span className="eyebrow">QUÉ HACE LA IA</span>
            <div className="instagram-capabilities">
              <span><Mic2 size={15} /> Transcribe el audio</span>
              <span><Sparkles size={15} /> Convierte el Reel en nota</span>
              <span><SearchCheck size={15} /> Añade contexto y compara horarios</span>
              <span><UserRoundCheck size={15} /> Conserva autoría sin reconocimiento facial</span>
            </div>
          </Card>

          <Card className="instagram-guardrail-card">
            <CircleAlert size={19} />
            <div><strong>Confiamos en el origen, no en las invenciones.</strong><p>La IA puede reutilizar lo aprobado en Instagram, pero no agregar hechos materiales sin respaldo ni publicar sola.</p></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
