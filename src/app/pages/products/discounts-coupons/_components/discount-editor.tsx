"use client";

import { useMemo, useState } from "react";
import type { MerchantDiscount } from "@/lib/discounts-api";
import { useLanguage } from "@/contexts/language-context";

type DiscountEditorProps = {
  discount: MerchantDiscount;
  isSaving?: boolean;
  onCancel: () => void;
  title?: string;
  descriptionText?: string;
  submitLabel?: string;
  onSave: (payload: {
    name: string;
    description?: string;
    discount_type: "PERCENTAGE" | "FIXED_AMOUNT";
    discount_value: number;
    min_purchase?: number;
    max_uses_total?: number;
    max_uses_per_user?: number;
    valid_from?: string;
    valid_until?: string;
    available_days?: string[];
    restrict_by_hours?: boolean;
    available_hours_start?: string | null;
    available_hours_end?: string | null;
    timezone?: string;
    status?: "ACTIVE" | "INACTIVE";
  }) => Promise<void>;
};

const LABELS = {
  es: {
    formName: "Nombre de la oferta",
    formStatus: "Estado",
    formDescription: "Descripción",
    formType: "Tipo de descuento",
    formValue: "Valor",
    formMinPurchase: "Compra mínima",
    formTotalUses: "Usos totales",
    formUsesPerUser: "Usos por usuario",
    formValidFrom: "Válido desde",
    formValidUntil: "Válido hasta",
    formTimezone: "Zona horaria (Timezone)",
    formDays: "Días disponibles",
    formHours: "Restringir por horario",
    formStart: "Hora inicio",
    formEnd: "Hora fin",
    btnCancel: "Cancelar",
    btnSave: "Guardar configuración",
    loading: "Guardando...",
    days: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  },
  en: {
    formName: "Offer Name",
    formStatus: "Status",
    formDescription: "Description",
    formType: "Discount Type",
    formValue: "Value",
    formMinPurchase: "Minimum Purchase",
    formTotalUses: "Total Uses",
    formUsesPerUser: "Uses per User",
    formValidFrom: "Valid From",
    formValidUntil: "Valid Until",
    formTimezone: "Timezone",
    formDays: "Available Days",
    formHours: "Restrict by Hours",
    formStart: "Start Time",
    formEnd: "End Time",
    btnCancel: "Cancel",
    btnSave: "Save Configuration",
    loading: "Saving...",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  }
};

const DAY_IDS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

function isoToLocalDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function DiscountEditor({
  discount,
  onCancel,
  onSave,
  isSaving = false,
  title,
  descriptionText,
  submitLabel,
}: DiscountEditorProps) {
  const { language } = useLanguage();
  const t = LABELS[language];

  const initialDays = useMemo(() => {
    const rows = (discount as MerchantDiscount & { available_days?: string[] }).available_days;
    return Array.isArray(rows) ? rows : [];
  }, [discount]);

  const [form, setForm] = useState({
    name: discount.name || "",
    description: discount.description || "",
    discount_type: (discount.discount_type?.toUpperCase() === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE") as
      | "PERCENTAGE"
      | "FIXED_AMOUNT",
    discount_value: Number(discount.discount_value) || 0,
    min_purchase: Number(discount.min_purchase) || 0,
    max_uses_total: Number(discount.max_uses_total) || null, // null = unlimited
    max_uses_per_user: Number(discount.max_uses_per_user) || 1,
    valid_from: isoToLocalDateTime(discount.valid_from),
    valid_until: isoToLocalDateTime(discount.valid_until),
    available_days: initialDays,
    restrict_by_hours: Boolean((discount as any).restrict_by_hours),
    available_hours_start: (discount as any).available_hours_start || "08:00",
    available_hours_end: (discount as any).available_hours_end || "18:00",
    timezone: (discount as any).timezone || "America/Guayaquil",
    status: (discount.status?.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
  });

  const toggleDay = (dayId: string) => {
    setForm((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(dayId)
        ? prev.available_days.filter((d) => d !== dayId)
        : [...prev.available_days, dayId],
    }));
  };

  return (
    <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-dark-2">
      <div className="mb-6">
        <h4 className="text-lg font-bold text-dark dark:text-white">{title || t.btnSave}</h4>
        {descriptionText && (
          <p className="mt-1 text-sm text-dark-6 opacity-80">
            {descriptionText}
          </p>
        )}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            ...form,
            discount_value: Number(form.discount_value) || 0,
            min_purchase: Number(form.min_purchase) || 0,
            max_uses_total: form.max_uses_total != null ? Number(form.max_uses_total) : undefined,
            max_uses_per_user: Number(form.max_uses_per_user) || 1,
            valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : undefined,
            valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : undefined,
            description: form.description || undefined,
            available_hours_start: form.restrict_by_hours ? form.available_hours_start : null,
            available_hours_end: form.restrict_by_hours ? form.available_hours_end : null,
          });
        }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formName}</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formStatus}</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            >
              <option value="ACTIVE">{language === "es" ? "ACTIVO" : "ACTIVE"}</option>
              <option value="INACTIVE">{language === "es" ? "INACTIVO" : "INACTIVE"}</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formDescription}</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formType}</label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm((prev) => ({ ...prev, discount_type: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT" }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            >
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formValue}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.discount_value}
              onChange={(e) => setForm((prev) => ({ ...prev, discount_value: Number(e.target.value) || 0 }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formMinPurchase}</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.min_purchase}
              onChange={(e) => setForm((prev) => ({ ...prev, min_purchase: Number(e.target.value) || 0 }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formTotalUses}</label>
            <input
              type="number"
              min="1"
              value={form.max_uses_total || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, max_uses_total: e.target.value ? Number(e.target.value) : null }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formUsesPerUser}</label>
            <input
              type="number"
              min="1"
              value={form.max_uses_per_user}
              onChange={(e) => setForm((prev) => ({ ...prev, max_uses_per_user: Number(e.target.value) || 1 }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm focus:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formTimezone}</label>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
             <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formValidFrom}</label>
             <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white" />
          </div>
          <div>
             <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-dark-5">{t.formValidUntil}</label>
             <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))} className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white" />
          </div>
        </div>

        <div className="rounded-xl border border-stroke p-5 dark:border-dark-3">
          <p className="mb-4 text-xs font-bold uppercase tracking-wide text-dark-5">{t.formDays}</p>
          <div className="flex flex-wrap gap-2">
            {DAY_IDS.map((dayId, idx) => {
              const selected = form.available_days.includes(dayId);
              return (
                <button
                  key={dayId}
                  type="button"
                  onClick={() => toggleDay(dayId)}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                    selected
                      ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                      : "border-stroke bg-white text-dark hover:border-primary dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  }`}
                >
                  {t.days[idx]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-stroke p-5 dark:border-dark-3">
          <label className="mb-4 flex items-center gap-3 text-sm font-bold text-dark dark:text-white cursor-pointer group">
            <input
              type="checkbox"
              checked={form.restrict_by_hours}
              onChange={(e) => setForm((prev) => ({ ...prev, restrict_by_hours: e.target.checked }))}
              className="h-5 w-5 rounded-md border-stroke text-primary focus:ring-primary"
            />
            <span className="group-hover:text-primary transition-colors">{t.formHours}</span>
          </label>
          
          {form.restrict_by_hours && (
            <div className="mt-4 grid grid-cols-2 gap-5 animate-fadeIn">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase text-dark-6">{t.formStart}</label>
                <input
                  type="time"
                  value={form.available_hours_start}
                  onChange={(e) => setForm((prev) => ({ ...prev, available_hours_start: e.target.value }))}
                  className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase text-dark-6">{t.formEnd}</label>
                <input
                  type="time"
                  value={form.available_hours_end}
                  onChange={(e) => setForm((prev) => ({ ...prev, available_hours_end: e.target.value }))}
                  className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-3 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-stroke dark:border-dark-3 text-right">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-xl border border-stroke bg-white px-8 py-3 text-sm font-bold text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
          >
            {t.btnCancel}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-primary px-10 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-70"
          >
            {isSaving ? t.loading : (submitLabel || t.btnSave)}
          </button>
        </div>
      </form>
    </div>
  );
}
