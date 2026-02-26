"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type TransfersTranslations = {
  amount: {
    tag: string;
    title: string;
    subtitle: string;
    amountLabel: string;
    recipientAria: string;
    historyTag: string;
    historyTitle: string;
    viewAll: string;
    empty: string;
  };
  recipients: {
    back: string;
    tag: string;
    title: string;
    selectAction: string;
    empty: string;
  };
  summary: {
    back: string;
    tag: string;
    title: string;
    subtitle: string;
    recipientLabel: string;
    amountLabel: string;
    noteLabel: string;
  };
  slider: {
    label: string;
    release: string;
    drag: string;
  };
  historyDetail: {
    back: string;
    tag: string;
    titlePrefix: string;
    dateLabel: string;
    amountLabel: string;
    recipientLabel: string;
    reference: string;
    concept: string;
    fee: string;
    share: string;
  };
  processing: {
    tag: string;
    title: string;
    subtitle: string;
  };
  success: {
    title: string;
    subtitle: string;
    cta: string;
  };
  config: {
    title: string;
    description: string;
    currencyLabel: string;
    regionNames: Record<"mexico" | "brasil" | "colombia" | "estados_unidos" | "ecuador", string>;
  };
  customization: {
    title: string;
    description: string;
    txGuardLabel: string;
    limitsSecurityTitle: string;
    accountTypes: {
      operational: { name: string; description: string };
      individual: { name: string; description: string };
    };
    branding: {
      sectionTitle: string;
      themeLabel: string;
      lightMode: string;
      logoLightLabel: string;
      dragOrPasteLogo: string;
      supportedFormats: string;
      selectFile: string;
      colorPaletteLabel: string;
      colorPrimaryLabel: string;
      confirmButtonTypeLabel: string;
      confirmButtonSlider: string;
      confirmButtonFixed: string;
      logoAlt: string;
      invalidFileType: string;
      fileTooLarge: string;
      optimizedFileTooLarge: string;
      imageProcessError: string;
    };
    dailyLimitLabel: string;
    perTransactionLabel: string;
    dualApproval: { title: string; desc: string; active: string; inactive: string };
    autoBlock: { title: string; desc: string; active: string; inactive: string };
    saveButton: string;
  };
  common: {
    back: string;
    animationAlt: string;
    logoAlt: string;
    notePlaceholder: string;
  };
  successDetails: {
    title: string;
    dateHour: string;
    transactionNumber: string;
    paymentMethod: string;
    total: string;
    download: string;
  };
  statuses: Record<"completed" | "pending" | "failed", string>;
  previewTitle: string;
  defaultNote: string;
};

const TRANSFERS_TRANSLATIONS: Record<Language, TransfersTranslations> = {
  en: {
    amount: {
      tag: "Transfers",
      title: "How much do you want to transfer?",
      subtitle: "Select the currency based on the destination country.",
      amountLabel: "Amount",
      recipientAria: "Choose recipient",
      historyTag: "History",
      historyTitle: "Latest transfers",
      viewAll: "View all",
      empty: "No recent transfers for this country.",
    },
    recipients: {
      back: "← Back",
      tag: "Contacts",
      title: "Select the recipient",
      selectAction: "Select",
      empty: "No saved recipients for this country.",
    },
    summary: {
      back: "← Change recipient",
      tag: "Summary",
      title: "Confirm the transfer",
      subtitle: "Review the details before sending.",
      recipientLabel: "Recipient",
      amountLabel: "Amount",
      noteLabel: "Note",
    },
    slider: {
      label: "Confirm",
      release: "Release to confirm",
      drag: "Slide to confirm",
    },
    historyDetail: {
      back: "← Back to history",
      tag: "Details",
      titlePrefix: "Transfer to",
      dateLabel: "Date",
      amountLabel: "Amount sent",
      recipientLabel: "Recipient",
      reference: "Reference",
      concept: "Concept",
      fee: "Fee",
      share: "Share",
    },
    processing: {
      tag: "Processing",
      title: "Sending transfer...",
      subtitle: "This will just take a moment.",
    },
    success: {
      title: "Transfer sent",
      subtitle: "Zelify notified the recipient.",
      cta: "Make another transfer",
    },
    config: {
      title: "Configuration",
      description: "Select the country to adjust currency.",
      currencyLabel: "Currency:",
      regionNames: {
        mexico: "Mexico",
        brasil: "Brazil",
        colombia: "Colombia",
        estados_unidos: "United States",
        ecuador: "Ecuador",
      },
    },
    customization: {
      title: "Custom rules",
      description: "Configure limits and policies per account type.",
      txGuardLabel: "Tx Guard",
      limitsSecurityTitle: "Limits & Security",
      accountTypes: {
        operational: { name: "Operational account", description: "Day-to-day payments with automated monitoring." },
        individual: { name: "Individual account", description: "Users with limited access and basic controls." },
      },
      branding: {
        sectionTitle: "Custom Branding",
        themeLabel: "Theme",
        lightMode: "Light",
        logoLightLabel: "Logo for light mode",
        dragOrPasteLogo: "Drag or paste your logo here",
        supportedFormats: "PNG, JPG, SVG, GIF, WEBP (max. 5MB)",
        selectFile: "Select file",
        colorPaletteLabel: "Color palette for",
        colorPrimaryLabel: "Primary color",
        confirmButtonTypeLabel: "Confirm button type",
        confirmButtonSlider: "Slide to confirm",
        confirmButtonFixed: "Fixed button",
        logoAlt: "Logo",
        invalidFileType: "Invalid file format. Please upload PNG, JPG, GIF, WEBP or SVG.",
        fileTooLarge: "The file is too large. Maximum allowed size is 5MB.",
        optimizedFileTooLarge: "The optimized image is still too large. Please try a smaller image.",
        imageProcessError: "Error processing image. Please try again.",
      },
      dailyLimitLabel: "Daily limit",
      perTransactionLabel: "Per transaction",
      dualApproval: { title: "Dual approval", desc: "Require two approvers for sensitive amounts.", active: "Active", inactive: "Inactive" },
      autoBlock: { title: "Auto block", desc: "Stop accounts with more than 3 alerts in 24h.", active: "Active", inactive: "Inactive" },
      saveButton: "Save settings",
    },
    common: {
      back: "Back",
      animationAlt: "Animation",
      logoAlt: "Logo",
      notePlaceholder: "Add a note (optional)",
    },
    successDetails: {
      title: "Transaction Details",
      dateHour: "Date/Hour",
      transactionNumber: "Transaction Number",
      paymentMethod: "Payment Method",
      total: "Total",
      download: "Download",
    },
    statuses: {
      completed: "Completed",
      pending: "Pending",
      failed: "Failed",
    },
    previewTitle: "Mobile Preview",
    defaultNote: "Weekly payment",
  },
  es: {
    amount: {
      tag: "Transferencias",
      title: "¿Cuánto deseas transferir?",
      subtitle: "Selecciona la divisa según el país.",
      amountLabel: "Monto",
      recipientAria: "Elegir destinatario",
      historyTag: "Historial",
      historyTitle: "Últimas transferencias",
      viewAll: "Ver todo",
      empty: "Sin transferencias recientes para este país.",
    },
    recipients: {
      back: "← Regresar",
      tag: "Contactos",
      title: "Selecciona el destinatario",
      selectAction: "Seleccionar",
      empty: "No hay destinatarios guardados para este país.",
    },
    summary: {
      back: "← Cambiar destinatario",
      tag: "Resumen",
      title: "Confirma la transferencia",
      subtitle: "Revisa los detalles antes de enviar.",
      recipientLabel: "Destinatario",
      amountLabel: "Monto",
      noteLabel: "Nota",
    },
    slider: {
      label: "Confirmar",
      release: "Suelta para confirmar",
      drag: "Desliza para confirmar",
    },
    historyDetail: {
      back: "← Volver al historial",
      tag: "Detalle",
      titlePrefix: "Transferencia a",
      dateLabel: "Fecha",
      amountLabel: "Monto enviado",
      recipientLabel: "Destinatario",
      reference: "Referencia",
      concept: "Concepto",
      fee: "Comisión",
      share: "Compartir",
    },
    processing: {
      tag: "Procesando",
      title: "Enviando transferencia...",
      subtitle: "Esto tomará solo un momento.",
    },
    success: {
      title: "Transferencia enviada",
      subtitle: "Zelify notificó al destinatario.",
      cta: "Hacer otra transferencia",
    },
    config: {
      title: "Configuración",
      description: "Selecciona el país para ajustar la divisa.",
      currencyLabel: "Divisa:",
      regionNames: {
        mexico: "México",
        brasil: "Brasil",
        colombia: "Colombia",
        estados_unidos: "Estados Unidos",
        ecuador: "Ecuador",
      },
    },
    customization: {
      title: "Reglas personalizadas",
      description: "Configura límites y políticas por tipo de cuenta.",
      txGuardLabel: "Tx Guard",
      limitsSecurityTitle: "Límites y seguridad",
      accountTypes: {
        operational: { name: "Cuenta operativa", description: "Pagos del día a día con monitoreo automatizado." },
        individual: { name: "Cuenta individual", description: "Usuarios con acceso limitado y controles básicos." },
      },
      branding: {
        sectionTitle: "Personalización de marca",
        themeLabel: "Tema",
        lightMode: "Claro",
        logoLightLabel: "Logo para modo claro",
        dragOrPasteLogo: "Arrastra o pega tu logo aquí",
        supportedFormats: "PNG, JPG, SVG, GIF, WEBP (máx. 5MB)",
        selectFile: "Seleccionar archivo",
        colorPaletteLabel: "Paleta de colores para modo",
        colorPrimaryLabel: "Color primario",
        confirmButtonTypeLabel: "Tipo de botón de confirmación",
        confirmButtonSlider: "Deslizar para confirmar",
        confirmButtonFixed: "Botón fijo",
        logoAlt: "Logo",
        invalidFileType: "Formato de archivo no válido. Por favor, sube una imagen PNG, JPG, GIF, WEBP o SVG.",
        fileTooLarge: "El archivo es demasiado grande. El tamaño máximo permitido es 5MB.",
        optimizedFileTooLarge: "La imagen optimizada sigue siendo muy grande. Por favor, intenta con una imagen más pequeña.",
        imageProcessError: "Error al procesar la imagen. Por favor, intenta de nuevo.",
      },
      dailyLimitLabel: "Límite diario",
      perTransactionLabel: "Monto por operación",
      dualApproval: { title: "Doble aprobación", desc: "Solicitar dos aprobadores para montos sensibles.", active: "Activo", inactive: "Inactivo" },
      autoBlock: { title: "Bloqueo automático", desc: "Detener cuentas con más de 3 alertas en 24h.", active: "Activo", inactive: "Inactivo" },
      saveButton: "Guardar configuración",
    },
    common: {
      back: "Atrás",
      animationAlt: "Animación",
      logoAlt: "Logo",
      notePlaceholder: "Agregar una nota (opcional)",
    },
    successDetails: {
      title: "Detalles de la transacción",
      dateHour: "Fecha/Hora",
      transactionNumber: "Número de transacción",
      paymentMethod: "Método de pago",
      total: "Total",
      download: "Descargar",
    },
    statuses: {
      completed: "Completada",
      pending: "Pendiente",
      failed: "Fallida",
    },
    previewTitle: "Vista previa móvil",
    defaultNote: "Pago semanal",
  },
};

export function useTransfersTranslations() {
  return useLanguageTranslations(TRANSFERS_TRANSLATIONS);
}

export { TRANSFERS_TRANSLATIONS };
