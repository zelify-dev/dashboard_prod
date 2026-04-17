"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";

interface CreateCouponFormProps {
  onSave: (data: any) => Promise<void> | void;
  mode?: "new" | "existing";
  submitDisabled?: boolean;
  cancelHref?: string;
}

function friendlyCouponSaveError(
  raw: string,
  labels: {
    validationMaxRedemptionsMin: string;
    validationMaxUsesPerUserMin: string;
  }
): string {
  const s = raw.trim();
  if (!s) return labels.validationMaxRedemptionsMin;
  const lower = s.toLowerCase();
  if (
    lower.includes("límite mínimo") ||
    lower.includes("limite minimo") ||
    (lower.includes("minimum") && lower.includes("1"))
  ) {
    if (/usuario|user|per.?user/i.test(s)) return labels.validationMaxUsesPerUserMin;
    return labels.validationMaxRedemptionsMin;
  }
  if (/max_redemptions|max redemptions|redemptions/i.test(s) && /min|mínimo|minimum/i.test(s)) {
    return labels.validationMaxRedemptionsMin;
  }
  return s;
}

export function CreateCouponForm({
  onSave,
  mode = "new",
  submitDisabled = false,
  cancelHref = "/pages/products/discounts-coupons",
}: CreateCouponFormProps) {
  const translations = useDiscountsCouponsTranslations();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    minPurchase: 0,
    usageLimit: 100,
    maxUsesPerUser: 1,
    validFrom: "",
    validUntil: "",
    days: [] as string[],
    hoursEnabled: false,
    hoursStart: "09:00",
    hoursEnd: "18:00",
    timezone: "America/Guayaquil",
  });

  const days = [
    { value: "monday", label: translations.create.daysOfWeek.monday },
    { value: "tuesday", label: translations.create.daysOfWeek.tuesday },
    { value: "wednesday", label: translations.create.daysOfWeek.wednesday },
    { value: "thursday", label: translations.create.daysOfWeek.thursday },
    { value: "friday", label: translations.create.daysOfWeek.friday },
    { value: "saturday", label: translations.create.daysOfWeek.saturday },
    { value: "sunday", label: translations.create.daysOfWeek.sunday },
  ];

  const handleDayToggle = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const usageLimitNum = Number(formData.usageLimit);
    const maxUsesPerUserNum = Number(formData.maxUsesPerUser);

    if (!Number.isFinite(usageLimitNum) || usageLimitNum < 1) {
      setSubmitError(translations.create.validationMaxRedemptionsMin);
      return;
    }
    if (mode === "new") {
      if (!Number.isFinite(maxUsesPerUserNum) || maxUsesPerUserNum < 1) {
        setSubmitError(translations.create.validationMaxUsesPerUserMin);
        return;
      }
    }

    const couponData = {
      ...formData,
      usageLimit: Math.floor(usageLimitNum),
      maxUsesPerUser: Math.floor(maxUsesPerUserNum),
      availability: {
        days: formData.days,
        hours: formData.hoursEnabled
          ? { start: formData.hoursStart, end: formData.hoursEnd }
          : null,
      },
    };

    setIsSubmitting(true);
    try {
      await onSave(couponData);
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      setSubmitError(
        friendlyCouponSaveError(raw, {
          validationMaxRedemptionsMin: translations.create.validationMaxRedemptionsMin,
          validationMaxUsesPerUserMin: translations.create.validationMaxUsesPerUserMin,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-8 shadow-sm dark:border-dark-3 dark:bg-dark-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        {submitError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
          >
            {submitError}
          </div>
        ) : null}
        {/* Basic Information */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            {translations.create.basicInformation}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.create.couponCode}
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                placeholder={translations.create.couponCodePlaceholder}
              />
            </div>
            {mode === "new" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.create.name} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  placeholder={translations.create.namePlaceholder}
                />
              </div>
            )}
            {mode === "new" && (
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                  {translations.create.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  placeholder={translations.create.descriptionPlaceholder}
                />
              </div>
            )}
          </div>
        </div>

        {/* Discount Settings */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            {mode === "new" ? translations.create.discountSettings : "Configuracion del cupón"}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mode === "new" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {translations.create.discountType} *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  >
                    <option value="percentage">{translations.create.types.percentage}</option>
                    <option value="fixed">{translations.create.types.fixed}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    {translations.create.discountValue} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: parseFloat(e.target.value) })
                    }
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                    placeholder={formData.discountType === "percentage" ? "20" : "50"}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                    Compra minima
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchase: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                  />
                </div>
              </>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.create.usageLimit} *
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.usageLimit}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setFormData({
                    ...formData,
                    usageLimit: Number.isNaN(v) ? 0 : v,
                  });
                }}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
              <p className="mt-1 text-xs text-dark-6 dark:text-dark-6">
                {translations.create.maxRedemptionsHelp}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.create.maxUsesPerUserLabel}
              </label>
              <input
                type="number"
                min={1}
                value={formData.maxUsesPerUser}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setFormData({
                    ...formData,
                    maxUsesPerUser: Number.isNaN(v) ? 0 : v,
                  });
                }}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                disabled={mode !== "new"}
              />
            </div>
          </div>
        </div>

        {/* Validity Period */}
        {mode === "new" && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            {translations.create.validityPeriod}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.create.validFrom} *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.create.validUntil} *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
            </div>
          </div>
        </div>
        )}

        {/* Availability */}
        {mode === "new" && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            {translations.create.availability}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.create.availableDays} *
              </label>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      formData.days.includes(day.value)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hoursEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, hoursEnabled: e.target.checked })
                  }
                  className="rounded border-stroke text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-dark dark:text-white">
                  {translations.create.restrictHours}
                </span>
              </label>
              {formData.hoursEnabled && (
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs text-dark-6 dark:text-dark-6">
                      {translations.create.startTime}
                    </label>
                    <input
                      type="time"
                      value={formData.hoursStart}
                      onChange={(e) =>
                        setFormData({ ...formData, hoursStart: e.target.value })
                      }
                      className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-dark-6 dark:text-dark-6">
                      {translations.create.endTime}
                    </label>
                    <input
                      type="time"
                      value={formData.hoursEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, hoursEnd: e.target.value })
                      }
                      className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                placeholder="America/Guayaquil"
              />
            </div>
          </div>
        </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-stroke pt-6 dark:border-dark-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => router.push(cancelHref)}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-2"
          >
            {translations.create.cancel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || submitDisabled}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {mode === "new"
              ? translations.create.createCoupon
              : submitDisabled
                ? "Selecciona un descuento para continuar"
                : "Crear cupón sobre descuento existente"}
          </button>
        </div>
      </form>
    </div>
  );
}

