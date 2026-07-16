"use client";

import { BarChart3, Bell, CalendarDays, ClipboardList, FileText, Loader2, MessageCircle, Settings, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Route } from "next";
import type { ComponentType, MouseEvent } from "react";

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

function isCurrentPath(pathname: string, href: string) {
  if (href === "/panel") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PanelNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (isCurrentPath(pathname, href)) return;
    setPendingHref(href);
  }

  return (
    <nav className="surface flex flex-wrap gap-2 p-2" aria-label="Panel">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = isCurrentPath(pathname, href);
        const pending = pendingHref === href && !active;

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className="panel-nav-link"
            data-active={active ? "true" : "false"}
            data-pending={pending ? "true" : "false"}
            href={href as Route}
            key={href}
            onClick={(event) => handleNavigation(event, href)}
            prefetch
          >
            {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
