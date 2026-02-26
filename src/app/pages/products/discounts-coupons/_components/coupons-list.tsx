"use client";

import { cn } from "@/lib/utils";
import { useDiscountsCouponsTranslations } from "./use-discounts-coupons-translations";
import { useLanguage, type Language } from "@/contexts/language-context";

export type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  status: "active" | "inactive" | "expired" | "limit_reached";
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    } | null;
  };
  createdAt: string;
};

const mockCoupons: Coupon[] = [
  {
    id: "cpn_001",
    code: "SUMMER20",
    name: "Summer Sale 20%",
    description: "20% off on all summer items",
    discountType: "percentage",
    discountValue: 20,
    status: "active",
    usageLimit: 100,
    usedCount: 45,
    validFrom: "2024-01-01T00:00:00Z",
    validUntil: "2024-12-31T23:59:59Z",
    availability: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      hours: {
        start: "09:00",
        end: "18:00",
      },
    },
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "cpn_002",
    code: "WEEKEND50",
    name: "Weekend Special",
    description: "$50 off on weekends",
    discountType: "fixed",
    discountValue: 50,
    status: "active",
    usageLimit: 50,
    usedCount: 12,
    validFrom: "2024-01-01T00:00:00Z",
    validUntil: "2024-06-30T23:59:59Z",
    availability: {
      days: ["saturday", "sunday"],
      hours: null,
    },
    createdAt: "2024-01-05T14:30:00Z",
  },
  {
    id: "cpn_003",
    code: "FLASH30",
    name: "Flash Sale",
    description: "30% off flash sale",
    discountType: "percentage",
    discountValue: 30,
    status: "limit_reached",
    usageLimit: 25,
    usedCount: 25,
    validFrom: "2024-01-10T00:00:00Z",
    validUntil: "2024-01-20T23:59:59Z",
    availability: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      hours: {
        start: "10:00",
        end: "22:00",
      },
    },
    createdAt: "2024-01-10T08:00:00Z",
  },
];

const mockCouponsEs: Coupon[] = [
  {
    id: "cpn_001",
    code: "VERANO20",
    name: "Venta de Verano 20%",
    description: "20% de descuento en artículos de verano",
    discountType: "percentage",
    discountValue: 20,
    status: "active",
    usageLimit: 100,
    usedCount: 45,
    validFrom: "2024-01-01T00:00:00Z",
    validUntil: "2024-12-31T23:59:59Z",
    availability: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      hours: {
        start: "09:00",
        end: "18:00",
      },
    },
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    id: "cpn_002",
    code: "FINDE50",
    name: "Especial de Fin de Semana",
    description: "$50 de descuento los fines de semana",
    discountType: "fixed",
    discountValue: 50,
    status: "active",
    usageLimit: 50,
    usedCount: 12,
    validFrom: "2024-01-01T00:00:00Z",
    validUntil: "2024-06-30T23:59:59Z",
    availability: {
      days: ["saturday", "sunday"],
      hours: null,
    },
    createdAt: "2024-01-05T14:30:00Z",
  },
  {
    id: "cpn_003",
    code: "FLASH30",
    name: "Oferta Flash",
    description: "30% de descuento en oferta flash",
    discountType: "percentage",
    discountValue: 30,
    status: "limit_reached",
    usageLimit: 25,
    usedCount: 25,
    validFrom: "2024-01-10T00:00:00Z",
    validUntil: "2024-01-20T23:59:59Z",
    availability: {
      days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      hours: {
        start: "10:00",
        end: "22:00",
      },
    },
    createdAt: "2024-01-10T08:00:00Z",
  },
];

export function getMockCoupons(language: Language): Coupon[] {
  return language === "es" ? mockCouponsEs : mockCoupons;
}

interface CouponsListProps {
  coupons: Coupon[];
  onCouponClick: (coupon: Coupon) => void;
}

export function CouponsList({ coupons, onCouponClick }: CouponsListProps) {
  const translations = useDiscountsCouponsTranslations();
  const { language } = useLanguage();
  const locale = language === "es" ? "es-ES" : "en-US";

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

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(value));

  return (
    <div className="space-y-4">
      {coupons.map((coupon, index) => (
        <div
          key={coupon.id}
          data-tour-id={index === 0 ? "tour-discounts-coupon-detail" : undefined}
          onClick={() => onCouponClick(coupon)}
          className="cursor-pointer rounded-lg border border-stroke bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-dark-3 dark:bg-dark-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-dark dark:text-white">{coupon.name}</h3>
                  <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">{coupon.description}</p>
                </div>
                <div
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium capitalize",
                    getStatusColor(coupon.status)
                  )}
                >
                  {getStatusLabel(coupon.status)}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{translations.coupons.code}</p>
                  <p className="mt-1 font-mono text-sm font-medium text-dark dark:text-white">
                    {coupon.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{translations.coupons.discount}</p>
                  <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                    {formatDiscount(coupon)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{translations.coupons.usage}</p>
                  <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                    {coupon.usedCount} / {coupon.usageLimit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-dark-6 dark:text-dark-6">{translations.coupons.validUntil}</p>
                  <p className="mt-1 text-sm font-medium text-dark dark:text-white">
                    {formatDate(coupon.validUntil)}
                  </p>
                </div>
              </div>
            </div>
            <svg
              className="h-5 w-5 text-dark-6 dark:text-dark-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

export { mockCoupons };

