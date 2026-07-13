"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { getLocalStory } from "@/lib/demo-store";
import { formatDate } from "@/lib/utils";

export function DemoArticle() {
  const params = useSearchParams();
  const story = getLocalStory(params.get("id") ?? "");
  if (!story) return <main className="article-page"><header className="article-header"><Link href="/" className="public-logo">FACTO<span>MEDIA</span></Link></header><article><h1>Noticia DEMO no encontrada</h1><p>Este contenido se guarda únicamente en el navegador donde fue creado.</p></article></main>;
  return <main className="article-page"><header className="article-header"><Link href="/" className="public-logo">FACTO<span>MEDIA</span></Link><Link href="/">Volver a portada</Link></header><article><span className="section-label">{story.category}</span><span className="demo-inline">DEMO LOCAL</span><h1>{story.title}</h1><p className="article-deck">{story.summary}</p><div className="article-info"><div><strong>Por {story.author}</strong><span>Publicado {formatDate(story.publishedAt ?? story.updatedAt)}</span><span>Última actualización {formatDate(story.updatedAt)}</span></div><button><Share2 size={17} /> Compartir</button></div><div className="article-image"><span>IMAGEN EDITORIAL · DEMO</span></div><div className="article-body">{story.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><section className="article-transparency"><span className="eyebrow">TRANSPARENCIA</span><h2>Cómo construimos esta historia</h2><div><strong>{story.sources.length} fuentes consultadas</strong><span>{story.claims.filter((claim) => claim.status === "supported").length} afirmaciones verificadas</span></div>{story.corrections.length > 0 ? <ul>{story.corrections.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Esta nota no registra correcciones.</p>}</section></article></main>;
}
