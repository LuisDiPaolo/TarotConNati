"use client";

import type { ReactNode } from "react";
import { PanelNav } from "./PanelNav";

export function PanelShell({ children }: { children: ReactNode }) {
  return (
    <main className="panel-shell">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PanelNav />
        {children}
      </section>
    </main>
  );
}
