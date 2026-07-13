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
  serviceModality: "in_person" | "virtual_scheduled" | "virtual_on_demand" | "contact_request";
  schedulingPolicy: "scheduled" | "day_request" | "manual_coordination" | "no_calendar_block";
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  blocksCalendar: boolean;
  arrivalInstructions: string;
  virtualInstructions: string;
  requiresManualConfirmation: boolean;
  pricePesos: number;
  depositPesos: number;
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

export type PanelIntakeFieldSettings = {
  id: string;
  fieldKey: string;
  label: string;
  helpText: string;
  fieldType: "short_text" | "long_text" | "number" | "date" | "single_select" | "multi_select" | "boolean" | "consent";
  required: boolean;
  sortOrder: number;
  options: Array<{ value: string; label: string }>;
};

export type PanelIntakeFormSettings = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  serviceIds: string[];
  fields: PanelIntakeFieldSettings[];
};
