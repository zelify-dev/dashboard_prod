"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";

interface CreateCouponFormProps {
  onSave: (data: any) => void;
}

export function CreateCouponForm({ onSave }: CreateCouponFormProps) {
  const translations = useDiscountsCouponsTranslations();
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    usageLimit: 100,
    validFrom: "",
    validUntil: "",
    days: [] as string[],
    hoursEnabled: false,
    hoursStart: "09:00",
    hoursEnd: "18:00",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const couponData = {
      ...formData,
      availability: {
        days: formData.days,
        hours: formData.hoursEnabled
          ? { start: formData.hoursStart, end: formData.hoursEnd }
          : null,
      },
    };
    onSave(couponData);
    router.push("/pages/products/discounts-coupons");
  };

  return (
    <div className="rounded-lg border border-stroke bg-white p-8 shadow-sm dark:border-dark-3 dark:bg-dark-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            {translations.create.basicInformation}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                {translations.create.couponCode} *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
                placeholder={translations.create.couponCodePlaceholder}
              />
            </div>
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
          </div>
        </div>

        {/* Discount Settings */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            {translations.create.discountSettings}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {translations.create.usageLimit} *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: parseInt(e.target.value) })
                }
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 text-dark focus:border-primary focus:outline-none dark:border-dark-3 dark:bg-dark-3 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Validity Period */}
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

        {/* Availability */}
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-stroke pt-6 dark:border-dark-3">
          <button
            type="button"
            onClick={() => router.push("/pages/products/discounts-coupons")}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-2"
          >
            {translations.create.cancel}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            {translations.create.createCoupon}
          </button>
        </div>
      </form>
    </div>
  );
}


