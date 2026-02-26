"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type QRTranslations = {
  breadcrumb: string;
  preview: {
    title: string;
    header: {
      title: string;
      subtitle: string;
      heroAlt: string;
    };
    modes: {
      showQR: string;
      scanQR: string;
    };
    showQR: {
      title: string;
      subtitle: string;
      shareQR: string;
      saveImage: string;
    };
    scan: {
      scanning: string;
      keepInFrame: string;
      scanned: string;
      loadingData: string;
      back: string;
      recipient: string;
      originAccount: string;
      available: string;
      amountLabel: string;
      slideToConfirm: string;
      simulateScanComplete: string;
      sendPayment: string;
      processing: string;
      processingSubtitle: string;
      success: {
        title: string;
        sentTo: string;
        makeAnother: string;
      };
    };
  };
  config: {
    title: string;
    description: string;
    brandingTitle: string;
    themeLabel: string;
    lightMode: string;
    darkMode: string;
    logoLabel: string;
    logoUploadHelp: string;
    uploadButton: string;
    colorLabel: string;
    webhooks: {
      title: string;
      description: string;
      urlLabel: string;
      urlPlaceholder: string;
      urlHint: string;
      eventsLabel: string;
      eventsDescription: string;
      events: {
        paymentSucceeded: {
          label: string;
          description: string;
        };
        paymentFailed: {
          label: string;
          description: string;
        };
        paymentPending: {
          label: string;
          description: string;
        };
        chargeRefunded: {
          label: string;
          description: string;
        };
      };
    };
    branding: {
      title: string;
      themeLabel: string;
      lightMode: string;
      darkMode: string;
      logoLabel: string;
      logoUploadHelp: string;
      uploadButton: string;
      removeLogo: string;
      colorLabel: string;
    };
  };
};

const QR_TRANSLATIONS: Record<Language, QRTranslations> = {
  en: {
    breadcrumb: "QR",
    preview: {
      title: "Mobile Preview",
      header: {
        title: "QR Payments",
        subtitle: "Receive or make payments with QR",
        heroAlt: "QR animation",
      },
      modes: {
        showQR: "Show QR",
        scanQR: "Scan QR",
      },
      showQR: {
        title: "Your QR code to receive payments",
        subtitle: "Share this code to get paid",
        shareQR: "Share QR",
        saveImage: "Save image",
      },
      scan: {
        scanning: "Scanning QR code...",
        keepInFrame: "Keep the code within the frame",
        scanned: "QR Scanned",
        loadingData: "Loading data...",
        back: "← Back",
        recipient: "Recipient",
        originAccount: "Origin account",
        available: "Available",
        amountLabel: "Amount to send",
        slideToConfirm: "Slide to confirm",
        simulateScanComplete: "Simulate scan complete",
        sendPayment: "Send Payment",
        processing: "Processing payment...",
        processingSubtitle: "Please wait",
        success: {
          title: "Payment sent",
          sentTo: "sent to",
          makeAnother: "Make another payment",
        },
      },
    },
    config: {
      title: "Configuration",
      description: "Configure QR settings",
      brandingTitle: "Custom Branding",
      themeLabel: "Theme",
      lightMode: "Light",
      darkMode: "Dark",
      logoLabel: "Logo",
      logoUploadHelp: "Drag, paste or select an image",
      uploadButton: "Select file",
      colorLabel: "Color palette",
      webhooks: {
        title: "Webhook Configuration",
        description: "Configure webhooks to receive payment event notifications",
        urlLabel: "Payment Webhook URL",
        urlPlaceholder: "https://your-domain.com/webhook/payments",
        urlHint: "The URL where you will receive payment event notifications",
        eventsLabel: "Events to Notify",
        eventsDescription: "Select the events for which you want to receive notifications",
        events: {
          paymentSucceeded: {
            label: "Successful payment (payment.succeeded)",
            description: "The main event. Used to confirm an order and release a product.",
          },
          paymentFailed: {
            label: "Failed payment (payment.failed)",
            description: "Used to notify the client that their payment was not processed.",
          },
          paymentPending: {
            label: "Pending payment (payment.pending)",
            description: "Useful for payments that are not instant (like bank transfers).",
          },
          chargeRefunded: {
            label: "Refund (charge.refunded)",
            description: "Used to update an order status as \"refunded\".",
          },
        },
      },
      branding: {
        title: "Branding",
        themeLabel: "Theme",
        logoLabel: "Logo",
        logoUploadHelp: "Drop, paste or select an image",
        uploadButton: "Upload",
        removeLogo: "Remove",
        colorLabel: "Custom color",
        lightMode: "Light",
        darkMode: "Dark",
      },
    },
  },
  es: {
    breadcrumb: "QR",
    preview: {
      title: "Vista previa móvil",
      header: {
        title: "Pagos QR",
        subtitle: "Recibe o realiza pagos con QR",
        heroAlt: "Animación de QR",
      },
      modes: {
        showQR: "Mostrar QR",
        scanQR: "Escanear QR",
      },
      showQR: {
        title: "Tu código QR para recibir pagos",
        subtitle: "Comparte este código para que te paguen",
        shareQR: "Compartir QR",
        saveImage: "Guardar imagen",
      },
      scan: {
        scanning: "Escaneando código QR...",
        keepInFrame: "Mantén el código dentro del marco",
        scanned: "QR Escaneado",
        loadingData: "Cargando datos...",
        back: "← Volver",
        recipient: "Destinatario",
        originAccount: "Cuenta de origen",
        available: "Disponible",
        amountLabel: "Monto a enviar",
        slideToConfirm: "Desliza para confirmar",
        simulateScanComplete: "Simular escaneo completo",
        sendPayment: "Enviar Pago",
        processing: "Procesando pago...",
        processingSubtitle: "Por favor espera",
        success: {
          title: "Pago enviado",
          sentTo: "enviado a",
          makeAnother: "Realizar otro pago",
        },
      },
    },
    config: {
      title: "Configuración",
      description: "Configura los ajustes de QR",
      brandingTitle: "Personalización de marca",
      themeLabel: "Tema",
      lightMode: "Claro",
      darkMode: "Oscuro",
      logoLabel: "Logo",
      logoUploadHelp: "Arrastra, pega o selecciona una imagen",
      uploadButton: "Seleccionar archivo",
      colorLabel: "Paleta de colores",
      webhooks: {
        title: "Configuración de Webhooks",
        description: "Configura los webhooks para recibir notificaciones de eventos de pago",
        urlLabel: "URL del Webhook de Pagos",
        urlPlaceholder: "https://tu-dominio.com/webhook/pagos",
        urlHint: "La URL donde recibirás las notificaciones de eventos de pago",
        eventsLabel: "Eventos a Notificar",
        eventsDescription: "Selecciona los eventos para los que deseas recibir notificaciones",
        events: {
          paymentSucceeded: {
            label: "Pago exitoso (payment.succeeded)",
            description: "El evento principal. Usado para confirmar una orden y liberar un producto.",
          },
          paymentFailed: {
            label: "Pago fallido (payment.failed)",
            description: "Usado para notificar al cliente que su pago no se procesó.",
          },
          paymentPending: {
            label: "Pago pendiente (payment.pending)",
            description: "Útil para pagos que no son instantáneos (como transferencias bancarias).",
          },
          chargeRefunded: {
            label: "Reembolso (charge.refunded)",
            description: "Usado para actualizar el estado de una orden como \"reembolsada\".",
          },
        },
      },
      branding: {
        title: "Branding",
        themeLabel: "Tema",
        logoLabel: "Logo",
        logoUploadHelp: "Arrastra, pega o selecciona una imagen",
        uploadButton: "Subir",
        removeLogo: "Quitar",
        colorLabel: "Color personalizado",
        lightMode: "Claro",
        darkMode: "Oscuro",
      },
    },
  },
};

export function useQRTranslations() {
  return useLanguageTranslations(QR_TRANSLATIONS);
}
