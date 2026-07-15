export type AppointmentReminderInput = {
  customerName: string;
  customerPhone: string;
  serviceName: string;
  startsAt: string;
  status: string;
};

const statusLabels: Record<string, string> = {
  pending: "pendiente",
  confirmed: "confirmado",
  cancelled: "cancelado",
  completed: "realizado",
  no_show: "ausente",
};

export function normalizeWhatsAppPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const withoutInternationalPrefix = digits.startsWith("00") ? digits.slice(2) : digits;
  const withoutTrunkPrefix = withoutInternationalPrefix.startsWith("0") ? withoutInternationalPrefix.slice(1) : withoutInternationalPrefix;

  if (/^549\d{10}$/.test(withoutTrunkPrefix)) return withoutTrunkPrefix;
  if (/^54\d{10}$/.test(withoutTrunkPrefix)) return `549${withoutTrunkPrefix.slice(2)}`;
  if (/^\d{10}$/.test(withoutTrunkPrefix)) return `549${withoutTrunkPrefix}`;

  return "";
}

function getFirstName(value: string) {
  return value.trim().split(/\s+/)[0] || "";
}

function formatAppointmentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function buildAppointmentReminderMessage(appointment: AppointmentReminderInput) {
  const firstName = getFirstName(appointment.customerName);
  const greeting = firstName ? `Hola ${firstName} 👋` : "Hola 👋";
  const status = statusLabels[appointment.status] ?? appointment.status;

  return [
    greeting,
    "Te recordamos tu turno:",
    `📅 Fecha y hora: ${formatAppointmentDate(appointment.startsAt)}`,
    `✨ Servicio: ${appointment.serviceName}`,
    `✅ Estado: ${status}`,
    "",
    "Si necesitás modificarlo o cancelar, respondé este mensaje.",
    "Gracias.",
  ].join("\n");
}

export function buildAppointmentReminderWhatsAppUrl(appointment: AppointmentReminderInput) {
  const phone = normalizeWhatsAppPhone(appointment.customerPhone);
  if (!phone) return "";

  return `https://wa.me/${phone}?text=${encodeURIComponent(buildAppointmentReminderMessage(appointment))}`;
}
