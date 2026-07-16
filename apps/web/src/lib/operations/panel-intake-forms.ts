import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntakeFormInput } from "@turnos/shared";

type SaveIntakeFormParams = {
  supabase: SupabaseClient;
  businessId: string;
  formId?: string;
  input: IntakeFormInput;
};

export async function savePanelIntakeForm({ supabase, businessId, formId, input }: SaveIntakeFormParams) {
  const formPayload = {
    business_id: businessId,
    name: input.name,
    description: input.description || null,
    active: input.active,
  };

  const formResult = formId
    ? await supabase.from("intake_forms").update(formPayload).eq("id", formId).eq("business_id", businessId).select("id").single()
    : await supabase.from("intake_forms").insert(formPayload).select("id").single();

  if (formResult.error || !formResult.data) return { id: null, error: formResult.error };

  const savedFormId = String(formResult.data.id);

  await supabase.from("intake_form_fields").delete().eq("form_id", savedFormId).eq("business_id", businessId);
  await supabase.from("service_intake_forms").delete().eq("form_id", savedFormId).eq("business_id", businessId);

  const fieldRows = input.fields.map((field, index) => ({
    business_id: businessId,
    form_id: savedFormId,
    field_key: field.fieldKey,
    label: field.label,
    help_text: field.helpText || null,
    field_type: field.fieldType,
    required: field.required,
    options: field.options,
    sort_order: index,
  }));

  const { error: fieldsError } = await supabase.from("intake_form_fields").insert(fieldRows);
  if (fieldsError) return { id: savedFormId, error: fieldsError };

  if (input.serviceIds.length > 0) {
    const linkRows = input.serviceIds.map((serviceId) => ({
      business_id: businessId,
      service_id: serviceId,
      form_id: savedFormId,
      active: true,
    }));
    const { error: linksError } = await supabase.from("service_intake_forms").insert(linkRows);
    if (linksError) return { id: savedFormId, error: linksError };
  }

  return { id: savedFormId, error: null };
}
