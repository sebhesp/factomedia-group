"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileAudio, FileText, ImageIcon, Link2, Mic2, Type, Video } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { slugify } from "@/lib/utils";
import type { Story } from "@/lib/types";
import { saveLocalStory } from "@/lib/demo-store";

const starts = [
  { id: "text", label: "Texto", icon: Type }, { id: "note", label: "Nota rápida", icon: Mic2 },
  { id: "link", label: "Enlace", icon: Link2 }, { id: "image", label: "Imagen", icon: ImageIcon },
  { id: "audio", label: "Audio", icon: FileAudio }, { id: "video", label: "Video", icon: Video },
  { id: "document", label: "Documento", icon: FileText },
];

export function NewStoryForm() {
  const router = useRouter();
  const [startType, setStartType] = useState("text");
  const [expanded, setExpanded] = useState(false);

  function save(formData: FormData) {
    const title = String(formData.get("title") || "Noticia sin título");
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const story: Story = {
      id, slug: slugify(title), title,
      summary: String(formData.get("summary") || ""),
      body: String(formData.get("body") || ""),
      category: String(formData.get("category") || "General"),
      status: "draft", author: "Mariana Torres", responsible: "Mariana Torres",
      sources: [], claims: [], createdAt: now, updatedAt: now, corrections: [],
      events: [{ id: crypto.randomUUID(), type: "Noticia creada", actor: "Mariana Torres", occurredAt: now, comment: `Creada desde ${startType}` }],
      metrics: { views: 0, readsStarted: 0, readsCompleted: 0, shares: 0 }, demo: true,
    };
    saveLocalStory(story);
    router.push(`/desk/noticias/${id}`);
  }

  return (
    <form action={save} className="new-story-layout">
      <section>
        <div className="page-heading"><span className="eyebrow">NOTICIA MAESTRA</span><h1>¿Qué tienes para contar?</h1><p>Empieza con lo que ya tienes. Podrás ordenar y completar la información después.</p></div>
        <div className="start-grid">{starts.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => setStartType(id)} className={startType === id ? "start-option selected" : "start-option"}><Icon size={20} /><span>{label}</span></button>)}</div>
        <Card className="capture-card">
          <label className="field-label">Material inicial</label>
          {startType === "link" ? <Input name="body" type="url" placeholder="Pega aquí el enlace…" /> : startType === "text" || startType === "note" ? <Textarea name="body" placeholder="Escribe o pega la información inicial…" rows={7} /> : <div className="drop-zone"><span>Selecciona o arrastra un archivo</span><small>En esta versión DEMO se registra la intención; Supabase Storage se conecta con las variables de entorno.</small></div>}
        </Card>
        {!expanded ? <Button type="button" onClick={() => setExpanded(true)}>Continuar y organizar</Button> : <Card className="details-card"><h2>Datos esenciales</h2><div className="form-grid"><label>Título provisional<Input name="title" required placeholder="Un título claro para identificar la historia" /></label><label>Categoría<select name="category" className="input"><option>Ciudad</option><option>Política</option><option>Cultura</option><option>Música</option><option>Economía</option><option>Tecnología</option></select></label><label className="full">Resumen<Textarea name="summary" rows={3} placeholder="¿Qué ocurrió y por qué importa?" /></label></div><div className="form-actions"><Button type="submit">Crear Noticia Maestra</Button><span>Se guardará como borrador DEMO.</span></div></Card>}
      </section>
      <aside className="helper-panel"><span className="helper-number">01</span><h3>Empieza pequeño</h3><p>No necesitas llenar un formulario completo. Captura la pieza principal y el sistema te mostrará el siguiente paso.</p><hr /><strong>Después podrás:</strong><ul><li>Agregar fuentes y materiales</li><li>Separar afirmaciones verificables</li><li>Solicitar revisión editorial</li></ul></aside>
    </form>
  );
}
