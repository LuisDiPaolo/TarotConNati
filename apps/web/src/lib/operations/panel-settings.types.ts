export type PanelBusinessSettings = {
  id: string;
  name: string;
  slug: string;
  description: string;
  whatsappPhone: string;
  publicDomain: string;
  brandPrimary: string;
  brandAccent: string;
  brandRadius: string;
};

export type PanelServiceSettings = {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
  paymentMode: "deposit" | "full" | "none";
  active: boolean;
  sortOrder: number;
};

export type PanelScheduleSettings = {
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  breakStartsAt: string;
  breakEndsAt: string;
  active: boolean;
};

export type PanelScheduleOverrideSettings = {
  id: string;
  overrideDate: string;
  startsAt: string;
  endsAt: string;
  closed: boolean;
  reason: string;
};
