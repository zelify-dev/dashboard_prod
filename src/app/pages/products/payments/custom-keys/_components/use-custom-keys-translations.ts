"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type CustomKeysTranslations = {
  breadcrumb: string;
  preview: {
    title: string;
    mobileLabel: string;
    webLabel: string;
    switchToMobile: string;
    switchToWeb: string;
    header: {
      title: string;
      subtitle: string;
      heroAlt: string;
    };
    logoAlt: string;
    slideToConfirm: string;
    confirm: {
      back: string;
      subtitle: string;
      recipientLabel: string;
    };
    success: {
      title: string;
      subtitle: string;
      cta: string;
      detailsButton: string;
      detailsTitle: string;
      dateHour: string;
      recipient: string;
      transactionNumber: string;
      paymentMethod: string;
      amount: string;
      fee: string;
      total: string;
      share: string;
      download: string;
    };
    customKey: {
      label: string;
      edit: string;
    };
    keyTypes: {
      cedula: string;
      telefono: string;
      correo: string;
    };
    contacts: {
      title: string;
      empty: string;
      select: string;
    };
    buttons: {
      payToContact: string;
      payToCustomKey: string;
    };
    editModal: {
      title: string;
      keyTypeLabel: string;
      valueLabel: string;
      placeholder: string;
      cancel: string;
      save: string;
      emptyTypes: string;
    };
    paymentModal: {
      title: string;
      amountLabel: string;
      cancel: string;
      confirm: string;
      processing: string;
      processingSubtitle: string;
    };
    newKeyPaymentModal: {
      title: string;
      customKeyLabel: string;
      customKeyPlaceholder: string;
      amountLabel: string;
      cancel: string;
      confirm: string;
      processing: string;
      processingSubtitle: string;
    };
  };
  config: {
    title: string;
    description: string;
    customKeysTitle: string;
    availableTypesLabel: string;
    availableTypesDescription: string;
    brandingTitle: string;
    themeLabel: string;
    lightMode: string;
    darkMode: string;
    logoLabel: string;
    logoUploadHelp: string;
    logoSupportedFormats: string;
    uploadButton: string;
    removeLogo: string;
    colorLabel: string;
    primaryColorLabel: string;
    invalidFileTypeMessage: string;
    fileTooLargeMessage: string;
    optimizedFileTooLargeMessage: string;
    imageProcessErrorMessage: string;
  };
};

const CUSTOM_KEYS_TRANSLATIONS: Record<Language, CustomKeysTranslations> = {
  en: {
    breadcrumb: "Custom Keys",
    preview: {
      title: "Mobile Preview",
      mobileLabel: "Mobile",
      webLabel: "Web",
      switchToMobile: "Switch to mobile view",
      switchToWeb: "Switch to web view",
      header: {
        title: "Payments",
        subtitle: "Make fast and secure payments",
        heroAlt: "Payment animation",
      },
      logoAlt: "Logo",
      slideToConfirm: "Slide to confirm",
      confirm: {
        back: "Back",
        subtitle: "Review the details before sending",
        recipientLabel: "Recipient",
      },
      success: {
        title: "Successful payment",
        subtitle: "Your payment has been successfully completed",
        cta: "Make another payment",
        detailsButton: "Transaction details",
        detailsTitle: "Transaction Details",
        dateHour: "Date/Hour",
        recipient: "Recipient",
        transactionNumber: "Transaction Number",
        paymentMethod: "Payment Method",
        amount: "Amount",
        fee: "Fee",
        total: "Total",
        share: "Share",
        download: "Download",
      },
      customKey: {
        label: "Custom Key Configured",
        edit: "Edit",
      },
      keyTypes: {
        cedula: "ID Number",
        telefono: "Phone",
        correo: "Email",
      },
      contacts: {
        title: "Suggested Contacts",
        empty: "No contacts available. Enable at least one key type in settings.",
        select: "Select",
      },
      buttons: {
        payToContact: "Pay to",
        payToCustomKey: "Pay to Custom Key",
      },
      editModal: {
        title: "Edit",
        keyTypeLabel: "Key type",
        valueLabel: "Value",
        placeholder: "Enter your",
        cancel: "Cancel",
        save: "Save",
        emptyTypes: "No key types available. Enable at least one in settings.",
      },
      paymentModal: {
        title: "Confirm Payment",
        amountLabel: "Amount",
        cancel: "Cancel",
        confirm: "Confirm Payment",
        processing: "Processing payment...",
        processingSubtitle: "Please wait",
      },
      newKeyPaymentModal: {
        title: "Pay to Custom Key",
        customKeyLabel: "Custom Key",
        customKeyPlaceholder: "Enter the recipient's custom key",
        amountLabel: "Amount",
        cancel: "Cancel",
        confirm: "Confirm Payment",
        processing: "Processing payment...",
        processingSubtitle: "Please wait",
      },
    },
    config: {
      title: "Configuration",
      description: "Configure Custom Keys settings",
      customKeysTitle: "Custom Keys",
      availableTypesLabel: "Available key types",
      availableTypesDescription: "Select the key types that users can use. At least one type must be enabled.",
      brandingTitle: "Custom Branding",
      themeLabel: "Theme",
      logoLabel: "Logo",
      logoUploadHelp: "Drop, paste or select an image",
      logoSupportedFormats: "PNG, JPG, SVG, GIF, WEBP (max. 5MB)",
      uploadButton: "Upload",
      removeLogo: "Remove",
      colorLabel: "Custom color",
      primaryColorLabel: "Primary color",
      invalidFileTypeMessage: "Invalid file format. Please upload PNG, JPG, GIF, WEBP or SVG.",
      fileTooLargeMessage: "The file is too large. The maximum allowed size is 5MB.",
      optimizedFileTooLargeMessage:
        "The optimized image is still too large. Please try a smaller image.",
      imageProcessErrorMessage: "Error processing image. Please try again.",
      lightMode: "Light",
      darkMode: "Dark",
    },
  },
  es: {
    breadcrumb: "Claves personalizadas",
    preview: {
      title: "Vista previa móvil",
      mobileLabel: "Móvil",
      webLabel: "Web",
      switchToMobile: "Cambiar a la vista móvil",
      switchToWeb: "Cambiar a la vista web",
      header: {
        title: "Pagos",
        subtitle: "Realiza pagos rápidos y seguros",
        heroAlt: "Animación de pago",
      },
      logoAlt: "Logo",
      slideToConfirm: "Desliza para confirmar",
      confirm: {
        back: "Volver",
        subtitle: "Revisa los detalles antes de enviar",
        recipientLabel: "Destinatario",
      },
      success: {
        title: "Pago exitoso",
        subtitle: "Tu pago se ha completado correctamente",
        cta: "Hacer otro pago",
        detailsButton: "Detalles de la transacción",
        detailsTitle: "Detalles de la transacción",
        dateHour: "Fecha/Hora",
        recipient: "Destinatario",
        transactionNumber: "Número de transacción",
        paymentMethod: "Método de pago",
        amount: "Monto",
        fee: "Comisión",
        total: "Total",
        share: "Compartir",
        download: "Descargar",
      },
      customKey: {
        label: "Clave personalizada configurada",
        edit: "Editar",
      },
      keyTypes: {
        cedula: "Cédula",
        telefono: "Teléfono",
        correo: "Correo",
      },
      contacts: {
        title: "Contactos Sugeridos",
        empty: "No hay contactos disponibles. Habilita al menos un tipo de clave en la configuración.",
        select: "Seleccionar",
      },
      buttons: {
        payToContact: "Pagar a",
        payToCustomKey: "Pagar a clave personalizada",
      },
      editModal: {
        title: "Editar",
        keyTypeLabel: "Tipo de clave",
        valueLabel: "Valor",
        placeholder: "Ingresa tu",
        cancel: "Cancelar",
        save: "Guardar",
        emptyTypes: "No hay tipos de claves disponibles. Habilita al menos uno en la configuración.",
      },
      paymentModal: {
        title: "Confirmar Pago",
        amountLabel: "Monto",
        cancel: "Cancelar",
        confirm: "Confirmar Pago",
        processing: "Procesando pago...",
        processingSubtitle: "Por favor espera",
      },
      newKeyPaymentModal: {
        title: "Pagar a clave personalizada",
        customKeyLabel: "Clave personalizada",
        customKeyPlaceholder: "Ingresa la clave personalizada del destinatario",
        amountLabel: "Monto",
        cancel: "Cancelar",
        confirm: "Confirmar Pago",
        processing: "Procesando pago...",
        processingSubtitle: "Por favor espera",
      },
    },
    config: {
      title: "Configuración",
      description: "Configura los ajustes de claves personalizadas",
      customKeysTitle: "Claves personalizadas",
      availableTypesLabel: "Tipos de claves disponibles",
      availableTypesDescription: "Selecciona los tipos de claves que los usuarios pueden usar. Debe haber al menos un tipo habilitado.",
      brandingTitle: "Personalización de marca",
      themeLabel: "Tema",
      logoLabel: "Logo",
      logoUploadHelp: "Suelta, pega o selecciona una imagen",
      logoSupportedFormats: "PNG, JPG, SVG, GIF, WEBP (máx. 5MB)",
      uploadButton: "Subir",
      removeLogo: "Quitar",
      colorLabel: "Color personalizado",
      primaryColorLabel: "Color primario",
      invalidFileTypeMessage:
        "Formato de archivo no válido. Por favor, sube una imagen PNG, JPG, GIF, WEBP o SVG.",
      fileTooLargeMessage:
        "El archivo es demasiado grande. El tamaño máximo permitido es 5MB.",
      optimizedFileTooLargeMessage:
        "La imagen optimizada sigue siendo muy grande. Por favor, intenta con una imagen más pequeña.",
      imageProcessErrorMessage:
        "Error al procesar la imagen. Por favor, intenta de nuevo.",
      lightMode: "Claro",
      darkMode: "Oscuro",
    },
  },
};

export function useCustomKeysTranslations() {
  return useLanguageTranslations(CUSTOM_KEYS_TRANSLATIONS);
}
