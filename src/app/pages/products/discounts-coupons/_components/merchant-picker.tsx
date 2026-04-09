"use client";

import { cn } from "@/lib/utils";
import type { DiscountMerchant } from "@/lib/discounts-api";

type MerchantPickerProps = {
  merchants: DiscountMerchant[];
  selectedMerchantId: string | null;
  onSelect: (merchantId: string) => void;
  loading?: boolean;
  countryCode?: string | null;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function MerchantPicker({
  merchants,
  selectedMerchantId,
  onSelect,
  loading = false,
  countryCode,
}: MerchantPickerProps) {
  return (
    <div className="rounded-lg border border-stroke bg-white px-4 py-3 text-sm shadow-sm dark:border-dark-3 dark:bg-dark-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
          Merchant seleccionado
        </p>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-dark-6 dark:bg-dark-3 dark:text-dark-6">
          {countryCode || "EC"}
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-dark-6 dark:text-dark-6">Cargando merchants...</p>
      ) : merchants.length === 0 ? (
        <p className="text-sm text-dark-6 dark:text-dark-6">No hay merchants disponibles</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {merchants.map((merchant) => {
            const isSelected = merchant.id === selectedMerchantId;
            return (
              <button
                key={merchant.id}
                type="button"
                onClick={() => onSelect(merchant.id)}
                className={cn(
                  "group min-w-[92px] rounded-xl border p-2 text-center transition",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-stroke bg-white hover:border-primary/50 hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark-3"
                )}
              >
                <div
                  className={cn(
                    "mx-auto mb-2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-stroke dark:border-dark-3"
                  )}
                >
                  {merchant.logo_url ? (
                    <img
                      src={merchant.logo_url}
                      alt={merchant.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-dark-6 dark:text-dark-6">
                      {getInitials(merchant.name)}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "line-clamp-1 text-xs font-medium",
                    isSelected ? "text-primary" : "text-dark dark:text-white"
                  )}
                >
                  {merchant.name}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
