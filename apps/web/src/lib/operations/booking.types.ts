export type PublicIntakeField = {
  fieldKey: string;
  label: string;
  helpText: string;
  fieldType: "short_text" | "long_text" | "number" | "date" | "single_select" | "multi_select" | "boolean" | "consent";
  required: boolean;
  options: Array<{ value: string; label: string }>;
};

export type PublicIntakeForm = {
  id: string;
  name: string;
  description: string;
  fields: PublicIntakeField[];
};

export type PublicService = {
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
  priceLabel: string;
  depositLabel: string;
};

export type PublicSlot = {
  serviceId: string;
  startsAt: string;
  label: string;
};

export type PublicBookingData = {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string;
    timezone: string;
    brandPrimary: string;
    brandAccent: string;
    brandRadius: string;
    logoUrl: string;
    logoLightUrl: string;
    logoDarkUrl: string;
    publicAppIconUrl: string;
  };
  services: PublicService[];
  slotsByService: Record<string, PublicSlot[]>;
  intakeFormsByService: Record<string, PublicIntakeForm[]>;
};
