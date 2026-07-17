import { z } from "zod";

export const intakeFieldTypeSchema = z.enum([
  "short_text",
  "long_text",
  "number",
  "date",
  "single_select",
  "multi_select",
  "boolean",
  "consent",
]);

export const intakeFieldOptionSchema = z.object({
  value: z.string().trim().min(1).max(80).regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
  label: z.string().trim().min(1).max(120),
});

export const intakeFieldSchema = z.object({
  id: z.string().uuid().optional(),
  fieldKey: z.string().trim().min(2).max(60).regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/),
  label: z.string().trim().min(2).max(140),
  helpText: z.string().trim().max(240).optional().or(z.literal("")),
  fieldType: intakeFieldTypeSchema,
  required: z.coerce.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(10_000),
  options: z.array(intakeFieldOptionSchema).max(20).default([]),
}).superRefine((field, context) => {
  const needsOptions = field.fieldType === "single_select" || field.fieldType === "multi_select";
  if (needsOptions && field.options.length === 0) {
    context.addIssue({ code: "custom", path: ["options"], message: "Agrega al menos una opcion." });
  }

  if (!needsOptions && field.options.length > 0) {
    context.addIssue({ code: "custom", path: ["options"], message: "Este tipo de campo no usa opciones." });
  }
});

export const intakeFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  active: z.coerce.boolean(),
  serviceIds: z.array(z.string().uuid()).max(50).default([]),
  fields: z.array(intakeFieldSchema).min(1).max(20),
}).superRefine((form, context) => {
  const seen = new Set<string>();
  for (const [index, field] of form.fields.entries()) {
    if (seen.has(field.fieldKey)) {
      context.addIssue({ code: "custom", path: ["fields", index, "fieldKey"], message: "La clave del campo debe ser unica." });
    }
    seen.add(field.fieldKey);
  }
});

export const intakeResponseValueSchema = z.union([
  z.string().max(1_000),
  z.number(),
  z.boolean(),
  z.array(z.string().max(120)).max(20),
]);

export const publicIntakeResponseSchema = z.record(z.string().min(1).max(60), intakeResponseValueSchema).default({});

export type IntakeFieldType = z.infer<typeof intakeFieldTypeSchema>;
export type IntakeFieldOption = z.infer<typeof intakeFieldOptionSchema>;
export type IntakeFieldInput = z.infer<typeof intakeFieldSchema>;
export type IntakeFormInput = z.infer<typeof intakeFormSchema>;
export type IntakeResponseValue = z.infer<typeof intakeResponseValueSchema>;
export type PublicIntakeResponseInput = z.infer<typeof publicIntakeResponseSchema>;
