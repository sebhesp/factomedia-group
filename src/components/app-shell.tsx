"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bell, CircleGauge, FilePlus2, Newspaper, Radio, UserRound } from "lucide-react";
import { CommandPalette } from "@/components/command-palette";
import { cn } from "@/lib/utils";
import { roleLabels, useDemoRole, type DemoRole } from "@/lib/demo-role";

const links = [
  { href: "/mi-dia", label: "Mi mesa", icon: CircleGauge },
  { href: "/desk/noticias/nueva", label: "Capturar", icon: FilePlus2 },
  { href: "/redaccion", label: "Ahora", icon: Radio },
  { href: "/distribucion", label: "Distribución", icon: BarChart3 },
  { href: "/", label: "Portada", icon: Newspaper },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, setRole } = useDemoRole();
  return (
    <div className="desk-shell">
      <aside className="sidebar">
        <Link href="/mi-dia" className="brand brand-desk">
          <span className="brand-mark">F</span>
          <span className="brand-copy"><strong>FACTOMEDIA</strong><small>STUDIO</small></span>
        </Link>
        <span className="nav-section-label">ESPACIO DE TRABAJO</span>
        <nav className="side-nav">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={cn("side-link", (pathname === href || (href !== "/" && pathname.startsWith(`${href}/`))) && "active")}>
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
          <div className="desk-header-actions"><CommandPalette /><button className="icon-button" aria-label="Notificaciones"><Bell size={19} /><span className="notification-dot" /></button></div>
        </header>
        <main className="desk-content">{children}</main>
        <nav className="mobile-nav">
          {links.slice(0, 4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn((pathname === href || pathname.startsWith(`${href}/`)) && "active")}><Icon size={20} /><span>{label}</span></Link>)}
        </nav>
      </div>
    </div>
  );
}
