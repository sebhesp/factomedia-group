import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FilePlus2, LockKeyhole, MessageSquareText, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui";
import { demoStories, currentUser } from "@/lib/demo-data";
import { StatusBadge } from "@/components/status-badge";

export default function MyDayPage() {
  const active = demoStories.filter((story) => story.status !== "published");
  return <div className="dashboard"><section className="welcome-row"><div><span className="eyebrow">DOMINGO · 12 JULIO</span><h1>Hola, {currentUser.name}.</h1><p>Tienes una historia cerca de publicación. Empecemos por ahí.</p></div><Link href="/desk/noticias/nueva" className="button button-primary"><FilePlus2 size={18} /> Crear noticia</Link></section>
    <section className="focus-grid"><Card className="goal-card"><div className="card-top"><div><span className="eyebrow">TU META DE HOY</span><strong>{currentUser.completed} de {currentUser.dailyGoal}</strong></div><div className="goal-ring"><span>67%</span></div></div><div className="progress"><span style={{ width: "67%" }} /></div><p>Has completado 2 de tus 3 aportaciones de hoy.</p></Card><Card className="next-card"><div className="next-icon"><Clock3 size={20} /></div><div><span className="eyebrow">SIGUIENTE ACCIÓN</span><h2>Confirma una fuente pendiente</h2><p>Festival independiente anuncia programación y sedes para agosto.</p><Link href="/desk/noticias/demo-3">Continuar noticia <ArrowRight size={16} /></Link></div></Card></section>
    <section className="metric-strip"><div><CheckCircle2 /><strong>2</strong><span>Entregadas hoy</span></div><div><MessageSquareText /><strong>1</strong><span>Solicitud del editor</span></div><div><LockKeyhole /><strong>1</strong><span>Bloqueada</span></div><div><TrendingUp /><strong>1,842</strong><span>Vistas recientes</span></div></section>
    <section className="dashboard-section"><div className="section-heading compact-heading"><div><span>01</span><h2>Noticias activas</h2></div><Link href="/redaccion">Ver redacción</Link></div><div className="story-list">{active.map((story) => <Link className="story-row" href={`/desk/noticias/${story.id}`} key={story.id}><div><span className="story-category">{story.category}</span><h3>{story.title}</h3><p>Responsable: {story.responsible}</p></div><div className="story-row-end"><StatusBadge status={story.status} /><ArrowRight size={18} /></div></Link>)}</div></section>
    <section className="dashboard-section"><div className="section-heading compact-heading"><div><span>02</span><h2>Resultados recientes</h2></div><p>Contexto, no competencia.</p></div><Card className="result-card"><div><span className="eyebrow">PUBLICADA HOY</span><h3>{demoStories[0].title}</h3></div><div className="result-metrics"><span><strong>1,842</strong> vistas</span><span><strong>60%</strong> lectura completa</span><span><strong>94</strong> compartidos</span></div></Card></section>
  </div>;
}
