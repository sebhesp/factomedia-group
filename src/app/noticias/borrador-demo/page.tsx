import { Suspense } from "react";
import { DemoArticle } from "@/components/demo-article";
export default function DemoArticlePage() {
  return <Suspense fallback={<main className="article-page"><p>Cargando noticia…</p></main>}><DemoArticle /></Suspense>;
}
