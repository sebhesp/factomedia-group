"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronRight,
  CircleGauge,
  FilePlus2,
  MoreHorizontal,
  Newspaper,
  Radio,
  SearchCheck,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { FeedbackWidget } from "@/components/feedback-widget";
import { cn } from "@/lib/utils";
import { roleLabels, useDemoRole, type DemoRole } from "@/lib/demo-role";

type NavigationLink = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
};

const links: readonly NavigationLink[] = [
  { href: "/mi-dia", label: "Mi mesa", icon: CircleGauge },
  { href: "/buscar-noticia", label: "Buscar noticia", mobileLabel: "Buscar", icon: SearchCheck },
  { href: "/desk/noticias/nueva", label: "Capturar", icon: FilePlus2 },
  { href: "/redaccion", label: "Ahora", icon: Radio },
  { href: "/distribucion", label: "Distribución", icon: BarChart3 },
  { href: "/aprendizajes", label: "Aprendizajes", icon: BrainCircuit },
  { href: "/", label: "Portada", icon: Newspaper },
];

const mobilePrimaryLinks = links.slice(0, 4);
const mobileSecondaryLinks = links.slice(4);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useDemoRole();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMoreOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMoreOpen]);

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  }

  return (
    <div className="desk-shell">
      <aside className="sidebar">
        <Link href="/mi-dia" className="brand brand-desk" data-track-event="navigation_used" data-track-id="nav-brand" data-track-destination="mi-dia">
          <span className="brand-mark">F</span>
          <span className="brand-copy"><strong>FACTOMEDIA</strong><small>STUDIO</small></span>
        </Link>
        <span className="nav-section-label">ESPACIO DE TRABAJO</span>
        <nav className="side-nav">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn("side-link", isActive(href) && "active")} data-track-event="navigation_used" data-track-id={`nav-${href.replaceAll("/", "-") || "home"}`} data-track-destination={href}>
              <Icon size={18} />{label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-hint"><span>⌘ K</span><p>Busca historias o ejecuta cualquier acción.</p></div>
        <div className="sidebar-user"><div className="avatar"><UserRound size={18} /></div><div><strong>Mariana Torres</strong><select aria-label="Rol DEMO" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}><option value="collaborator">Colaboradora</option><option value="editor">Editora</option><option value="admin">Administradora</option></select><span>{roleLabels[role]} · DEMO</span></div></div>
      </aside>

      <div className="desk-main">
        <header className="desk-header">
          <div className="desk-header-left"><span className="mobile-brand">Factomedia Studio</span><span className="workspace-status"><i /> Redacción conectada</span></div>
          <div className="desk-header-actions"><Link href="/buscar-noticia" className="radar-entry-button" data-track-event="navigation_used" data-track-id="header-search-news" data-track-destination="buscar-noticia" data-track-surface="header"><SearchCheck size={15} /> Buscar noticia</Link><CommandPalette /><button className="icon-button" aria-label="Notificaciones" data-track-event="navigation_used" data-track-id="notifications" data-track-destination="notifications"><Bell size={19} /><span className="notification-dot" /></button></div>
        </header>

        <main className="desk-content">{children}</main>

        <nav className="mobile-nav" aria-label="Navegación principal">
          {mobilePrimaryLinks.map(({ href, label, mobileLabel, icon: Icon }) => (
            <Link key={href} href={href} className={cn(isActive(href) && "active", href === "/desk/noticias/nueva" && "mobile-capture-action")} data-track-event="navigation_used" data-track-id={`mobile-${href.replaceAll("/", "-") || "home"}`} data-track-destination={href}>
              <span className="mobile-nav-icon"><Icon size={21} /></span><span>{mobileLabel ?? label}</span>
            </Link>
          ))}
          <button type="button" className={cn("mobile-more-button", mobileSecondaryLinks.some(({ href }) => isActive(href)) && "active")} onClick={() => setMobileMoreOpen(true)} aria-label="Abrir más secciones" aria-expanded={mobileMoreOpen}>
            <span className="mobile-nav-icon"><MoreHorizontal size={21} /></span><span>Más</span>
          </button>
        </nav>

        {mobileMoreOpen && (
          <div className="mobile-more-backdrop" role="presentation" onMouseDown={() => setMobileMoreOpen(false)}>
            <section className="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Más secciones" onMouseDown={(event) => event.stopPropagation()}>
              <div className="mobile-sheet-handle" />
              <header><div><span>FACTOMEDIA STUDIO</span><h2>Más herramientas</h2></div><button type="button" onClick={() => setMobileMoreOpen(false)} aria-label="Cerrar"><X size={20} /></button></header>
              <nav>
                {mobileSecondaryLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileMoreOpen(false)} className={cn(isActive(href) && "active")} data-track-event="navigation_used" data-track-id={`mobile-more-${href.replaceAll("/", "-") || "home"}`} data-track-destination={href}>
                    <span><Icon size={20} /></span><div><strong>{label}</strong><small>{href === "/distribucion" ? "Posts, métricas y seguimiento" : href === "/aprendizajes" ? "Fricciones, experimentos y mejoras" : "Sitio público de Factomedia"}</small></div><ChevronRight size={18} />
                  </Link>
                ))}
              </nav>
              <label className="mobile-role-control"><span>Vista de trabajo</span><select aria-label="Cambiar rol DEMO" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}><option value="collaborator">Colaboradora</option><option value="editor">Editora</option><option value="admin">Administradora</option></select></label>
            </section>
          </div>
        )}

        <FeedbackWidget />
      </div>
    </div>
  );
}
