import { useMemo, useState } from "react";
import type { MerchantCategory, MerchantDiscount, MerchantProduct } from "@/lib/discounts-api";
import { useLanguage } from "@/contexts/language-context";
import { useUiTranslations } from "@/hooks/use-ui-translations";

type DiscountEditorProps = {
  discount: MerchantDiscount;
  categories?: MerchantCategory[];
  products?: MerchantProduct[];
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
    applicable_category_ids?: string[];
    applicable_product_ids?: string[];
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
const TIMEZONES = ["America/Guayaquil", "America/Bogota", "America/Mexico_City", "America/Lima", "America/Santiago", "UTC"];

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
  categories = [],
  products = [],
  onCancel,
  onSave,
  isSaving = false,
  title,
  descriptionText,
  submitLabel,
}: DiscountEditorProps) {
  const { language } = useLanguage();
  const t = LABELS[language];
  const tShared = useUiTranslations().merchantRedemption;

  const initialDays = useMemo(() => {
    const rows = (discount as any).available_days;
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
    max_uses_total: Number(discount.max_uses_total) || null,
    max_uses_per_user: Number(discount.max_uses_per_user) || 1,
    valid_from: isoToLocalDateTime(discount.valid_from),
    valid_until: isoToLocalDateTime(discount.valid_until),
    available_days: initialDays,
    restrict_by_hours: Boolean((discount as any).restrict_by_hours),
    available_hours_start: (discount as any).available_hours_start || "08:00",
    available_hours_end: (discount as any).available_hours_end || "18:00",
    timezone: (discount as any).timezone || "America/Guayaquil",
    status: (discount.status?.toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE") as "ACTIVE" | "INACTIVE",
    applicable_category_ids: (discount as any).applicable_category_ids || [],
    applicable_product_ids: (discount as any).applicable_product_ids || [],
  });

  const [catSearch, setCatSearch] = useState("");
  const [prodSearch, setProdSearch] = useState("");

  const filteredCategories = useMemo(() => 
    categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())),
    [categories, catSearch]
  );
  
  const filteredProducts = useMemo(() => 
    products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())),
    [products, prodSearch]
  );

  const toggleDay = (dayId: string) => {
    setForm((prev) => ({
      ...prev,
      available_days: prev.available_days.includes(dayId)
        ? prev.available_days.filter((d) => d !== dayId)
        : [...prev.available_days, dayId],
    }));
  };

  const toggleSelection = (key: 'applicable_category_ids' | 'applicable_product_ids', id: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((i: string) => i !== id) : [...prev[key], id]
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
            <select
              value={form.timezone}
              onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
              className="w-full rounded-xl border border-stroke bg-gray-1 px-4 py-2.5 text-sm dark:border-dark-3 dark:bg-dark-3 dark:text-white"
            >
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
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

        {/* Linker: Categorías */}
        <div className="rounded-xl border border-stroke p-5 dark:border-dark-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-dark-5">{tShared.selectCategories}</p>
            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
              {form.applicable_category_ids.length > 0 ? `${form.applicable_category_ids.length} selected` : tShared.noneSelected}
            </span>
          </div>
          <input 
            type="text" 
            placeholder={tShared.searchPlaceholder} 
            value={catSearch} 
            onChange={(e) => setCatSearch(e.target.value)} 
            className="mb-4 w-full rounded-lg border border-stroke bg-gray-1 px-3 py-2 text-xs dark:border-dark-3 dark:bg-dark-3"
          />
          <div className="max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 pr-2 custom-scrollbar">
            {filteredCategories.map(cat => (
              <label key={cat.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition border ${form.applicable_category_ids.includes(cat.id) ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-gray-1 dark:hover:bg-dark-3'}`}>
                <input 
                  type="checkbox" 
                  checked={form.applicable_category_ids.includes(cat.id)} 
                  onChange={() => toggleSelection('applicable_category_ids', cat.id)}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="text-xs font-medium text-dark dark:text-white truncate">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Linker: Productos */}
        <div className="rounded-xl border border-stroke p-5 dark:border-dark-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-dark-5">{tShared.selectProducts}</p>
            <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
               {form.applicable_product_ids.length > 0 ? `${form.applicable_product_ids.length} selected` : tShared.noneSelected}
            </span>
          </div>
          <input 
            type="text" 
            placeholder={tShared.searchPlaceholder} 
            value={prodSearch} 
            onChange={(e) => setProdSearch(e.target.value)} 
            className="mb-4 w-full rounded-lg border border-stroke bg-gray-1 px-3 py-2 text-xs dark:border-dark-3 dark:bg-dark-3"
          />
          <div className="max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pr-2 custom-scrollbar">
            {filteredProducts.map(prod => (
              <label key={prod.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition border ${form.applicable_product_ids.includes(prod.id) ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-gray-1 dark:hover:bg-dark-3'}`}>
                 <input 
                  type="checkbox" 
                  checked={form.applicable_product_ids.includes(prod.id)} 
                  onChange={() => toggleSelection('applicable_product_ids', prod.id)}
                  className="rounded text-primary focus:ring-primary"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-dark dark:text-white truncate">{prod.name}</span>
                  <span className="text-[9px] text-dark-6 opacity-60">
                    {categories.find(c => c.id === prod.category_id)?.name || 'Misc'}
                  </span>
                </div>
              </label>
            ))}
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
