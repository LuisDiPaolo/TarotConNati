"use client";

import { BarChart3, Bell, CalendarDays, ClipboardList, FileText, Loader2, MessageCircle, Settings, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Route } from "next";
import type { ComponentType, MouseEvent } from "react";

type PanelNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: "true" }>;
};

const navItems: PanelNavItem[] = [
  { href: "/", label: "Turnos", icon: CalendarDays },
  { href: "/solicitudes", label: "Solicitudes", icon: MessageCircle },
  { href: "/configuracion", label: "Configuracion", icon: Settings },
  { href: "/servicios", label: "Servicios", icon: Wrench },
  { href: "/agenda", label: "Agenda", icon: ClipboardList },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/notificaciones", label: "Avisos", icon: Bell },
  { href: "/formularios", label: "Formularios", icon: FileText },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
];

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PanelNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  function handleNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
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
            aria-label={pending ? `Cargando ${label}` : label}
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
