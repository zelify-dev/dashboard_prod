"use client";

import { useMemo, useState } from "react";
import type { MerchantDiscount } from "@/lib/discounts-api";

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

const DAYS = [
  { id: "MONDAY", label: "Lun" },
  { id: "TUESDAY", label: "Mar" },
  { id: "WEDNESDAY", label: "Mie" },
  { id: "THURSDAY", label: "Jue" },
  { id: "FRIDAY", label: "Vie" },
  { id: "SATURDAY", label: "Sab" },
  { id: "SUNDAY", label: "Dom" },
];

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
  title = "Editar descuento seleccionado",
  descriptionText = "Actualiza la configuracion de la oferta antes de crear el nuevo cupon.",
  submitLabel = "Guardar descuento",
}: DiscountEditorProps) {
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
    max_uses_total: Number(discount.max_uses_total) || 1,
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
    <div className="mt-4 rounded-lg border border-stroke bg-white p-4 dark:border-dark-3 dark:bg-dark-2">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-dark dark:text-white">{title}</h4>
        <p className="mt-1 text-xs text-dark-6 dark:text-dark-6">
          {descriptionText}
        </p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            name: form.name,
            description: form.description || undefined,
            discount_type: form.discount_type,
            discount_value: Number(form.discount_value) || 0,
            min_purchase: Number(form.min_purchase) || 0,
            max_uses_total: Number(form.max_uses_total) || 1,
            max_uses_per_user: Number(form.max_uses_per_user) || 1,
            valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : undefined,
            valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : undefined,
            available_days: form.available_days,
            restrict_by_hours: form.restrict_by_hours,
            available_hours_start: form.restrict_by_hours ? form.available_hours_start : null,
            available_hours_end: form.restrict_by_hours ? form.available_hours_end : null,
            timezone: form.timezone || "America/Guayaquil",
            status: form.status,
          });
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Nombre</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Estado</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Descripcion</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Tipo</label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm((prev) => ({ ...prev, discount_type: e.target.value as "PERCENTAGE" | "FIXED_AMOUNT" }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            >
              <option value="PERCENTAGE">PERCENTAGE</option>
              <option value="FIXED_AMOUNT">FIXED_AMOUNT</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Valor</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discount_value}
              onChange={(e) => setForm((prev) => ({ ...prev, discount_value: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Compra minima</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.min_purchase}
              onChange={(e) => setForm((prev) => ({ ...prev, min_purchase: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Usos totales</label>
            <input
              type="number"
              min="1"
              value={form.max_uses_total}
              onChange={(e) => setForm((prev) => ({ ...prev, max_uses_total: Number(e.target.value) || 1 }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Usos por usuario</label>
            <input
              type="number"
              min="1"
              value={form.max_uses_per_user}
              onChange={(e) => setForm((prev) => ({ ...prev, max_uses_per_user: Number(e.target.value) || 1 }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Valido desde</label>
            <input
              type="datetime-local"
              value={form.valid_from}
              onChange={(e) => setForm((prev) => ({ ...prev, valid_from: e.target.value }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Valido hasta</label>
            <input
              type="datetime-local"
              value={form.valid_until}
              onChange={(e) => setForm((prev) => ({ ...prev, valid_until: e.target.value }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-dark dark:text-white">Timezone</label>
            <input
              type="text"
              value={form.timezone}
              onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-dark dark:text-white">Dias disponibles</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const selected = form.available_days.includes(day.id);
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-stroke p-3 dark:border-dark-3">
          <label className="mb-2 flex items-center gap-2 text-sm text-dark dark:text-white">
            <input
              type="checkbox"
              checked={form.restrict_by_hours}
              onChange={(e) => setForm((prev) => ({ ...prev, restrict_by_hours: e.target.checked }))}
            />
            Restringir por horario
          </label>
          {form.restrict_by_hours ? (
            <div className="grid grid-cols-2 gap-3">
              <input
                type="time"
                value={form.available_hours_start}
                onChange={(e) => setForm((prev) => ({ ...prev, available_hours_start: e.target.value }))}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
              <input
                type="time"
                value={form.available_hours_end}
                onChange={(e) => setForm((prev) => ({ ...prev, available_hours_end: e.target.value }))}
                className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-dark-3 dark:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Guardando..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
