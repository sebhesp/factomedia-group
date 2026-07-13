import { AlertTriangle, CheckCircle2, Clock3, FileCheck2, Gauge, ShieldQuestion } from "lucide-react";
import { Card } from "@/components/ui";
import { demoStories } from "@/lib/demo-data";
import { StatusBadge } from "@/components/status-badge";

export default function NewsroomPage() {
  const stats = [
    { label: "Publicadas hoy", value: "4", icon: CheckCircle2 }, { label: "En revisión", value: "3", icon: FileCheck2 },
    { label: "Bloqueadas", value: "1", icon: AlertTriangle }, { label: "Por verificar", value: "5", icon: ShieldQuestion },
    { label: "Tiempo promedio", value: "3h 18m", icon: Clock3 }, { label: "Meta del equipo", value: "72%", icon: Gauge },
  ];
  return <div className="newsroom"><div className="page-heading"><span className="eyebrow">OPERACIÓN DEL EQUIPO · DEMO</span><h1>Redacción en vivo</h1><p>Una vista accionable del flujo editorial. Sin rankings individuales ni métricas de vigilancia.</p></div><div className="newsroom-stats">{stats.map(({ label, value, icon: Icon }) => <Card key={label}><Icon size={19} /><strong>{value}</strong><span>{label}</span></Card>)}</div><section className="dashboard-section"><div className="section-heading compact-heading"><div><span>01</span><h2>Flujo actual</h2></div><p>Prioridad: resolver bloqueos.</p></div><div className="kanban">{["review", "verification", "published"].map((status) => <div className="kanban-column" key={status}><h3>{status === "review" ? "En revisión" : status === "verification" ? "Verificación" : "Publicadas"}</h3>{demoStories.filter((s) => s.status === status || (status === "verification" && s.claims.some(c => c.status === "pending"))).map((story) => <Card key={story.id} className="kanban-card"><StatusBadge status={story.status} /><strong>{story.title}</strong><span>{story.author}</span></Card>)}</div>)}</div></section></div>;
}
