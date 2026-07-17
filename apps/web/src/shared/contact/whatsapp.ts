export function normalizeArgentinaPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) return digits;
  return `54${digits}`;
}

export function buildWhatsAppUrl(input: { phone: string; message?: string }) {
  const phone = normalizeArgentinaPhone(input.phone);
  const params = new URLSearchParams();
  if (input.message?.trim()) params.set("text", input.message.trim());

  const query = params.toString();
  return `https://wa.me/${phone}${query ? `?${query}` : ""}`;
}

export function buildAppointmentWhatsAppMessage(input: {
  businessName: string;
  serviceName: string;
  startsAtLabel: string;
  customerName?: string;
}) {
  const greeting = input.customerName?.trim() ? `Hola ${input.customerName.trim()},` : "Hola,";
  return `${greeting} tu turno en ${input.businessName} para ${input.serviceName} esta programado para ${input.startsAtLabel}.`;
}
