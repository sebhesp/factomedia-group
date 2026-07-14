import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Share2 } from "lucide-react";
import { demoStories } from "@/lib/demo-data";
import { getPublicArticleBySlug, type PublicArticle } from "@/lib/public-articles";
import { formatDate } from "@/lib/utils";

export const dynamicParams = true;

export function generateStaticParams() {
  return demoStories
    .filter((story) => story.status === "published")
    .map((story) => ({ slug: story.slug }));
}

async function resolveArticle(slug: string) {
  const demo = demoStories.find((item) => item.slug === slug && item.status === "published");
  if (demo) return { mode: "demo" as const, story: demo };
  const live = await getPublicArticleBySlug(slug);
  if (live) return { mode: "live" as const, story: live };
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await resolveArticle(slug);
  if (!result) return { title: "Noticia no encontrada" };

  if (result.mode === "demo") {
    return {
      title: result.story.title,
      description: result.story.summary,
      openGraph: {
        title: result.story.title,
        description: result.story.summary,
        type: "article",
        publishedTime: result.story.publishedAt,
      },
    };
  }

  const article = result.story;
  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.dek,
    alternates: article.canonicalUrl ? { canonical: article.canonicalUrl } : undefined,
    openGraph: {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? article.dek,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: article.coverUrl ? [{ url: article.coverUrl, alt: article.coverAlt ?? article.title }] : undefined,
    },
  };
}

function LiveArticle({ article }: { article: PublicArticle }) {
  const paragraphs = [article.lead, article.body, article.context]
    .filter(Boolean)
    .join("\n\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.dek,
    image: article.coverUrl ? [article.coverUrl] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: { "@type": "Person", name: article.authorName },
    publisher: { "@type": "Organization", name: "El Facto Media Group" },
    mainEntityOfPage: article.canonicalUrl ?? `/noticias/${article.slug}`,
  };

  return (
    <main className="article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="article-header">
        <Link href="/" className="public-logo">EL FACTO<span>MEDIA GROUP</span></Link>
        <Link href="/">Volver a portada</Link>
      </header>
      <article>
        <span className="section-label">{article.section}</span>
        <h1>{article.title}</h1>
        <p className="article-deck">{article.dek}</p>
        <div className="article-info">
          <div>
            <strong>Por {article.authorName}</strong>
            <span>Publicado {formatDate(article.publishedAt)}</span>
            <span>Última actualización {formatDate(article.updatedAt)}</span>
          </div>
          <button type="button"><Share2 size={17} /> Compartir</button>
        </div>
        {article.coverUrl ? (
          <figure className="article-image">
            {/* Native img keeps remote Instagram or storage URLs compatible before image domains are finalized. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverUrl} alt={article.coverAlt ?? article.title} />
          </figure>
        ) : (
          <div className="article-image"><span>IMAGEN EDITORIAL PENDIENTE</span></div>
        )}
        <div className="article-body">
          {paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 32)}`}>{paragraph}</p>)}
        </div>
        <section className="article-transparency">
          <span className="eyebrow">ORIGEN Y TRANSPARENCIA</span>
          <h2>Esta nota nació de una publicación revisada por El Facto.</h2>
          <p>El contenido audiovisual fue transcrito y adaptado al formato web. La aprobación final permanece en manos del equipo editorial.</p>
          <a href={article.instagramPermalink} target="_blank" rel="noreferrer">Ver Reel original <ExternalLink size={15} /></a>
        </section>
      </article>
    </main>
  );
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await resolveArticle(slug);
  if (!result) notFound();

  if (result.mode === "live") return <LiveArticle article={result.story} />;

  const story = result.story;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: story.title,
    description: story.summary,
    datePublished: story.publishedAt,
    dateModified: story.updatedAt,
    author: { "@type": "Person", name: story.author },
    publisher: { "@type": "Organization", name: "El Facto Media Group" },
    mainEntityOfPage: `/noticias/${story.slug}`,
  };

  return (
    <main className="article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="article-header"><Link href="/" className="public-logo">EL FACTO<span>MEDIA GROUP</span></Link><Link href="/">Volver a portada</Link></header>
      <article>
        <span className="section-label">{story.category}</span>
        <h1>{story.title}</h1>
        <p className="article-deck">{story.summary}</p>
        <div className="article-info"><div><strong>Por {story.author}</strong><span>Publicado {formatDate(story.publishedAt ?? story.updatedAt)}</span><span>Última actualización {formatDate(story.updatedAt)}</span></div><button type="button"><Share2 size={17} /> Compartir</button></div>
        <div className="article-image"><span>IMAGEN EDITORIAL · DEMO</span></div>
        <div className="article-body">{story.body.split("\n\n").map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <section className="article-transparency"><span className="eyebrow">TRANSPARENCIA</span><h2>Cómo construimos esta historia</h2><div><strong>{story.sources.length} fuentes consultadas</strong><span>{story.claims.filter((claim) => claim.status === "supported").length} afirmaciones verificadas</span></div>{story.corrections.length > 0 ? <ul>{story.corrections.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Esta nota no registra correcciones.</p>}</section>
      </article>
    </main>
  );
}
