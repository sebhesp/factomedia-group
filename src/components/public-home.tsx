"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Menu, Search } from "lucide-react";
import { demoStories } from "@/lib/demo-data";
import { listLocalStories } from "@/lib/demo-store";
import { formatDate } from "@/lib/utils";
import type { Story } from "@/lib/types";

export function PublicHome() {
  const [localStories, setLocalStories] = useState<Story[]>([]);
  useEffect(() => {
    const refresh = () => setLocalStories(listLocalStories());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("facto:story-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("facto:story-updated", refresh);
    };
  }, []);

  const published = useMemo(() => {
    const local = localStories.filter((story) => ["published", "updated", "corrected"].includes(story.status));
    const builtIn = demoStories.filter((story) => story.status === "published");
    return [...local, ...builtIn].sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
  }, [localStories]);

  const [lead, ...rest] = published;
  if (!lead) return null;
  const hrefFor = (story: Story) => story.id.startsWith("demo-") ? `/noticias/${story.slug}` : `/noticias/borrador-demo?id=${story.id}`;

  return (
    <main className="public-site">
      <header className="public-header">
        <Link href="/" className="public-logo">FACTO<span>MEDIA</span></Link>
        <nav><a href="#recientes">Últimas</a><a href="#categorias">Categorías</a><Link href="/login">Colaboradores</Link></nav>
        <div className="public-tools"><button aria-label="Buscar"><Search size={19} /></button><button aria-label="Menú"><Menu size={20} /></button></div>
      </header>
      <section className="news-ticker"><span>EN ESTE MOMENTO</span><p>La portada se alimenta de Noticias Maestras aprobadas. Los contenidos creados en este navegador están marcados como DEMO.</p></section>
      <section className="public-hero">
        <div className="hero-copy"><span className="section-label">{lead.category}</span>{lead.demo && <span className="demo-inline">DEMO</span>}<h1>{lead.title}</h1><p>{lead.summary}</p><div className="article-byline">Por {lead.author} · {formatDate(lead.publishedAt ?? lead.updatedAt)}</div><Link href={hrefFor(lead)} className="read-link">Leer historia <ArrowRight size={18} /></Link></div>
        <div className="hero-visual"><div className="visual-grid" /><div className="visual-caption"><span>DEMO</span> Espacio reservado para el recurso principal de la noticia.</div></div>
      </section>
      <section id="recientes" className="latest-section"><div className="section-heading"><div><span>02</span><h2>Lo más reciente</h2></div><p>Historias verificadas, contexto y seguimiento.</p></div><div className="article-grid">{rest.concat(lead).map((story, index) => <article className="public-card" key={story.id}><div className={`card-visual visual-${(index % 3) + 1}`}><span>DEMO</span></div><div className="card-content"><span className="section-label">{story.category}</span><h3><Link href={hrefFor(story)}>{story.title}</Link></h3><p>{story.summary}</p><div className="article-byline">{story.author} · {formatDate(story.publishedAt ?? story.updatedAt)}</div></div></article>)}</div></section>
      <section id="categorias" className="categories-band"><span>Explora por tema</span>{["Ciudad", "Política", "Cultura", "Música", "Economía", "Tecnología"].map((item) => <a href="#recientes" key={item}>{item}</a>)}</section>
      <footer className="public-footer"><div className="public-logo public-logo-light">FACTO<span>MEDIA</span></div><p>Claridad antes que ruido. Contexto antes que velocidad vacía.</p><div><Link href="/login">Acceso interno</Link><span>© 2026 Factomedia Group</span></div></footer>
    </main>
  );
}
