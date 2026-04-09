"use client";

import { Coupon } from "./coupons-list";
import { cn } from "@/lib/utils";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";
import { useLanguage } from "@/contexts/language-context";
import { formatLocalDateTime } from "@/lib/date-utils";

interface CouponDetailProps {
  coupon: Coupon;
  onClose: () => void;
  onDeactivate?: (coupon: Coupon) => Promise<void>;
  isDeactivating?: boolean;
}

export function CouponDetail({ coupon, onClose, onDeactivate, isDeactivating = false }: CouponDetailProps) {
  const translations = useDiscountsCouponsTranslations();
  const { language } = useLanguage();
  const locale = language === "es" ? "es-ES" : "en-US";
  const canDeactivate = coupon.status === "active";

  const getStatusColor = (status: Coupon["status"]) => {
    switch (status) {
      case "active":
        return "bg-[#219653]/[0.08] text-[#219653]";
      case "inactive":
        return "bg-gray-100 text-gray-600 dark:bg-dark-3 dark:text-dark-6";
      case "expired":
        return "bg-[#D34053]/[0.08] text-[#D34053]";
      case "limit_reached":
        return "bg-[#FFA70B]/[0.08] text-[#FFA70B]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusLabel = (status: Coupon["status"]) => {
    return translations.coupons.status[status];
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return `$${coupon.discountValue}`;
  };



  const dayNames: Record<string, string> = {
    monday: translations.detail.daysOfWeek.monday,
    tuesday: translations.detail.daysOfWeek.tuesday,
    wednesday: translations.detail.daysOfWeek.wednesday,
    thursday: translations.detail.daysOfWeek.thursday,
    friday: translations.detail.daysOfWeek.friday,
    saturday: translations.detail.daysOfWeek.saturday,
    sunday: translations.detail.daysOfWeek.sunday,
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl rounded-lg border border-stroke bg-white shadow-lg dark:border-dark-3 dark:bg-dark-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke p-6 dark:border-dark-3" data-tour-id="tour-discounts-coupon-detail">
          <h2 className="text-2xl font-bold text-dark dark:text-white">{translations.detail.title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-dark-6 hover:bg-gray-100 dark:text-dark-6 dark:hover:bg-dark-3"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300">
              {translations.detail.couponNotEditable}
            </div>
            {/* Status and Code */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-6 dark:text-dark-6">{translations.detail.couponCode}</p>
                <p className="mt-1 font-mono text-2xl font-bold text-dark dark:text-white">
                  {coupon.code}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium capitalize",
                  getStatusColor(coupon.status)
                )}
              >
                {getStatusLabel(coupon.status)}
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-dark-6 dark:text-dark-6">{translations.detail.name}</p>
                <p className="mt-1 text-dark dark:text-white">{coupon.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-dark-6 dark:text-dark-6">{translations.detail.description}</p>
                <p className="mt-1 text-dark dark:text-white">{coupon.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-dark-6 dark:text-dark-6">{translations.detail.discount}</p>
                <p className="mt-1 text-lg font-semibold text-dark dark:text-white">
                  {formatDiscount(coupon)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-dark-6 dark:text-dark-6">{translations.detail.type}</p>
                <p className="mt-1 capitalize text-dark dark:text-white">
                  {translations.detail.types[coupon.discountType]}
                </p>
              </div>
            </div>

            {/* Usage Info */}
            <div className="rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark-3">
              <p className="mb-3 text-sm font-medium text-dark-6 dark:text-dark-6">{translations.detail.usage}</p>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-dark dark:text-white">{translations.detail.used}</span>
                <span className="font-medium text-dark dark:text-white">
                  {coupon.usedCount} / {coupon.usageLimit}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-dark-2">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(coupon.usedCount / coupon.usageLimit) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Validity */}
            <div>
              <p className="mb-3 text-sm font-medium text-dark-6 dark:text-dark-6">{translations.detail.validityPeriod}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{translations.detail.validFrom}</p>
                  <p className="mt-1 text-dark dark:text-white">
                    {formatLocalDateTime(coupon.validFrom)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{translations.detail.validUntil}</p>
                  <p className="mt-1 text-dark dark:text-white">
                    {formatLocalDateTime(coupon.validUntil)}
                  </p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <p className="mb-3 text-sm font-medium text-dark-6 dark:text-dark-6">{translations.detail.availability}</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{translations.detail.days}</p>
                  <p className="mt-1 text-dark dark:text-white">
                    {coupon.availability?.days?.length
                      ? coupon.availability.days.map((d) => dayNames[d] || d).join(", ")
                      : "No disponible"}
                  </p>
                </div>
                {coupon.availability?.hours ? (
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">{translations.detail.hours}</p>
                    <p className="mt-1 text-dark dark:text-white">
                      {coupon.availability.hours.start} - {coupon.availability.hours.end}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-dark-6 dark:text-dark-6">{translations.detail.hours}</p>
                    <p className="mt-1 text-dark dark:text-white">No disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stroke p-6 dark:border-dark-3">
          <div>
            {!canDeactivate ? (
              <span className="text-xs text-dark-6 dark:text-dark-6">{translations.detail.alreadyInactive}</span>
            ) : null}
          </div>
          <div className="flex gap-3">
            {canDeactivate && onDeactivate ? (
              <button
                onClick={async () => {
                  const confirmed = window.confirm(translations.detail.deactivateConfirm);
                  if (!confirmed) return;
                  await onDeactivate(coupon);
                }}
                disabled={isDeactivating}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                {isDeactivating ? translations.detail.deactivating : translations.detail.deactivate}
              </button>
            ) : null}
          <button
            onClick={onClose}
            className="rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
          >
            {translations.detail.close}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
