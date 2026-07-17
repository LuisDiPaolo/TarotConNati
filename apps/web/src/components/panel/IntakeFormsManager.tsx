"use client";

import { Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { IntakeFieldInput } from "@/shared";
import type { PanelIntakeFormSettings, PanelServiceSettings } from "@/lib/operations/panel-settings.types";

type DraftField = IntakeFieldInput & { draftId: string; optionsText: string };
type DraftForm = Omit<PanelIntakeFormSettings, "fields"> & { draftId: string; isNew?: boolean; fields: DraftField[] };

const fieldTypeLabels: Record<DraftField["fieldType"], string> = {
  short_text: "Texto corto",
  long_text: "Texto largo",
  number: "Numero",
  date: "Fecha",
  single_select: "Selector simple",
  multi_select: "Selector multiple",
  boolean: "Si/No",
  consent: "Aceptacion",
};

function createDraftId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeFieldKey(value: string) {
  const normalized = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return normalized.replace(/^[^a-z]+/, "") || "dato";
}

function createDefaultFieldKey() {
  return `dato_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function emptyField(): DraftField {
  return {
    draftId: createDraftId("field"),
    fieldKey: createDefaultFieldKey(),
    label: "Dato adicional",
    helpText: "",
    fieldType: "short_text",
    required: false,
    sortOrder: 0,
    options: [],
    optionsText: "",
  };
}

function emptyForm(): DraftForm {
  return {
    draftId: createDraftId("form"),
    id: "",
    name: "Formulario de admision",
    description: "",
    active: true,
    serviceIds: [],
    fields: [emptyField()],
    isNew: true,
  };
}

function toDraftForm(form: PanelIntakeFormSettings): DraftForm {
  return {
    ...form,
    draftId: form.id,
    fields: form.fields.map((field) => ({
      ...field,
      draftId: field.id,
      optionsText: field.options.map((option) => `${option.value}:${option.label}`).join("\n"),
    })),
  };
}

function parseOptions(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue = "", ...labelParts] = line.split(":");
      const optionValue = rawValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      return { value: optionValue, label: (labelParts.join(":").trim() || rawValue.trim()).slice(0, 120) };
    })
    .filter((option) => option.value.length > 0);
}

export function IntakeFormsManager({ forms, services }: { forms: PanelIntakeFormSettings[]; services: PanelServiceSettings[] }) {
  const [rows, setRows] = useState<DraftForm[]>(forms.map(toDraftForm));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [savingId, setSavingId] = useState<string | null>(null);

  function updateForm(draftId: string, patch: Partial<DraftForm>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  function updateField(formDraftId: string, fieldDraftId: string, patch: Partial<DraftField>) {
    setRows((current) => current.map((row) => {
      if (row.draftId !== formDraftId) return row;
      return { ...row, fields: row.fields.map((field) => field.draftId === fieldDraftId ? { ...field, ...patch } : field) };
    }));
  }

  function removeField(formDraftId: string, fieldDraftId: string) {
    setRows((current) => current.map((row) => {
      if (row.draftId !== formDraftId || row.fields.length <= 1) return row;
      return { ...row, fields: row.fields.filter((field) => field.draftId !== fieldDraftId) };
    }));
  }

  function toggleService(form: DraftForm, serviceId: string) {
    const serviceIds = form.serviceIds.includes(serviceId)
      ? form.serviceIds.filter((currentId) => currentId !== serviceId)
      : [...form.serviceIds, serviceId];
    updateForm(form.draftId, { serviceIds });
  }

  async function saveForm(row: DraftForm) {
    if (savingId) return;
    setMessage("");
    setMessageTone("success");
    setSavingId(row.draftId);
    const payload = {
      name: row.name,
      description: row.description,
      active: row.active,
      serviceIds: row.serviceIds,
      fields: row.fields.map((field, index) => ({
        id: field.id || undefined,
        fieldKey: field.fieldKey,
        label: field.label,
        helpText: field.helpText,
        fieldType: field.fieldType,
        required: field.required,
        sortOrder: index,
        options: field.fieldType === "single_select" || field.fieldType === "multi_select" ? parseOptions(field.optionsText) : [],
      })),
    };

    const response = await fetch(row.isNew ? "/api/panel/intake-forms" : `/api/panel/intake-forms/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { id?: string; error?: { message?: string } } | null;

    if (!response?.ok) {
      setSavingId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo guardar el formulario.");
      return;
    }

    if (row.isNew && data?.id) {
      updateForm(row.draftId, { id: data.id, draftId: data.id, isNew: false });
    }
    setSavingId(null);
    setMessage("Formulario guardado.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="primary-action" type="button" disabled={savingId !== null} onClick={() => setRows((current) => [...current, emptyForm()])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar formulario
        </button>
      </div>

      {rows.map((row) => (
        <article className="surface grid gap-5 p-5" key={row.draftId}>
          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <label className="grid gap-2 text-sm font-semibold">
              Nombre
              <input className="input-control" value={row.name} onChange={(event) => updateForm(row.draftId, { name: event.target.value })} />
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold">
              <input type="checkbox" checked={row.active} onChange={(event) => updateForm(row.draftId, { active: event.target.checked })} />
              Activo
            </label>
          </div>

          <textarea className="input-control min-h-20 resize-y" value={row.description} onChange={(event) => updateForm(row.draftId, { description: event.target.value })} placeholder="Descripcion visible para el admin" />

          <section className="grid gap-3">
            <p className="text-sm font-bold">Servicios asociados</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5" key={service.id}>
                  <input type="checkbox" checked={row.serviceIds.includes(service.id)} onChange={() => toggleService(row, service.id)} />
                  {service.name}
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold">Campos</p>
              <button className="icon-action" type="button" aria-label="Agregar campo" disabled={savingId !== null} onClick={() => updateForm(row.draftId, { fields: [...row.fields, emptyField()] })}>
                <Plus aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            {row.fields.map((field) => (
              <div className="grid gap-3 rounded-md border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5" key={field.draftId}>
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_180px_44px]">
                  <label className="grid gap-2 text-sm font-semibold">
                    Etiqueta
                    <input className="input-control" value={field.label} onChange={(event) => updateField(row.draftId, field.draftId, { label: event.target.value })} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Clave
                    <input className="input-control" value={field.fieldKey} onChange={(event) => updateField(row.draftId, field.draftId, { fieldKey: normalizeFieldKey(event.target.value) })} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Tipo
                    <select className="input-control" value={field.fieldType} onChange={(event) => updateField(row.draftId, field.draftId, { fieldType: event.target.value as DraftField["fieldType"] })}>
                      {Object.entries(fieldTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <button className="icon-action self-end" type="button" aria-label="Quitar campo" disabled={row.fields.length <= 1 || savingId !== null} onClick={() => removeField(row.draftId, field.draftId)}>
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                  <input className="input-control" value={field.helpText} onChange={(event) => updateField(row.draftId, field.draftId, { helpText: event.target.value })} placeholder="Ayuda opcional" />
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={field.required} onChange={(event) => updateField(row.draftId, field.draftId, { required: event.target.checked })} />
                    Obligatorio
                  </label>
                </div>

                {field.fieldType === "single_select" || field.fieldType === "multi_select" ? (
                  <label className="grid gap-2 text-sm font-semibold">
                    Opciones, una por linea: clave:Etiqueta
                    <textarea className="input-control min-h-20 resize-y" value={field.optionsText} onChange={(event) => updateField(row.draftId, field.draftId, { optionsText: event.target.value })} placeholder="menor_18:Menor de 18\nadulto:Adulto" />
                  </label>
                ) : null}
              </div>
            ))}
          </section>

          <div className="flex justify-end">
            <button className="primary-action" type="button" disabled={savingId !== null} onClick={() => saveForm(row)}>
              <Save aria-hidden="true" className="h-4 w-4" />
              {savingId === row.draftId ? "Guardando" : "Guardar formulario"}
            </button>
          </div>
        </article>
      ))}

      {message ? <p className={messageTone === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </div>
  );
}
