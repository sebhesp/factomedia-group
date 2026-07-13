"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  FilePlus2,
  Home,
  Newspaper,
  Radio,
  Search,
  SearchCheck,
  Sparkles,
  X,
} from "lucide-react";

const commands = [
  { label: "Ir a Mi mesa", hint: "Inicio", href: "/mi-dia", icon: Home },
  { label: "Buscar noticias recientes", hint: "Radar verificado", href: "/buscar-noticia", icon: SearchCheck },
  { label: "Crear una noticia", hint: "Captura guiada", href: "/desk/noticias/nueva", icon: FilePlus2 },
  { label: "Abrir redacción en vivo", hint: "Factomedia Ahora", href: "/redaccion", icon: Radio },
  { label: "Revisar distribución", hint: "Posts y métricas", href: "/distribucion", icon: BarChart3 },
  { label: "Ver portada pública", hint: "Sitio publicado", href: "/", icon: Newspaper },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return commands;
    return commands.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(value));
  }, [query]);

  function execute(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button type="button" className="command-trigger" onClick={() => setOpen(true)} aria-label="Buscar o ejecutar un comando">
        <Search size={16} />
        <span>Buscar o ejecutar</span>
        <kbd>⌘ K</kbd>
      </button>

      {open && (
        <div className="command-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Paleta de comandos" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-search-row">
              <Search size={19} />
              <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Escribe lo que quieres hacer…" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar"><X size={17} /></button>
            </div>
            <div className="command-context"><Sparkles size={15} /><span>Las acciones frecuentes están disponibles sin memorizar rutas.</span></div>
            <div className="command-list">
              {filtered.map(({ label, hint, href, icon: Icon }) => (
                <button type="button" key={href} onClick={() => execute(href)}>
                  <span><Icon size={17} /></span>
                  <div><strong>{label}</strong><small>{hint}</small></div>
                  <kbd>↵</kbd>
                </button>
              ))}
              {!filtered.length && <div className="command-empty">No encontramos una acción con ese nombre.</div>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
