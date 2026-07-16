"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, FileText, LoaderCircle } from "lucide-react";
import {
  loadInstagramEngineItems,
  type InstagramEngineItem,
} from "@/lib/instagram-pipeline-client";

type NotesFilter = "review" | "ready" | "published";

const demoItems: InstagramEngineItem[] = [
  {
    id: "ig-001",
    title: "Congreso abre discusión sobre reducción de la jornada laboral",
    publishedAgo: "hace 4 min",
    publishedAt: new Date().toISOString(),
    presenter: "Ilse Reyes",
    duration: "01:18",
    stage: "review",
    progress: 100,
    note: "Necesita confirmar una cifra.",
    externalMatches: 3,
    timingComparison: "Comparación lista",
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
  },
  {
    id: "ig-002",
    title: "Servicio provisional en dos estaciones de la Línea 3",
    publishedAgo: "hace 11 min",
    publishedAt: new Date().toISOString(),
    presenter: "Pavel Martínez",
    duration: "00:54",
    stage: "ready",
    progress: 100,
    note: "Aprobada y lista para publicar.",
    externalMatches: 4,
    timingComparison: "Comparación lista",
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
  },
];

const filterLabels: Record<NotesFilter, string> = {
  review: "Revisar",
  ready: "Listas",
  published: "Publicadas",
};

function noteHref(item: InstagramEngineItem) {
  if (item.stage === "published" && item.slug) return `/noticias/${item.slug}`;
  return `/desk/noticias/sala?id=${item.id}`;
}

export function NotesHub() {
  const [items, setItems] = useState<InstagramEngineItem[]>(demoItems);
  const [filter, setFilter] = useState<NotesFilter>("review");
  const [mode, setMode] = useState<"loading" | "demo" | "live">("loading");

  const load = useCallback(async () => {
    const result = await loadInstagramEngineItems();
    if (result.mode === "live") {
      setItems(result.items);
      setMode("live");
      return;
    }
    setItems(demoItems);
    setMode("demo");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => ({
    review: items.filter((item) => item.stage === "review").length,
    ready: items.filter((item) => item.stage === "ready").length,
    published: items.filter((item) => item.stage === "published").length,
  }), [items]);

  const filtered = useMemo(() => items.filter((item) => item.stage === filter), [filter, items]);

  return (
    <div className="notes-hub">
      <header className="notes-hub-head">
        <div>
          <span>FLUJO EDITORIAL</span>
          <h1>Notas</h1>
          <p>Abre la siguiente pieza, resuelve lo pendiente y continúa.</p>
        </div>
        <span className={`notes-mode ${mode}`}>
          {mode === "loading" ? <LoaderCircle size={13} className="spin" /> : <i />}
          {mode === "live" ? "En vivo" : mode === "demo" ? "Demo" : "Cargando"}
        </span>
      </header>

      <nav className="notes-tabs" aria-label="Estados de las notas">
        {(Object.keys(filterLabels) as NotesFilter[]).map((key) => (
          <button type="button" key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
            <span>{filterLabels[key]}</span>
            <b>{counts[key]}</b>
          </button>
        ))}
      </nav>

      <section className="notes-list" aria-live="polite">
        {filtered.map((item) => (
          <Link href={noteHref(item)} key={item.id} className="notes-row">
            <span className={`notes-row-icon ${item.stage}`}>
              {item.stage === "review" ? <CircleAlert size={16} /> : <CheckCircle2 size={16} />}
            </span>
            <div>
              <span>{item.publishedAgo.toUpperCase()}</span>
              <strong>{item.title}</strong>
              <small>{item.presenter ?? "Autor por confirmar"} · {item.note}</small>
            </div>
            <span className="notes-row-action">
              {item.stage === "review" ? "Revisar" : item.stage === "ready" ? "Abrir" : "Ver"}
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}

        {!filtered.length ? (
          <div className="notes-empty">
            <FileText size={18} />
            <div><strong>No hay notas en este estado.</strong><span>El sistema actualizará esta lista cuando avance el flujo.</span></div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
