import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2 } from "lucide-react";
import { demoStories } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return demoStories
    .filter((story) => story.status === "published")
    .map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const story = demoStories.find((item) => item.slug === slug && item.status === "published");
  if (!story) return { title: "Noticia no encontrada" };
  return { title: story.title, description: story.summary, openGraph: { title: story.title, description: story.summary, type: "article", publishedTime: story.publishedAt } };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const story = demoStories.find((item) => item.slug === slug && item.status === "published"); if (!story) notFound();
  const jsonLd = { "@context": "https://schema.org", "@type": "NewsArticle", headline: story.title, description: story.summary, datePublished: story.publishedAt, dateModified: story.updatedAt, author: { "@type": "Person", name: story.author }, publisher: { "@type": "Organization", name: "Factomedia Group" }, mainEntityOfPage: `/noticias/${story.slug}` };
  return <main className="article-page"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><header className="article-header"><Link href="/" className="public-logo">FACTO<span>MEDIA</span></Link><Link href="/">Volver a portada</Link></header><article><span className="section-label">{story.category}</span><h1>{story.title}</h1><p className="article-deck">{story.summary}</p><div className="article-info"><div><strong>Por {story.author}</strong><span>Publicado {formatDate(story.publishedAt ?? story.updatedAt)}</span><span>Última actualización {formatDate(story.updatedAt)}</span></div><button><Share2 size={17} /> Compartir</button></div><div className="article-image"><span>IMAGEN EDITORIAL · DEMO</span></div><div className="article-body">{story.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><section className="article-transparency"><span className="eyebrow">TRANSPARENCIA</span><h2>Cómo construimos esta historia</h2><div><strong>{story.sources.length} fuentes consultadas</strong><span>{story.claims.filter((claim) => claim.status === "supported").length} afirmaciones verificadas</span></div>{story.corrections.length > 0 ? <ul>{story.corrections.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Esta nota no registra correcciones.</p>}</section></article></main>;
}
