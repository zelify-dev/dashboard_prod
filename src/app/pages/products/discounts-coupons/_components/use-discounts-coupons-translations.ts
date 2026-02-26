"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type DiscountsCouponsTranslations = {
  breadcrumb: {
    coupons: string;
    create: string;
    analytics: string;
    discount: string;
  };
  coupons: {
    pageTitle: string;
    description: string;
    code: string;
    discount: string;
    usage: string;
    validUntil: string;
    status: {
      active: string;
      inactive: string;
      expired: string;
      limit_reached: string;
    };
  };
  detail: {
    title: string;
    couponCode: string;
    name: string;
    description: string;
    discount: string;
    type: string;
    usage: string;
    used: string;
    validityPeriod: string;
    validFrom: string;
    validUntil: string;
    availability: string;
    days: string;
    hours: string;
    close: string;
    types: {
      percentage: string;
      fixed: string;
    };
    daysOfWeek: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
  };
  create: {
    pageTitle: string;
    pageDescription: string;
    basicInformation: string;
    couponCode: string;
    couponCodePlaceholder: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    discountSettings: string;
    discountType: string;
    discountValue: string;
    usageLimit: string;
    validityPeriod: string;
    validFrom: string;
    validUntil: string;
    availability: string;
    availableDays: string;
    restrictHours: string;
    startTime: string;
    endTime: string;
    cancel: string;
    createCoupon: string;
    types: {
      percentage: string;
      fixed: string;
    };
    daysOfWeek: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
  };
  analytics: {
    pageTitle: string;
    description: string;
    totalCoupons: string;
    activeCoupons: string;
    totalRedemptions: string;
    usageRate: string;
    couponPerformance: string;
    coupon: string;
    code: string;
    status: string;
    usage: string;
    rate: string;
  };
};

const DISCOUNTS_COUPONS_TRANSLATIONS: Record<
  Language,
  DiscountsCouponsTranslations
> = {
  en: {
    breadcrumb: {
      coupons: "Discounts & Coupons / Coupons",
      create: "Discounts & Coupons / Create Coupon",
      analytics: "Discounts & Coupons / Analytics & Usage",
      discount: "Discounts & Coupons / Discounts",
    },
    coupons: {
      pageTitle: "Coupons",
      description: "Manage and track all your discount coupons",
      code: "Code",
      discount: "Discount",
      usage: "Usage",
      validUntil: "Valid Until",
      status: {
        active: "active",
        inactive: "inactive",
        expired: "expired",
        limit_reached: "limit reached",
      },
    },
    detail: {
      title: "Coupon Details",
      couponCode: "Coupon Code",
      name: "Name",
      description: "Description",
      discount: "Discount",
      type: "Type",
      usage: "Usage",
      used: "Used",
      validityPeriod: "Validity Period",
      validFrom: "Valid From",
      validUntil: "Valid Until",
      availability: "Availability",
      days: "Days",
      hours: "Hours",
      close: "Close",
      types: {
        percentage: "percentage",
        fixed: "fixed amount",
      },
      daysOfWeek: {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday",
      },
    },
    create: {
      pageTitle: "Create New Coupon",
      pageDescription: "Create a new discount coupon with custom settings",
      basicInformation: "Basic Information",
      couponCode: "Coupon Code",
      couponCodePlaceholder: "SUMMER20",
      name: "Name",
      namePlaceholder: "Summer Sale",
      description: "Description",
      descriptionPlaceholder: "Description of the coupon",
      discountSettings: "Discount Settings",
      discountType: "Discount Type",
      discountValue: "Discount Value",
      usageLimit: "Usage Limit",
      validityPeriod: "Validity Period",
      validFrom: "Valid From",
      validUntil: "Valid Until",
      availability: "Availability",
      availableDays: "Available Days",
      restrictHours: "Restrict to specific hours",
      startTime: "Start Time",
      endTime: "End Time",
      cancel: "Cancel",
      createCoupon: "Create Coupon",
      types: {
        percentage: "Percentage",
        fixed: "Fixed Amount",
      },
      daysOfWeek: {
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sunday: "Sunday",
      },
    },
    analytics: {
      pageTitle: "Analytics & Usage",
      description: "Analyze coupon performance and usage statistics",
      totalCoupons: "Total Coupons",
      activeCoupons: "Active Coupons",
      totalRedemptions: "Total Redemptions",
      usageRate: "Usage Rate",
      couponPerformance: "Coupon Performance",
      coupon: "Coupon",
      code: "Code",
      status: "Status",
      usage: "Usage",
      rate: "Rate",
    },
  },
  es: {
    breadcrumb: {
      coupons: "Descuentos y Cupones / Cupones",
      create: "Descuentos y Cupones / Crear Cupón",
      analytics: "Descuentos y Cupones / Análisis y Uso",
      discount: "Descuentos y Cupones / Descuentos",
    },
    coupons: {
      pageTitle: "Cupones",
      description: "Gestiona y rastrea todos tus cupones de descuento",
      code: "Código",
      discount: "Descuento",
      usage: "Uso",
      validUntil: "Válido Hasta",
      status: {
        active: "activo",
        inactive: "inactivo",
        expired: "expirado",
        limit_reached: "límite alcanzado",
      },
    },
    detail: {
      title: "Detalles del Cupón",
      couponCode: "Código del Cupón",
      name: "Nombre",
      description: "Descripción",
      discount: "Descuento",
      type: "Tipo",
      usage: "Uso",
      used: "Usado",
      validityPeriod: "Período de Validez",
      validFrom: "Válido Desde",
      validUntil: "Válido Hasta",
      availability: "Disponibilidad",
      days: "Días",
      hours: "Horas",
      close: "Cerrar",
      types: {
        percentage: "porcentaje",
        fixed: "monto fijo",
      },
      daysOfWeek: {
        monday: "Lunes",
        tuesday: "Martes",
        wednesday: "Miércoles",
        thursday: "Jueves",
        friday: "Viernes",
        saturday: "Sábado",
        sunday: "Domingo",
      },
    },
    create: {
      pageTitle: "Crear Nuevo Cupón",
      pageDescription:
        "Crea un nuevo cupón de descuento con configuraciones personalizadas",
      basicInformation: "Información Básica",
      couponCode: "Código del Cupón",
      couponCodePlaceholder: "VERANO20",
      name: "Nombre",
      namePlaceholder: "Venta de Verano",
      description: "Descripción",
      descriptionPlaceholder: "Descripción del cupón",
      discountSettings: "Configuración de Descuento",
      discountType: "Tipo de Descuento",
      discountValue: "Valor del Descuento",
      usageLimit: "Límite de Uso",
      validityPeriod: "Período de Validez",
      validFrom: "Válido Desde",
      validUntil: "Válido Hasta",
      availability: "Disponibilidad",
      availableDays: "Días Disponibles",
      restrictHours: "Restringir a horas específicas",
      startTime: "Hora de Inicio",
      endTime: "Hora de Fin",
      cancel: "Cancelar",
      createCoupon: "Crear Cupón",
      types: {
        percentage: "Porcentaje",
        fixed: "Monto Fijo",
      },
      daysOfWeek: {
        monday: "Lunes",
        tuesday: "Martes",
        wednesday: "Miércoles",
        thursday: "Jueves",
        friday: "Viernes",
        saturday: "Sábado",
        sunday: "Domingo",
      },
    },
    analytics: {
      pageTitle: "Análisis y Uso",
      description:
        "Analiza el rendimiento de los cupones y las estadísticas de uso",
      totalCoupons: "Total de Cupones",
      activeCoupons: "Cupones Activos",
      totalRedemptions: "Total de Canjes",
      usageRate: "Tasa de Uso",
      couponPerformance: "Rendimiento de Cupones",
      coupon: "Cupón",
      code: "Código",
      status: "Estado",
      usage: "Uso",
      rate: "Tasa",
    },
  },
};

export function useDiscountsCouponsTranslations() {
  return useLanguageTranslations(DISCOUNTS_COUPONS_TRANSLATIONS);
}
