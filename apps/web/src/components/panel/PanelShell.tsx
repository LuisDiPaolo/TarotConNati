import { BarChart3, Bell, CalendarDays, ClipboardList, FileText, MessageCircle, Settings, Users, Wrench } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ComponentType, ReactNode } from "react";

type PanelNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
};

const navItems: PanelNavItem[] = [
  { href: "/panel", label: "Turnos", icon: CalendarDays },
  { href: "/panel/solicitudes", label: "Solicitudes", icon: MessageCircle },
  { href: "/panel/configuracion", label: "Configuracion", icon: Settings },
  { href: "/panel/servicios", label: "Servicios", icon: Wrench },
  { href: "/panel/agenda", label: "Agenda", icon: ClipboardList },
  { href: "/panel/clientes", label: "Clientes", icon: Users },
  { href: "/panel/notificaciones", label: "Avisos", icon: Bell },
  { href: "/panel/formularios", label: "Formularios", icon: FileText },
  { href: "/panel/reportes", label: "Reportes", icon: BarChart3 },
];

export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <main className="panel-shell">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <nav className="surface flex flex-wrap gap-2 p-2" aria-label="Panel">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link className="panel-nav-link" href={href as Route} key={href}>
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </section>
    </main>
  );
}
