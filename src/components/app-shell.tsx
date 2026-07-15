"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Camera as Instagram,
  FileText,
  Globe2,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabels, useDemoRole, type DemoRole } from "@/lib/demo-role";

type NavigationLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const links: readonly NavigationLink[] = [
  {
    href: "/mi-dia",
    label: "Inicio",
    description: "Resumen y pendientes",
    icon: LayoutDashboard,
  },
  {
    href: "/instagram",
    label: "Instagram",
    description: "Posts capturados",
    icon: Instagram,
  },
  {
    href: "/redaccion",
    label: "Notas",
    description: "Revisión editorial",
    icon: FileText,
  },
  {
    href: "/",
    label: "Sitio público",
    description: "Portada publicada",
    icon: Globe2,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useDemoRole();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const currentSection = links.find(({ href }) => isActive(href)) ?? links[0];

  return (
    <div className="desk-shell minimal-shell">
      <aside className="sidebar minimal-sidebar">
        <Link
          href="/mi-dia"
          className="brand brand-desk"
          data-track-event="navigation_used"
          data-track-id="nav-brand"
          data-track-destination="mi-dia"
        >
          <span className="brand-mark">F</span>
          <span className="brand-copy"><strong>EL FACTO</strong><small>NOTICIAS</small></span>
        </Link>

        <nav className="side-nav minimal-side-nav" aria-label="Navegación principal">
          {links.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn("side-link minimal-side-link", isActive(href) && "active")}
              aria-label={`${label}: ${description}`}
              title={description}
              data-track-event="navigation_used"
              data-track-id={`nav-${href.replaceAll("/", "-") || "home"}`}
              data-track-destination={href}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-user minimal-sidebar-user">
          <div className="avatar"><UserRound size={18} /></div>
          <div>
            <strong>Ilse Reyes</strong>
            <select
              aria-label="Rol DEMO"
              value={role}
              onChange={(event) => setRole(event.target.value as DemoRole)}
            >
              <option value="collaborator">Colaboradora</option>
              <option value="editor">Editora</option>
              <option value="admin">Administradora</option>
            </select>
            <span>{roleLabels[role]} · DEMO</span>
          </div>
        </div>
      </aside>

      <div className="desk-main">
        <header className="desk-header minimal-header">
          <div className="desk-header-left">
            <span className="mobile-brand">El Facto Noticias</span>
            <strong className="current-section-label">{currentSection.label}</strong>
          </div>
          <span className="workspace-status"><i /> Instagram conectado · DEMO</span>
        </header>

        <main className="desk-content">{children}</main>

        <nav className="mobile-nav minimal-mobile-nav" aria-label="Navegación principal">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(isActive(href) && "active")}
              data-track-event="navigation_used"
              data-track-id={`mobile-${href.replaceAll("/", "-") || "home"}`}
              data-track-destination={href}
            >
              <span className="mobile-nav-icon"><Icon size={21} /></span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
