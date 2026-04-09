"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { MerchantDiscount } from "@/lib/discounts-api";

type DiscountPickerProps = {
  discounts: MerchantDiscount[];
  selectedDiscountId: string | null;
  onSelect: (discountId: string) => void;
  loading?: boolean;
};

function formatDiscountValue(discount: MerchantDiscount): string {
  const rawValue = Number(discount.discount_value || 0);
  if (discount.discount_type === "PERCENTAGE") {
    return `${rawValue}%`;
  }

  return `USD ${rawValue.toFixed(2)}`;
}

function formatDate(dateValue?: string | null): string {
  if (!dateValue) return "Sin fecha";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DiscountPicker({
  discounts,
  selectedDiscountId,
  onSelect,
  loading = false,
}: DiscountPickerProps) {
  const [query, setQuery] = useState("");

  const visibleDiscounts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return discounts;

    return discounts.filter((discount) => {
      const text = [
        discount.name,
        discount.description || "",
        discount.discount_type,
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(normalized);
    });
  }, [discounts, query]);

  const selectedDiscount = useMemo(
    () => discounts.find((discount) => discount.id === selectedDiscountId) ?? null,
    [discounts, selectedDiscountId]
  );

  return (
    <div className="rounded-lg border border-stroke bg-gray-1/60 p-3 dark:border-dark-3 dark:bg-dark-3/30">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-dark dark:text-white">Selecciona un descuento</p>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre o tipo..."
          className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark focus:border-primary focus:outline-none sm:max-w-[280px] dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
      </div>

      {loading ? (
        <p className="rounded-lg border border-dashed border-stroke bg-white px-3 py-5 text-center text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
          Cargando descuentos disponibles...
        </p>
      ) : visibleDiscounts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stroke bg-white px-3 py-5 text-center text-sm text-dark-6 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6">
          No se encontraron descuentos para este merchant.
        </p>
      ) : (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {visibleDiscounts.map((discount) => {
            const isSelected = discount.id === selectedDiscountId;
            return (
              <button
                key={discount.id}
                type="button"
                onClick={() => onSelect(discount.id)}
                className={cn(
                  "w-full rounded-xl border bg-white p-3 text-left transition",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-stroke hover:border-primary/40 hover:bg-gray-1 dark:border-dark-3 dark:bg-dark-2 dark:hover:bg-dark"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-dark dark:text-white")}>
                      {discount.name}
                    </p>
                    {discount.description ? (
                      <p className="mt-1 line-clamp-1 text-xs text-dark-6 dark:text-dark-6">{discount.description}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-dark dark:bg-dark-3 dark:text-dark-6">
                    {formatDiscountValue(discount)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-dark-6 dark:text-dark-6">
                  <span className="rounded-full bg-white px-2 py-0.5 dark:bg-dark-3">{discount.discount_type}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 dark:bg-dark-3">
                    Vigencia: {formatDate(discount.valid_from)} - {formatDate(discount.valid_until)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedDiscount ? (
        <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-primary">
          Seleccionado: <span className="font-semibold">{selectedDiscount.name}</span> ({formatDiscountValue(selectedDiscount)})
        </div>
      ) : null}
    </div>
  );
}