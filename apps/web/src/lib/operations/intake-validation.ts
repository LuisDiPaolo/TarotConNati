import type { PublicIntakeResponseInput } from "@/shared";

export type IntakeFieldRow = {
  field_key: string;
  label: string;
  help_text: string | null;
  field_type: "short_text" | "long_text" | "number" | "date" | "single_select" | "multi_select" | "boolean" | "consent";
  required: boolean;
  options: Array<{ value: string; label: string }> | null;
  sort_order: number;
};

export type IntakeLinkRow = {
  form_id: string;
  intake_forms: {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    deleted_at: string | null;
    intake_form_fields: IntakeFieldRow[] | null;
  } | null;
};

function isEmptyResponse(value: unknown) {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function validateFieldResponse(field: IntakeFieldRow, value: PublicIntakeResponseInput[string] | undefined) {
  if (field.required && isEmptyResponse(value)) return false;
  if (isEmptyResponse(value)) return true;

  if (field.field_type === "number") return typeof value === "number" && Number.isFinite(value);
  if (field.field_type === "boolean" || field.field_type === "consent") return typeof value === "boolean" && (!field.required || value === true);
  if (field.field_type === "date") return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

  const allowedOptions = new Set((field.options ?? []).map((option) => option.value));
  if (field.field_type === "single_select") return typeof value === "string" && allowedOptions.has(value);
  if (field.field_type === "multi_select") return Array.isArray(value) && value.every((item) => allowedOptions.has(item));

  return typeof value === "string" && value.length <= (field.field_type === "long_text" ? 1000 : 240);
}

export function buildValidatedIntakePayload(forms: IntakeLinkRow[], responses: PublicIntakeResponseInput) {
  const payload: Array<{ formId: string; formSnapshot: object; response: Record<string, PublicIntakeResponseInput[string]> }> = [];

  for (const link of forms) {
    const form = link.intake_forms;
    if (!form || !form.active || form.deleted_at) continue;

    const fields = (form.intake_form_fields ?? []).sort((a, b) => a.sort_order - b.sort_order);
    const response: Record<string, PublicIntakeResponseInput[string]> = {};

    for (const field of fields) {
      const value = responses[field.field_key];
      if (!validateFieldResponse(field, value)) return null;
      if (!isEmptyResponse(value)) {
        response[field.field_key] = value as PublicIntakeResponseInput[string];
      }
    }

    payload.push({
      formId: form.id,
      formSnapshot: {
        id: form.id,
        name: form.name,
        description: form.description ?? "",
        fields: fields.map((field) => ({
          fieldKey: field.field_key,
          label: field.label,
          helpText: field.help_text ?? "",
          fieldType: field.field_type,
          required: field.required,
          options: field.options ?? [],
          sortOrder: field.sort_order,
        })),
      },
      response,
    });
  }

  return payload;
}
