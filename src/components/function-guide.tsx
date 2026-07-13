"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleGauge,
  CircleHelp,
  FilePlus2,
  ListChecks,
  Menu,
  MousePointer2,
  Newspaper,
  PanelRightOpen,
  Radio,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

type GuideFeature = {
  title: string;
  body: string;
  icon: LucideIcon;
};

type GuideContent = {
  title: string;
  summary: string;
  next: string;
  features: GuideFeature[];
};

type RouteGuide = GuideContent & {
  match: (pathname: string) => boolean;
};

const guides: RouteGuide[] = [
  {
    match: (pathname) => pathname === "/",
    title: "Portada pública",
    summary: "La portada muestra cómo verá la audiencia las historias publicadas y cómo se organiza la propuesta editorial.",
    next: "Entra a Login para abrir el modo DEMO o abre una noticia pública para revisar la experiencia de lectura.",
    features: [
      { title: "Historia principal", body: "Presenta la cobertura destacada y lleva a la lectura completa.", icon: Newspaper },
      { title: "Últimas historias", body: "Agrupa tarjetas editoriales con categoría, resumen y acceso directo a cada nota.", icon: ListChecks },
      { title: "Categorías", body: "Permite explorar por tema sin depender de una búsqueda.", icon: Route },
      { title: "Acceso interno", body: "Conecta la portada con el espacio de trabajo para colaboradoras y editoras.", icon: MousePointer2 },
    ],
  },
  {
    match: (pathname) => pathname === "/login",
    title: "Acceso y modo DEMO",
    summary: "Esta pantalla separa el acceso real del recorrido de presentación para que puedas demostrar la plataforma sin configurar cuentas.",
    next: "Usa Entrar en modo DEMO para llegar a Mi mesa y comenzar el flujo editorial.",
    features: [
      { title: "Entrar en modo DEMO", body: "Abre el flujo completo con datos precargados y sin depender de Supabase.", icon: Sparkles },
      { title: "Inicio de sesión real", body: "Mantiene listo el camino para conectar autenticación cuando se active el entorno productivo.", icon: ShieldCheck },
      { title: "Persistencia local", body: "Conserva avances de demostración en el navegador durante la sesión.", icon: CheckCircle2 },
      { title: "Regreso a portada", body: "Permite mostrar la diferencia entre experiencia pública y operación interna.", icon: Newspaper },
    ],
  },
  {
    match: (pathname) => pathname === "/mi-dia",
    title: "Mi mesa",
    summary: "Es el centro de trabajo diario: captura señales, prioriza historias y muestra la siguiente acción editorial.",
    next: "Prueba la Captura universal o usa el Menú Más en celular para abrir Distribución, Aprendizajes o Portada.",
    features: [
      { title: "Captura universal", body: "Recibe texto, enlaces, notas o archivos para convertir una señal en una historia ordenada.", icon: FilePlus2 },
      { title: "Modos de entrada", body: "Cambia entre escribir, pegar enlace, nota de voz o adjunto sin abandonar la pantalla.", icon: PanelRightOpen },
      { title: "Abrir espacio nuevo", body: "Crea una sala de noticia incluso cuando todavía no tienes material inicial.", icon: Sparkles },
      { title: "Siguiente acción", body: "Muestra qué desbloquea más avance: fuente, afirmación, verificación o revisión.", icon: CircleGauge },
      { title: "Historias activas", body: "Lista el trabajo en curso con estado, prioridad y porcentaje de preparación.", icon: ListChecks },
      { title: "Menú Más móvil", body: "En celulares reúne Distribución, Aprendizajes y Portada para que la navegación no se pierda.", icon: Menu },
    ],
  },
  {
    match: (pathname) => pathname === "/buscar-noticia",
    title: "Buscar noticia",
    summary: "El radar ayuda a encontrar señales noticiosas sin confundir popularidad con verificación.",
    next: "Elige una señal y crea una Noticia Maestra para llevarla a la sala editorial.",
    features: [
      { title: "Alcance de radar", body: "Cambia el foco entre señales locales, nacionales o especializadas.", icon: SearchCheck },
      { title: "Fuentes visibles", body: "Muestra de dónde viene cada señal y qué tan diversa es la evidencia.", icon: ShieldCheck },
      { title: "Lectura de incertidumbre", body: "Separa confirmado, corroborado y pendiente para no sobreprometer.", icon: CircleHelp },
      { title: "Crear Noticia Maestra", body: "Convierte una señal relevante en un expediente editable dentro de la redacción.", icon: FilePlus2 },
    ],
  },
  {
    match: (pathname) => pathname === "/desk/noticias/nueva",
    title: "Captura guiada",
    summary: "Acompaña la creación de una noticia desde material suelto hasta un borrador revisable.",
    next: "Completa el material inicial y revisa cómo la guía ordena título, resumen, cuerpo y evidencia.",
    features: [
      { title: "Ruta asistida", body: "La IA propone una estructura inicial que puede aceptarse, corregirse o ignorarse.", icon: Sparkles },
      { title: "Ruta manual", body: "Permite completar campos por cuenta propia cuando la historia exige criterio editorial directo.", icon: MousePointer2 },
      { title: "Revisión antes de guardar", body: "Evita publicar o avanzar sin confirmar que la base de la historia es clara.", icon: CheckCircle2 },
      { title: "Ayuda lateral", body: "Explica qué se espera en cada paso sin ocultar el formulario principal.", icon: PanelRightOpen },
    ],
  },
  {
    match: (pathname) => pathname === "/desk/noticias/sala",
    title: "Sala de noticia",
    summary: "La sala concentra texto, fuentes, afirmaciones, decisiones y trazabilidad de una Noticia Maestra.",
    next: "Agrega una fuente o verifica una afirmación para ver cómo cambia el progreso editorial.",
    features: [
      { title: "Noticia Maestra", body: "Mantiene un núcleo editorial único para editar, verificar y distribuir sin duplicar versiones.", icon: Newspaper },
      { title: "Fuentes", body: "Registra evidencia, origen y notas para sostener cada decisión.", icon: ShieldCheck },
      { title: "Afirmaciones", body: "Separa datos verificables del texto narrativo y muestra su estado.", icon: ListChecks },
      { title: "Guía de avance", body: "Calcula qué falta antes de solicitar revisión o aprobación.", icon: CircleGauge },
      { title: "Asistente editorial", body: "Sugiere mejoras, titulares o pasos siguientes, siempre revisables por humanos.", icon: Sparkles },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/desk/noticias/"),
    title: "Detalle editorial",
    summary: "Esta vista resume el estado de una historia y permite revisar su preparación antes de publicarla o distribuirla.",
    next: "Revisa evidencia, estado y relación con publicaciones para explicar el ciclo completo.",
    features: [
      { title: "Estado editorial", body: "Indica si la historia está en borrador, revisión, aprobación o publicada.", icon: CircleGauge },
      { title: "Evidencia asociada", body: "Conecta fuentes y afirmaciones con el texto final.", icon: ShieldCheck },
      { title: "Trazabilidad", body: "Hace visible quién avanzó cada paso y por qué.", icon: Route },
      { title: "Salida pública", body: "Prepara la historia para que pueda leerse en portada con contexto suficiente.", icon: Newspaper },
    ],
  },
  {
    match: (pathname) => pathname === "/redaccion",
    title: "Redacción en vivo",
    summary: "Muestra el pulso operativo: qué está avanzando, qué está bloqueado y qué necesita una decisión editorial.",
    next: "Abre una historia bloqueada o compara los indicadores para explicar cómo se decide la prioridad.",
    features: [
      { title: "Pulso de cobertura", body: "Resume historias activas, bloqueos, revisiones y verificaciones pendientes.", icon: Radio },
      { title: "Riesgos visibles", body: "Resalta historias que necesitan fuente, validación o decisión de edición.", icon: ShieldCheck },
      { title: "Priorización", body: "Ordena el trabajo por lo que desbloquea más avance editorial.", icon: CircleGauge },
      { title: "Acceso rápido", body: "Permite saltar de estado general a la sala de una noticia concreta.", icon: MousePointer2 },
    ],
  },
  {
    match: (pathname) => pathname === "/distribucion",
    title: "Distribución",
    summary: "Concentra publicaciones, métricas y alertas para entender cómo viaja una noticia después de salir.",
    next: "Cambia entre En vivo, Publicaciones, Historias y Alertas; luego abre una publicación individual.",
    features: [
      { title: "En vivo", body: "Resume vistas, interacciones, clics y publicaciones que están creciendo.", icon: BarChart3 },
      { title: "Publicaciones", body: "Filtra posts por plataforma, origen o texto, incluyendo contenido creado fuera de Factomedia.", icon: ListChecks },
      { title: "Historias", body: "Agrupa el rendimiento por Noticia Maestra para leer impacto acumulado.", icon: Newspaper },
      { title: "Alertas", body: "Señala oportunidades, riesgos o publicaciones que requieren seguimiento.", icon: CircleHelp },
      { title: "Sincronizar ahora", body: "Simula la llegada de métricas nuevas y actualiza el tablero de demostración.", icon: Route },
    ],
  },
  {
    match: (pathname) => pathname === "/distribucion/post",
    title: "Detalle de publicación",
    summary: "Explica una publicación específica: origen, rendimiento, relación con historia y señales de seguimiento.",
    next: "Relaciona el post con una Noticia Maestra o sincroniza métricas para mostrar el monitoreo.",
    features: [
      { title: "Origen del post", body: "Distingue publicaciones creadas desde Factomedia de las importadas desde una red social.", icon: Route },
      { title: "Métricas históricas", body: "Muestra cómo cambian vistas, interacciones, clics y seguidores en el tiempo.", icon: BarChart3 },
      { title: "Vincular historia", body: "Permite asociar una publicación externa con su Noticia Maestra.", icon: Newspaper },
      { title: "Identificar autora", body: "Ayuda a resolver cuentas externas para completar la trazabilidad.", icon: ShieldCheck },
    ],
  },
  {
    match: (pathname) => pathname === "/aprendizajes",
    title: "Aprendizajes",
    summary: "Convierte eventos, fricciones y feedback en evidencia para mejorar la plataforma sin adivinar.",
    next: "Abre la guía, deja feedback y regresa a Aprendizajes para ver cómo se registra la señal.",
    features: [
      { title: "Eventos de uso", body: "Registra navegación, captura, errores y acciones clave sin guardar contenido sensible.", icon: Route },
      { title: "Feedback", body: "Permite reportar claridad, bloqueo o fallas desde cualquier pantalla.", icon: CircleHelp },
      { title: "Insights", body: "Agrupa señales en recomendaciones con severidad y evidencia.", icon: BrainCircuit },
      { title: "Experimentos", body: "Deja espacio para probar mejoras con métricas de protección.", icon: CheckCircle2 },
      { title: "Salud del producto", body: "Muestra si hay suficiente evidencia para actuar con confianza.", icon: ShieldCheck },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/noticias/"),
    title: "Lectura pública",
    summary: "Es la vista de una noticia publicada o de demostración para validar claridad, confianza y trazabilidad ante lectores.",
    next: "Muestra el contraste entre esta lectura pública y la sala editorial que la originó.",
    features: [
      { title: "Cuerpo editorial", body: "Presenta la historia en una lectura limpia, enfocada y compartible.", icon: Newspaper },
      { title: "Contexto de confianza", body: "Expone señales de verificación, autoría o corrección cuando están disponibles.", icon: ShieldCheck },
      { title: "Métricas de lectura", body: "La historia puede alimentar datos de lectura, inicio, finalización y compartidos.", icon: BarChart3 },
      { title: "Correcciones", body: "Conserva un espacio para transparentar cambios relevantes después de publicar.", icon: CheckCircle2 },
    ],
  },
];

const fallbackGuide: GuideContent = {
  title: "Guía contextual",
  summary: "Esta guía acompaña la pantalla actual y resume qué funciones vale la pena mostrar durante la presentación.",
  next: "Explora la navegación principal; el contenido de esta guía cambiará según la sección.",
  features: [
    { title: "Navegación", body: "Usa la barra lateral o el menú móvil para recorrer los módulos principales.", icon: Route },
    { title: "Acciones visibles", body: "Los botones principales representan tareas reales del flujo editorial.", icon: MousePointer2 },
    { title: "Trazabilidad", body: "Cada módulo conserva relación con historias, fuentes, publicaciones o aprendizajes.", icon: ShieldCheck },
  ],
};

function normalizePathname(pathname: string) {
  const withoutBasePath = pathname.startsWith("/factomedia-group")
    ? pathname.slice("/factomedia-group".length) || "/"
    : pathname;
  return withoutBasePath.replace(/\/+$/, "") || "/";
}

function guideForPathname(pathname: string) {
  const normalized = normalizePathname(pathname);
  return guides.find((guide) => guide.match(normalized)) ?? fallbackGuide;
}

export function FunctionGuide() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const guide = useMemo(() => guideForPathname(pathname), [pathname]);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="function-guide-trigger"
        aria-label={open ? "Cerrar guía de funciones" : "Abrir guía de funciones"}
        aria-expanded={open}
        aria-controls="function-guide-panel"
        onClick={() => setOpen((current) => !current)}
        data-track-id="function-guide-trigger"
      >
        <CircleHelp size={17} />
        <span>Guía</span>
      </button>

      {open && (
        <section id="function-guide-panel" className="function-guide-panel" role="dialog" aria-label="Guía de funciones">
          <header className="function-guide-header">
            <div>
              <span>GUÍA CONTEXTUAL</span>
              <h2>{guide.title}</h2>
            </div>
            <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="Cerrar guía">
              <X size={17} />
            </button>
          </header>

          <p className="function-guide-summary">{guide.summary}</p>

          <div className="function-guide-list">
            {guide.features.map(({ title, body, icon: Icon }) => (
              <article className="function-guide-feature" key={title}>
                <span><Icon size={17} /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>

          <footer className="function-guide-next">
            <ArrowRight size={17} />
            <div>
              <small>SIGUIENTE SUGERIDO</small>
              <strong>{guide.next}</strong>
            </div>
          </footer>
        </section>
      )}
    </>
  );
}
