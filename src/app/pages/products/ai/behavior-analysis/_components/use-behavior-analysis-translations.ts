"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

export type BehaviorAnalysisCategoryId =
  | "expenses"
  | "income"
  | "savings"
  | "budget"
  | "investments"
  | "bills";

type BehaviorAnalysisTranslations = {
  breadcrumb: string;
  preview: {
    title: string;
    placeholder: string;
    notificationCount: (current: number, total: number) => string;
  };
  categories: {
    title: string;
    availableNotifications: (count: number) => string;
  };
  branding: {
    title: string;
    notificationLogoLabel: string;
    notificationLogoHelp: string;
    restoreDefaultIcon: string;
    customLogoAlt: string;
    defaultLogoAlt: string;
    chooseFile: string;
    noFileChosen: string;
  };
  defaultNotification: {
    title: string;
    message: string;
  };
  categoryNames: Record<BehaviorAnalysisCategoryId, string>;
  categoryNotifications: Record<
    BehaviorAnalysisCategoryId,
    Array<{ id: string; title: string; message: string; timestamp: string; badge?: number }>
  >;
};

const BEHAVIOR_ANALYSIS_TRANSLATIONS: Record<Language, BehaviorAnalysisTranslations> = {
  en: {
    breadcrumb: "Behavior analysis",
    preview: {
      title: "Mobile Preview",
      placeholder: "Select a category to see the notification",
      notificationCount: (current, total) =>
        `Notification ${current} of ${total} - Click for next`,
    },
    categories: {
      title: "Analysis Categories",
      availableNotifications: (count) => `${count} notifications available`,
    },
    branding: {
      title: "Brand Customization",
      notificationLogoLabel: "Notification logo",
      notificationLogoHelp:
        "By default the Alaiza icon is used. You can upload your own logo.",
      restoreDefaultIcon: "Restore default icon",
      customLogoAlt: "Custom logo",
      defaultLogoAlt: "Alaiza",
      chooseFile: "Choose file",
      noFileChosen: "No file chosen",
    },
    defaultNotification: {
      title: "Behavior analysis",
      message: "Select a category to see personalized notifications.",
    },
    categoryNames: {
      expenses: "Expenses",
      income: "Income",
      savings: "Savings",
      budget: "Budget",
      investments: "Investments",
      bills: "Bills",
    },
    categoryNotifications: {
      expenses: [
        {
          id: "expenses-1",
          title: "Watch your spending",
          message: "Your food spending increased 43%. You could save $65/month.",
          timestamp: "10:24",
          badge: 1,
        },
        {
          id: "expenses-2",
          title: "Unusual spending",
          message: "$250 at restaurants this week, 60% more than your average.",
          timestamp: "14:30",
          badge: 1,
        },
        {
          id: "expenses-3",
          title: "Potential savings",
          message: "Reduce entertainment by 20% and save $120 this month.",
          timestamp: "09:15",
        },
      ],
      income: [
        {
          id: "income-1",
          title: "Income received",
          message: "You received $1,500 this month. Current balance: $3,200.",
          timestamp: "08:00",
        },
        {
          id: "income-2",
          title: "Positive trend",
          message: "Income increased 15% this quarter.",
          timestamp: "11:45",
          badge: 1,
        },
      ],
      savings: [
        {
          id: "savings-1",
          title: "Goal reached",
          message: "You reached your monthly savings goal of $500.",
          timestamp: "16:20",
          badge: 1,
        },
        {
          id: "savings-2",
          title: "Savings opportunity",
          message: "Keep the pace and save $6,000 this year.",
          timestamp: "13:10",
        },
      ],
      budget: [
        {
          id: "budget-1",
          title: "Budget exceeded",
          message: "Transportation exceeded by 25%. Consider adjusting expenses.",
          timestamp: "15:45",
          badge: 1,
        },
        {
          id: "budget-2",
          title: "Budget on track",
          message: "You are within your budget this month.",
          timestamp: "12:00",
        },
      ],
      investments: [
        {
          id: "investments-1",
          title: "Positive returns",
          message: "Your investments generated 8.5% this month.",
          timestamp: "09:30",
          badge: 1,
        },
        {
          id: "investments-2",
          title: "Opportunity",
          message: "Consider diversifying with index funds.",
          timestamp: "17:00",
        },
      ],
      bills: [
        {
          id: "bills-1",
          title: "Bills due",
          message: "3 bills due this week. Total: $450.",
          timestamp: "07:30",
          badge: 3,
        },
        {
          id: "bills-2",
          title: "Payment successful",
          message: "Utility bill of $85 paid.",
          timestamp: "10:00",
        },
      ],
    },
  },
  es: {
    breadcrumb: "Análisis de comportamiento",
    preview: {
      title: "Vista previa móvil",
      placeholder: "Selecciona una categoría para ver la notificación",
      notificationCount: (current, total) =>
        `Notificación ${current} de ${total} - Click para siguiente`,
    },
    categories: {
      title: "Categorías de análisis",
      availableNotifications: (count) => `${count} notificaciones disponibles`,
    },
    branding: {
      title: "Personalización de marca",
      notificationLogoLabel: "Logo de la notificación",
      notificationLogoHelp:
        "Por defecto se usa el icono de Alaiza. Puedes subir tu propio logotipo.",
      restoreDefaultIcon: "Restaurar icono por defecto",
      customLogoAlt: "Logo personalizado",
      defaultLogoAlt: "Alaiza",
      chooseFile: "Seleccionar archivo",
      noFileChosen: "Ningún archivo seleccionado",
    },
    defaultNotification: {
      title: "Análisis de comportamiento",
      message: "Selecciona una categoría para ver notificaciones personalizadas.",
    },
    categoryNames: {
      expenses: "Gastos",
      income: "Ingresos",
      savings: "Ahorros",
      budget: "Presupuesto",
      investments: "Inversiones",
      bills: "Facturas",
    },
    categoryNotifications: {
      expenses: [
        {
          id: "expenses-1",
          title: "Ojo con tus gastos",
          message: "Tu gasto de comida subió 43%. Puedes ahorrar $65 al mes.",
          timestamp: "10:24",
          badge: 1,
        },
        {
          id: "expenses-2",
          title: "Gasto inusual",
          message: "$250 en restaurantes esta semana, 60% más que tu promedio.",
          timestamp: "14:30",
          badge: 1,
        },
        {
          id: "expenses-3",
          title: "Ahorro potencial",
          message: "Reduce entretenimiento 20% y ahorra $120 este mes.",
          timestamp: "09:15",
        },
      ],
      income: [
        {
          id: "income-1",
          title: "Ingreso recibido",
          message: "Has recibido $1,500 este mes. Saldo actual: $3,200.",
          timestamp: "08:00",
        },
        {
          id: "income-2",
          title: "Tendencia positiva",
          message: "Ingresos aumentaron 15% este trimestre.",
          timestamp: "11:45",
          badge: 1,
        },
      ],
      savings: [
        {
          id: "savings-1",
          title: "Meta alcanzada",
          message: "Has alcanzado tu meta de ahorro mensual de $500.",
          timestamp: "16:20",
          badge: 1,
        },
        {
          id: "savings-2",
          title: "Oportunidad de ahorro",
          message: "Mantén tu ritmo y ahorra $6,000 este año.",
          timestamp: "13:10",
        },
      ],
      budget: [
        {
          id: "budget-1",
          title: "Presupuesto excedido",
          message: "Transporte excedido 25%. Considera ajustar tus gastos.",
          timestamp: "15:45",
          badge: 1,
        },
        {
          id: "budget-2",
          title: "Presupuesto en orden",
          message: "Estás dentro de tu presupuesto este mes.",
          timestamp: "12:00",
        },
      ],
      investments: [
        {
          id: "investments-1",
          title: "Rendimiento positivo",
          message: "Tus inversiones generaron 8.5% este mes.",
          timestamp: "09:30",
          badge: 1,
        },
        {
          id: "investments-2",
          title: "Oportunidad",
          message: "Considera diversificar con fondos indexados.",
          timestamp: "17:00",
        },
      ],
      bills: [
        {
          id: "bills-1",
          title: "Factura pendiente",
          message: "3 facturas por vencer esta semana. Total: $450.",
          timestamp: "07:30",
          badge: 3,
        },
        {
          id: "bills-2",
          title: "Pago exitoso",
          message: "Factura de servicios públicos de $85 pagada.",
          timestamp: "10:00",
        },
      ],
    },
  },
};

export function useBehaviorAnalysisTranslations() {
  return useLanguageTranslations(BEHAVIOR_ANALYSIS_TRANSLATIONS);
}
