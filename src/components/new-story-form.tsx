"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileAudio,
  FileText,
  ImageIcon,
  Link2,
  Mic2,
  Sparkles,
  Type,
  Video,
} from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { slugify } from "@/lib/utils";
import type { Story } from "@/lib/types";
import { saveLocalStory } from "@/lib/demo-store";

const starts = [
  { id: "text", label: "Texto", icon: Type },
  { id: "note", label: "Nota rápida", icon: Mic2 },
  { id: "link", label: "Enlace", icon: Link2 },
  { id: "image", label: "Imagen", icon: ImageIcon },
  { id: "audio", label: "Audio", icon: FileAudio },
  { id: "video", label: "Video", icon: Video },
  { id: "document", label: "Documento", icon: FileText },
] as const;

type StartType = (typeof starts)[number]["id"];
type Step = 1 | 2 | 3;

function detectCategory(text: string) {
  const normalized = text.toLowerCase();
  if (/música|artista|festival|concierto|álbum/.test(normalized)) return "Música";
  if (/gobierno|congreso|president|elección|política/.test(normalized)) return "Política";
  if (/tecnología|software|aplicación|inteligencia artificial|digital/.test(normalized)) return "Tecnología";
  if (/economía|precio|mercado|empresa|empleo/.test(normalized)) return "Economía";
  if (/museo|cine|libro|cultura|exposición/.test(normalized)) return "Cultura";
  return "Ciudad";
}

function makeTitle(text: string) {
  const firstSentence = text.split(/[.!?\n]/).find((part) => part.trim().length > 12)?.trim() ?? text.trim();
  const words = firstSentence.split(/\s+/).slice(0, 12);
  const candidate = words.join(" ").replace(/^./, (letter) => letter.toUpperCase());
  return candidate.length > 82 ? `${candidate.slice(0, 79)}…` : candidate;
}

function makeSummary(text: string) {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= 220) return compact;
  return `${compact.slice(0, 217).replace(/\s+\S*$/, "")}…`;
}

export function NewStoryForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [startType, setStartType] = useState<StartType>("text");
  const [material, setMaterial] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Ciudad");
  const [message, setMessage] = useState("");

  const materialReady = material.trim().length >= 30;
  const essentialsReady = title.trim().length >= 8 && summary.trim().length >= 25;

  const helper = useMemo(() => {
    if (step === 1) return {
      number: "01",
      title: "Trae lo que tengas",
      body: "No necesitas llegar con una nota escrita. Una idea, audio, enlace o párrafo es suficiente para empezar.",
      items: ["La IA ordenará el material", "Nada se publica automáticamente", "Puedes corregir todo antes de avanzar"],
    };
    if (step === 2) return {
      number: "02",
      title: "Dale una forma clara",
      body: "Revisa las sugerencias. El sistema te ayuda a estructurar, pero tú conservas el criterio editorial.",
      items: ["Título provisional", "Resumen de lo importante", "Categoría inicial"],
    };
    return {
      number: "03",
      title: "Listo para investigar",
      body: "Al crear la Noticia Maestra entrarás a una sala guiada que te mostrará exactamente qué falta para enviarla a revisión.",
      items: ["Agregar fuentes", "Separar afirmaciones", "Verificar antes de enviar"],
    };
  }, [step]);

  function organizeWithAssistant() {
    if (!materialReady) {
      setMessage("Agrega un poco más de contexto. Con unas dos oraciones podremos ayudarte mejor.");
      return;
    }
    setTitle((current) => current || makeTitle(material));
    setSummary((current) => current || makeSummary(material));
    setCategory(detectCategory(material));
    setMessage("");
    setStep(2);
  }

  function continueManually() {
    setMessage("");
    setStep(2);
  }

  function reviewStory() {
    if (!essentialsReady) {
      setMessage("Completa un título claro y un resumen breve para continuar. No tienen que ser definitivos.");
      return;
    }
    setMessage("");
    setStep(3);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!essentialsReady) {
      setStep(2);
      setMessage("Revisa el título y el resumen antes de crear la Noticia Maestra.");
      return;
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const story: Story = {
      id,
      slug: slugify(title),
      title: title.trim(),
      summary: summary.trim(),
      body: material.trim(),
      category,
      status: "draft",
      author: "Mariana Torres",
      responsible: "Mariana Torres",
      sources: [],
      claims: [],
      createdAt: now,
      updatedAt: now,
      corrections: [],
      events: [{
        id: crypto.randomUUID(),
        type: "Noticia creada",
        actor: "Mariana Torres",
        occurredAt: now,
        comment: `Creada desde ${startType} con recorrido guiado`,
      }],
      metrics: { views: 0, readsStarted: 0, readsCompleted: 0, shares: 0 },
      demo: true,
    };

    saveLocalStory(story);
    router.push(`/desk/noticias/sala?id=${id}`);
  }

  return (
    <form onSubmit={save} className="new-story-layout">
      <section>
        <div className="page-heading">
          <span className="eyebrow">NOTICIA MAESTRA</span>
          <h1>Cuéntanos qué tienes. Te guiamos con lo demás.</h1>
          <p>Avanza en tres pasos pequeños. Siempre verás qué sigue y por qué.</p>
        </div>

        <div className="journey-stepper" aria-label="Progreso de creación">
          {["Captura", "Organiza", "Confirma"].map((label, index) => {
            const number = (index + 1) as Step;
            return (
              <div key={label} className={`journey-step ${step === number ? "active" : ""} ${step > number ? "done" : ""}`}>
                <span>{step > number ? <CheckCircle2 size={15} /> : number}</span>
                <strong>{label}</strong>
              </div>
            );
          })}
        </div>

        {step === 1 && (
          <div className="guided-stage">
            <div className="start-grid">
              {starts.map(({ id, label, icon: Icon }) => (
                <button type="button" key={id} onClick={() => setStartType(id)} className={startType === id ? "start-option selected" : "start-option"}>
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <Card className="capture-card">
              <div className="field-heading">
                <div>
                  <label className="field-label" htmlFor="initial-material">Material inicial</label>
                  <p>No lo edites de más. Pega la información como la recibiste.</p>
                </div>
                <span>{material.trim().length} caracteres</span>
              </div>
              {startType === "link" ? (
                <Input id="initial-material" value={material} onChange={(event) => setMaterial(event.target.value)} type="url" placeholder="Pega el enlace y agrega una nota breve sobre qué encontraste…" />
              ) : (
                <Textarea id="initial-material" value={material} onChange={(event) => setMaterial(event.target.value)} placeholder={startType === "text" || startType === "note" ? "Escribe o pega lo que sabes hasta ahora…" : "Describe brevemente qué contiene el archivo y por qué puede ser noticia…"} rows={8} />
              )}
            </Card>

            {message && <div className="inline-guidance warning"><CircleAlert size={17} /><span>{message}</span></div>}

            <div className="step-actions">
              <Button type="button" onClick={organizeWithAssistant}><Sparkles size={17} /> Organizar con ayuda</Button>
              <Button type="button" variant="ghost" onClick={continueManually}>Prefiero hacerlo manualmente</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="guided-stage">
            <Card className="assistant-intro-card">
              <Sparkles size={21} />
              <div>
                <span className="eyebrow">ASISTENTE EDITORIAL · DEMO</span>
                <h2>Ya ordenamos una primera versión</h2>
                <p>Estas son sugerencias editables generadas localmente. Revisa, corrige y conserva solo lo que represente bien la historia.</p>
              </div>
            </Card>

            <Card className="details-card">
              <div className="form-grid">
                <label>Título provisional
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="¿Qué ocurrió?" />
                  <small>Debe permitir reconocer la historia, no ganar clics.</small>
                </label>
                <label>Categoría
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="input">
                    <option>Ciudad</option><option>Política</option><option>Cultura</option><option>Música</option><option>Economía</option><option>Tecnología</option>
                  </select>
                </label>
                <label className="full">Resumen
                  <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} placeholder="¿Qué pasó y por qué importa?" />
                  <small>Con dos o tres oraciones es suficiente para comenzar.</small>
                </label>
              </div>
            </Card>

            {message && <div className="inline-guidance warning"><CircleAlert size={17} /><span>{message}</span></div>}

            <div className="step-actions split">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}><ArrowLeft size={17} /> Volver</Button>
              <Button type="button" onClick={reviewStory}>Revisar antes de crear <ArrowRight size={17} /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="guided-stage">
            <Card className="creation-review-card">
              <span className="eyebrow">ANTES DE CONTINUAR</span>
              <h2>Esta será tu base de trabajo</h2>
              <div className="creation-preview">
                <span>{category}</span>
                <h3>{title}</h3>
                <p>{summary}</p>
              </div>
              <div className="readiness-list">
                <div><CheckCircle2 size={17} /><span>La historia tiene una idea reconocible</span></div>
                <div><CheckCircle2 size={17} /><span>Podrás modificar título y resumen después</span></div>
                <div><CheckCircle2 size={17} /><span>El siguiente paso será agregar evidencia</span></div>
              </div>
            </Card>

            <div className="inline-guidance success"><CheckCircle2 size={17} /><span>No necesitas tener todo resuelto. La Sala de Noticia te acompañará hasta que esté lista para revisión.</span></div>

            <div className="step-actions split">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}><ArrowLeft size={17} /> Ajustar</Button>
              <Button type="submit">Crear y seguir con la evidencia <ArrowRight size={17} /></Button>
            </div>
          </div>
        )}
      </section>

      <aside className="helper-panel guided-helper">
        <span className="helper-number">{helper.number}</span>
        <h3>{helper.title}</h3>
        <p>{helper.body}</p>
        <hr />
        <strong>En este paso</strong>
        <ul>{helper.items.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="assistant-boundary">
          <Sparkles size={16} />
          <span>La IA propone y ordena. Tú verificas y decides.</span>
        </div>
      </aside>
    </form>
  );
}
