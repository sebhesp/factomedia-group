"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle, Send, X } from "lucide-react";
import { submitProductFeedback, trackProductEvent, type ProductFeedback } from "@/lib/product-intelligence";

const categories: Array<{ id: ProductFeedback["category"]; label: string }> = [
  { id: "blocked", label: "No encontré cómo avanzar" },
  { id: "error", label: "Algo falló" },
  { id: "too_many_steps", label: "Hay demasiados pasos" },
  { id: "ai_unhelpful", label: "La ayuda de IA no sirvió" },
  { id: "positive", label: "Todo fue claro" },
  { id: "other", label: "Otra cosa" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [category, setCategory] = useState<ProductFeedback["category"]>("other");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  function openWidget() {
    setOpen(true);
    setSent(false);
    trackProductEvent("feedback_opened", { surface: "global_widget" });
  }

  function closeWidget() {
    setOpen(false);
    setScore(0);
    setCategory("other");
    setComment("");
    setSent(false);
  }

  function submit() {
    if (!score) return;
    submitProductFeedback({ score, category, comment });
    setSent(true);
  }

  return (
    <>
      <button type="button" className="feedback-trigger" onClick={openWidget} data-track-id="feedback-trigger">
        <MessageCircle size={16} />
        <span>Dar feedback</span>
      </button>

      {open && (
        <div className="feedback-backdrop" role="presentation" onMouseDown={closeWidget}>
          <section className="feedback-panel" role="dialog" aria-modal="true" aria-label="Enviar feedback" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div><span>MEJORA CONTINUA</span><h2>¿Esta pantalla te ayudó a avanzar?</h2></div>
              <button type="button" onClick={closeWidget} aria-label="Cerrar"><X size={17} /></button>
            </header>

            {sent ? (
              <div className="feedback-success"><CheckCircle2 size={28} /><h3>Gracias. Esto ya cuenta como evidencia.</h3><p>El comentario se relacionó con esta pantalla, sesión y momento del flujo.</p><button type="button" className="button button-primary" onClick={closeWidget}>Cerrar</button></div>
            ) : (
              <>
                <div className="feedback-score" aria-label="Calificación de experiencia">
                  {[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={score === value ? "active" : ""} onClick={() => setScore(value)} aria-label={`${value} de 5`}>{value}</button>)}
                </div>
                <div className="feedback-scale"><span>Me atoré</span><span>Muy claro</span></div>
                <div className="feedback-categories">
                  {categories.map((item) => <button type="button" key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}
                </div>
                <label className="feedback-comment"><span>Cuéntanos qué ocurrió <small>Opcional</small></span><textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={700} rows={4} placeholder="Ejemplo: no entendí cuál era la siguiente acción…" /></label>
                <footer><small>No guardamos el contenido de tus noticias en esta respuesta.</small><button type="button" className="button button-primary" disabled={!score} onClick={submit}><Send size={15} /> Enviar</button></footer>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
