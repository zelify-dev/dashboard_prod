"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";
import type { Country, DocumentType, LivenessType, ScreenStep } from "./workflow-config";

type ChecklistItem = { title: string; description: string };

type IdentityWorkflowTranslations = {
  countries: Record<Country, string>;
  documents: Record<Country, Record<DocumentType, string>>;
  documentTypeLabels: Record<DocumentType, string>;
  documentDescriptions: Record<DocumentType, string>;
  livenessTypeNames: Record<LivenessType, string>;
  page: {
    breadcrumb: string;
    backToList: string;
  };
  workflowsList: {
    title: string;
    subtitle: string;
    newButton: string;
    tableHeaders: {
      name: string;
      country: string;
      status: string;
      verification: string;
      created: string;
      updated: string;
      actions: string;
    };
    emptyState: string;
    statusLabels: Record<"active" | "inactive" | "draft", string>;
  };
  preview: {
    toggles: {
      mobilePreview: string;
      webPreview: string;
      mobileLabel: string;
      webLabel: string;
      switchToMobile: string;
      switchToWeb: string;
    };
    navigation: {
      back: string;
      next: string;
    };
    welcome: {
      title: string;
      subtitle: string;
      checklist: ChecklistItem[];
      consent: {
        prefix: string;
        privacyPolicy: string;
        connector: string;
        terms: string;
        suffix: string;
      };
      startButton: string;
    };
    documentSelection: {
      title: string;
      subtitle: string;
      descriptions: Record<DocumentType, string>;
    };
    documentCapture: {
      titlePrefix: string;
      fallbackTitle: string;
      instructions: {
        front: string;
        back: string;
      };
      overlayTitle: {
        front: string;
        back: string;
      };
      overlayHint: string;
      capturedLabel: string;
      buttons: {
        captureFront: string;
        captureBack: string;
        capturing: string;
        captured: string;
        continue: string;
      };
    };
    liveness: {
      title: string;
      subtitle: string;
      optionTitles: Record<"selfie_photo" | "selfie_video", string>;
      optionDescriptions: Record<"selfie_photo" | "selfie_video", string>;
      startButton: string;
      scanning: {
        pendingTitle: string;
        completedTitle: string;
        verifyingTitle: string;
        progressLabelPending: string;
        progressLabelDone: string;
        messages: [string, string, string, string, string, string];
        startingCamera: string;
      };
    };
    result: {
      approvedTitle: string;
      rejectedTitle: string;
      approvedDescription: string;
      rejectedDescription: string;
      labels: {
        country: string;
        document: string;
        method: string;
      };
      buttons: {
        finish: string;
        retry: string;
      };
    };
  };
  config: {
    sections: {
      country: string;
      screens: string;
      documents: string;
      liveness: string;
      branding: string;
    };
    screensDescription: string;
    labels: {
      current: string;
    };
    screenNames: Record<ScreenStep, string>;
    branding: {
      themeLabel: string;
      lightMode: string;
      darkMode: string;
      modeNames: Record<"light" | "dark", string>;
      logoLabel: string;
      changeLogo: string;
      uploadLogo: string;
      logoHint: string;
      colorPaletteLabel: string;
      buttonBackground: string;
      buttonLabel: string;
      labelColor: string;
    };
  };
};

const IDENTITY_TRANSLATIONS: Record<Language, IdentityWorkflowTranslations> = {
  en: {
    countries: {
      ecuador: "Ecuador",
      mexico: "Mexico",
      colombia: "Colombia",
    },
    documents: {
      ecuador: {
        drivers_license: "Driver's License",
        id_card: "Identity Card",
        passport: "Passport",
      },
      mexico: {
        drivers_license: "Driver's License",
        id_card: "INE / Voting Credential",
        passport: "Passport",
      },
      colombia: {
        drivers_license: "Driver's License",
        id_card: "Citizenship Card",
        passport: "Passport",
      },
    },
    documentTypeLabels: {
      drivers_license: "Driver's License",
      id_card: "National ID",
      passport: "Passport",
    },
    documentDescriptions: {
      drivers_license: "Valid driver's license",
      id_card: "Official identity document",
      passport: "Valid passport",
    },
    livenessTypeNames: {
      photo: "Photo Upload",
      video: "Guided Video",
      selfie_photo: "Selfie (Photo)",
      selfie_video: "Selfie (Video)",
    },
    page: {
      breadcrumb: "Workflow",
      backToList: "Back to Workflows",
    },
    workflowsList: {
      title: "Workflows",
      subtitle: "Manage your identity verification workflows",
      newButton: "New Workflow",
      tableHeaders: {
        name: "Name",
        country: "Country",
        status: "Status",
        verification: "Verification",
        created: "Created",
        updated: "Updated",
        actions: "Actions",
      },
      emptyState: "No workflows found. Create your first workflow to get started.",
      statusLabels: {
        active: "Active",
        inactive: "Inactive",
        draft: "Draft",
      },
    },
    preview: {
      toggles: {
        mobilePreview: "Mobile Preview",
        webPreview: "Web Preview",
        mobileLabel: "Mobile",
        webLabel: "Web",
        switchToMobile: "Switch to mobile view",
        switchToWeb: "Switch to web view",
      },
      navigation: {
        back: "Back",
        next: "Next",
      },
      welcome: {
        title: "Identity Verification",
        subtitle: "We will verify your identity securely and quickly",
        checklist: [
          { title: "Fast and secure process", description: "Completed in less than 2 minutes" },
          { title: "Protected data", description: "End-to-end encryption" },
          { title: "Instant verification", description: "Real-time results" },
        ],
        consent: {
          prefix: "I accept the ",
          privacyPolicy: "privacy policy",
          connector: " and ",
          terms: "terms of service",
          suffix: "",
        },
        startButton: "Start Verification",
      },
      documentSelection: {
        title: "Select your document",
        subtitle: "Choose the type of document you want to use for verification",
        descriptions: {
          drivers_license: "Valid driver's license",
          id_card: "Official identity document",
          passport: "Valid passport",
        },
      },
      documentCapture: {
        titlePrefix: "Capture",
        fallbackTitle: "Document",
        instructions: {
          front: "Take a photo of the front of your document",
          back: "Take a photo of the back of your document",
        },
        overlayTitle: {
          front: "Document front",
          back: "Document back",
        },
        overlayHint: "Make sure the document is well lit and fully visible",
        capturedLabel: "Document front",
        buttons: {
          captureFront: "Capture Front",
          captureBack: "Capture Back",
          capturing: "Capturing...",
          captured: "Captured ✓",
          continue: "Continue with Verification",
        },
      },
      liveness: {
        title: "Selfie Check",
        subtitle: "Select the facial verification method",
        optionTitles: {
          selfie_photo: "Selfie Check Photo",
          selfie_video: "Selfie Check Video",
        },
        optionDescriptions: {
          selfie_photo: "Take a photo of your face",
          selfie_video: "Record a video of your face",
        },
        startButton: "Start Facial Verification",
        scanning: {
          pendingTitle: "Scanning your face...",
          completedTitle: "Verification completed",
          verifyingTitle: "Verifying identity",
          progressLabelPending: "Completing verification...",
          progressLabelDone: "✓ Verification successful",
          messages: [
            "Align your face within the frame",
            "Detecting face...",
            "Analyzing facial features...",
            "Verifying identity...",
            "Completing verification...",
            "✓ Verification successful",
          ],
          startingCamera: "Starting camera...",
        },
      },
      result: {
        approvedTitle: "Verification Approved",
        rejectedTitle: "Verification Rejected",
        approvedDescription: "Your identity has been successfully verified",
        rejectedDescription: "We couldn't verify your identity. Please try again.",
        labels: {
          country: "Country",
          document: "Document",
          method: "Method",
        },
        buttons: {
          finish: "Finish",
          retry: "Try Again",
        },
      },
    },
    config: {
      sections: {
        country: "Country",
        screens: "Screen Navigation",
        documents: "Document Types",
        liveness: "Liveness Types",
        branding: "Custom Branding",
      },
      screensDescription: "Select the active screen and enable or disable any step",
      labels: {
        current: "Current",
      },
      screenNames: {
        welcome: "Welcome Screen",
        document_selection: "Document Selection",
        document_capture: "Document Capture",
        liveness_check: "Liveness Check",
        result: "Result",
      },
      branding: {
        themeLabel: "Theme",
        lightMode: "Light Mode",
        darkMode: "Dark Mode",
        modeNames: {
          light: "Light",
          dark: "Dark",
        },
        logoLabel: "Logo ({mode} Mode)",
        changeLogo: "Change Logo",
        uploadLogo: "Upload Logo",
        logoHint: "Drag and drop an image (PNG, SVG) here, or paste from the clipboard",
        colorPaletteLabel: "Color Palette ({mode} Mode)",
        buttonBackground: "Button Background Color",
        buttonLabel: "Button Label Color",
        labelColor: "Label Color",
      },
    },
  },
  es: {
    countries: {
      ecuador: "Ecuador",
      mexico: "México",
      colombia: "Colombia",
    },
    documents: {
      ecuador: {
        drivers_license: "Licencia de conducir",
        id_card: "Cédula de identidad",
        passport: "Pasaporte",
      },
      mexico: {
        drivers_license: "Licencia de conducir",
        id_card: "INE / Credencial para votar",
        passport: "Pasaporte",
      },
      colombia: {
        drivers_license: "Licencia de conducción",
        id_card: "Cédula de ciudadanía",
        passport: "Pasaporte",
      },
    },
    documentTypeLabels: {
      drivers_license: "Licencia de conducir",
      id_card: "Documento nacional",
      passport: "Pasaporte",
    },
    documentDescriptions: {
      drivers_license: "Licencia de conducir vigente",
      id_card: "Documento de identidad oficial",
      passport: "Pasaporte vigente",
    },
    livenessTypeNames: {
      photo: "Carga de foto",
      video: "Video guiado",
      selfie_photo: "Selfie (Foto)",
      selfie_video: "Selfie (Video)",
    },
    page: {
      breadcrumb: "Flujos",
      backToList: "Volver a Flujos",
    },
    workflowsList: {
      title: "Flujos",
      subtitle: "Gestiona tus flujos de verificación de identidad",
      newButton: "Nuevo flujo",
      tableHeaders: {
        name: "Nombre",
        country: "País",
        status: "Estado",
        verification: "Verificación",
        created: "Creado",
        updated: "Actualizado",
        actions: "Acciones",
      },
      emptyState: "No se encontraron flujos. Crea tu primer flujo para comenzar.",
      statusLabels: {
        active: "Activo",
        inactive: "Inactivo",
        draft: "Borrador",
      },
    },
    preview: {
      toggles: {
        mobilePreview: "Vista previa móvil",
        webPreview: "Vista previa web",
        mobileLabel: "Móvil",
        webLabel: "Web",
        switchToMobile: "Cambiar a vista móvil",
        switchToWeb: "Cambiar a vista web",
      },
      navigation: {
        back: "Atrás",
        next: "Siguiente",
      },
      welcome: {
        title: "Verificación de identidad",
        subtitle: "Verificaremos tu identidad de forma segura y rápida",
        checklist: [
          { title: "Proceso rápido y seguro", description: "Finaliza en menos de 2 minutos" },
          { title: "Datos protegidos", description: "Cifrado de extremo a extremo" },
          { title: "Verificación instantánea", description: "Resultados en tiempo real" },
        ],
        consent: {
          prefix: "Acepto la ",
          privacyPolicy: "política de privacidad",
          connector: " y los ",
          terms: "términos y condiciones",
          suffix: "",
        },
        startButton: "Iniciar verificación",
      },
      documentSelection: {
        title: "Selecciona tu documento",
        subtitle: "Elige el tipo de documento que deseas usar para la verificación",
        descriptions: {
          drivers_license: "Licencia de conducir vigente",
          id_card: "Documento oficial de identidad",
          passport: "Pasaporte vigente",
        },
      },
      documentCapture: {
        titlePrefix: "Captura",
        fallbackTitle: "el documento",
        instructions: {
          front: "Toma una foto del frente de tu documento",
          back: "Toma una foto del reverso de tu documento",
        },
        overlayTitle: {
          front: "Frente del documento",
          back: "Reverso del documento",
        },
        overlayHint: "Asegúrate de que el documento esté bien iluminado y completo en la imagen",
        capturedLabel: "Frente del documento",
        buttons: {
          captureFront: "Capturar frente",
          captureBack: "Capturar reverso",
          capturing: "Capturando...",
          captured: "Capturado ✓",
          continue: "Continuar con la verificación",
        },
      },
      liveness: {
        title: "Verificación selfie",
        subtitle: "Selecciona el método de verificación facial",
        optionTitles: {
          selfie_photo: "Selfie (Foto)",
          selfie_video: "Selfie (Video)",
        },
        optionDescriptions: {
          selfie_photo: "Toma una foto de tu rostro",
          selfie_video: "Graba un video de tu rostro",
        },
        startButton: "Iniciar verificación facial",
        scanning: {
          pendingTitle: "Escaneando tu rostro...",
          completedTitle: "Verificación completada",
          verifyingTitle: "Verificando identidad",
          progressLabelPending: "Completando verificación...",
          progressLabelDone: "✓ Verificación exitosa",
          messages: [
            "Coloca tu rostro en el marco",
            "Detectando rostro...",
            "Analizando características faciales...",
            "Verificando identidad...",
            "Completando verificación...",
            "✓ Verificación exitosa",
          ],
          startingCamera: "Iniciando cámara...",
        },
      },
      result: {
        approvedTitle: "Verificación aprobada",
        rejectedTitle: "Verificación rechazada",
        approvedDescription: "Tu identidad fue verificada correctamente",
        rejectedDescription: "No pudimos verificar tu identidad. Intenta nuevamente.",
        labels: {
          country: "País",
          document: "Documento",
          method: "Método",
        },
        buttons: {
          finish: "Finalizar",
          retry: "Intentar nuevamente",
        },
      },
    },
    config: {
      sections: {
        country: "País",
        screens: "Navegación de pantallas",
        documents: "Tipos de documento",
        liveness: "Tipos de prueba de vida",
        branding: "Personalización",
      },
      screensDescription: "Selecciona la pantalla activa y habilita o deshabilita los pasos",
      labels: {
        current: "Actual",
      },
      screenNames: {
        welcome: "Pantalla de bienvenida",
        document_selection: "Selección de documento",
        document_capture: "Captura de documento",
        liveness_check: "Prueba de vida",
        result: "Resultado",
      },
      branding: {
        themeLabel: "Tema",
        lightMode: "Modo claro",
        darkMode: "Modo oscuro",
        modeNames: {
          light: "Claro",
          dark: "Oscuro",
        },
        logoLabel: "Logo",
        changeLogo: "Cambiar logo",
        uploadLogo: "Subir logo",
        logoHint: "Arrastra y suelta una imagen (PNG, SVG) aquí o pégala desde el portapapeles",
        colorPaletteLabel: "Paleta de colores",
        buttonBackground: "Color de fondo del botón",
        buttonLabel: "Color de texto del botón",
        labelColor: "Color de etiquetas",
      },
    },
  },
};

export function useIdentityWorkflowTranslations() {
  return useLanguageTranslations(IDENTITY_TRANSLATIONS);
}
