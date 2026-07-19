export type PanelBusinessSettings = {
  id: string;
  name: string;
  slug: string;
  description: string;
  whatsappPhone: string;
  publicDomain: string;
  publicAppName: string;
  panelAppName: string;
  publicShortName: string;
  panelShortName: string;
  onboardingStatus: "incomplete" | "review" | "ready";
  brandPrimary: string;
  brandAccent: string;
  themeBackground: string;
  brandRadius: string;
  defaultThemeMode: "light" | "brand" | "dark";
  publicBottomNavEnabled: boolean;
  notificationsEnabled: boolean;
  portfolioSectionTitle: string;
  logoUrl: string;
  logoLightUrl: string;
  logoDarkUrl: string;
  publicAppIconUrl: string;
  panelAppIconUrl: string;
  maskableIconUrl: string;
  appleTouchIconUrl: string;
};

export type PanelServiceSettings = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
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
