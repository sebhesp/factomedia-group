"use client";

import { useMemo, useState } from "react";
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

const stages = {
  detected: { label: "Detectado", icon: Instagram, tone: "neutral" },
  transcribing: { label: "Transcribiendo", icon: Mic2, tone: "progress" },
  researching: { label: "Investigando", icon: SearchCheck, tone: "progress" },
  review: { label: "Necesita revisión", icon: CircleAlert, tone: "warning" },
  ready: { label: "Nota lista", icon: CheckCircle2, tone: "success" },
  published: { label: "Publicada", icon: FileText, tone: "success" },
} as const;

type Stage = keyof typeof stages;

type ReelItem = {
  id: string;
  title: string;
  publishedAgo: string;
  presenter: string | null;
  duration: string;
  stage: Stage;
  progress: number;
  note: string;
};

const initialReels: ReelItem[] = [
  {
    id: "ig-001",
    title: "Congreso abre discusión sobre reducción de la jornada laboral",
    publishedAgo: "hace 4 min",
    presenter: "Ilse Mariana Reyes Valle",
    duration: "01:18",
    stage: "review",
    progress: 86,
    note: "La nota está redactada. Falta confirmar una cifra del dictamen.",
  },
  {
    id: "ig-002",
    title: "Servicio provisional en dos estaciones de la Línea 3",
    publishedAgo: "hace 11 min",
    presenter: "Pavel Martínez Gaona",
    duration: "00:54",
    stage: "ready",
    progress: 100,
    note: "Transcripción, fuentes y portada listas para aprobación.",
  },
  {
    id: "ig-003",
    title: "Qué implica la nueva política de vivienda para las familias",
    publishedAgo: "hace 18 min",
    presenter: "José Jesús López Lagos",
    duration: "01:32",
    stage: "researching",
    progress: 64,
    note: "Contrastando el caption con documentos y fuentes independientes.",
  },
  {
    id: "ig-004",
    title: "Inflación mensual y cambios en la canasta básica",
    publishedAgo: "hace 27 min",
    presenter: null,
    duration: "00:47",
    stage: "transcribing",
    progress: 38,
    note: "Procesando audio y texto visible en pantalla.",
  },
  {
    id: "ig-005",
    title: "Museos públicos amplían horarios durante vacaciones",
    publishedAgo: "hace 41 min",
    presenter: "Nadia Valentina Báez Patiño",
    duration: "00:42",
    stage: "published",
    progress: 100,
    note: "Nota publicada y métricas sincronizadas.",
  },
];

export function InstagramEngine() {
  const [items, setItems] = useState(initialReels);
  const [syncing, setSyncing] = useState(false);
  const needsAction = useMemo(() => items.filter((item) => item.stage === "review" || item.stage === "ready"), [items]);
  const published = useMemo(() => items.filter((item) => item.stage === "published").length, [items]);

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
          note: "Esperando importación de caption, video y miniatura.",
        },
        ...current,
      ]);
      setSyncing(false);
      trackProductEvent("instagram_sync_completed", { surface: "instagram_engine", demo: true, new_items: 1 });
    }, 900);
  }

  return (
    <div className="instagram-engine">
      <section className="instagram-engine-hero">
        <div>
          <span className="eyebrow"><Instagram size={15} /> INSTAGRAM ES EL ORIGEN</span>
          <h1>De Reel a nota, sin empezar desde cero.</h1>
          <p>Factomedia detecta cada publicación, transcribe el video, separa hechos y opiniones, busca contexto y deja una Nota Maestra lista para revisión humana.</p>
        </div>
        <Card className="instagram-account-card">
          <div className="instagram-account-heading"><span className="instagram-account-mark"><Instagram size={19} /></span><div><strong>@elfactonoticias</strong><small>Cuenta profesional · DEMO</small></div></div>
          <div className="instagram-account-state"><i /> Sincronización preparada</div>
          <button type="button" className="button button-primary" onClick={simulateSync} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? "spin" : ""} /> {syncing ? "Buscando Reels…" : "Simular sincronización"}
          </button>
        </Card>
      </section>

      <section className="instagram-engine-kpis" aria-label="Estado del motor editorial">
        <Card><span>REELS HOY</span><strong>15</strong><small>objetivo operativo diario</small></Card>
        <Card><span>EN PROCESO</span><strong>{items.filter((item) => ["detected", "transcribing", "researching"].includes(item.stage)).length}</strong><small>sin intervención necesaria</small></Card>
        <Card><span>NECESITAN ACCIÓN</span><strong>{needsAction.length}</strong><small>revisión o aprobación</small></Card>
        <Card><span>PUBLICADAS</span><strong>{published}</strong><small>con trazabilidad completa</small></Card>
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
                    <div className="instagram-progress"><i><b style={{ width: `${item.progress}%` }} /></i><span>{item.progress}%</span></div>
                  </div>
                  <div className="instagram-reel-action">
                    <span className={`instagram-stage ${config.tone}`}><Icon size={14} /> {config.label}</span>
                    {item.stage === "review" || item.stage === "ready" ? (
                      <Link href={`/desk/noticias/sala?id=${item.id}`} className="button button-primary" data-track-event="story_opened" data-track-source="instagram_engine">
                        {item.stage === "ready" ? "Aprobar nota" : "Revisar pendiente"} <ArrowRight size={15} />
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
            <h2>Revisar una sola nota.</h2>
            <p>No tienes que revisar toda la bandeja. Factomedia prioriza la pieza que está más cerca de publicarse.</p>
            <Link href="/desk/noticias/sala?id=ig-001" className="button button-primary">Continuar revisión <ArrowRight size={15} /></Link>
          </Card>

          <Card>
            <span className="eyebrow">QUÉ HACE LA IA</span>
            <div className="instagram-capabilities">
              <span><Mic2 size={15} /> Transcribe el audio</span>
              <span><Sparkles size={15} /> Estructura la nota</span>
              <span><SearchCheck size={15} /> Señala qué falta verificar</span>
              <span><UserRoundCheck size={15} /> Propone autoría sin reconocimiento facial</span>
            </div>
          </Card>

          <Card className="instagram-guardrail-card">
            <CircleAlert size={19} />
            <div><strong>La IA no publica sola.</strong><p>Toda nota requiere revisión y aprobación editorial antes de llegar a la web.</p></div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
