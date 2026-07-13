export type PublicService = {
  id: string;
  name: string;
  description: string;
  category: string;
  durationMinutes: number;
  priceCents: number;
  depositCents: number;
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
  };
  services: PublicService[];
  slotsByService: Record<string, PublicSlot[]>;
};
