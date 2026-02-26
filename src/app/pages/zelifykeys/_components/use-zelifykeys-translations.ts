"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type ZelifyKeysTranslations = {
  breadcrumb: string;
  pageTitle: string;
  clientId: {
    title: string;
    copyToClipboard: string;
  };
  zelifySecrets: {
    title: string;
    sandbox: string;
    rotate: string;
    rotateConfirm: {
      title: string;
      yesRotate: string;
      cancel: string;
      successMessage: string;
    };
    keyName: string;
    secretKey: string;
    show: string;
    hide: string;
    copyToClipboard: string;
    issuedOn: string;
    compromisedQuestion: string;
  };
  production: {
    title: string;
    requestAccess: string;
  };
  secureKeysInfo: {
    title: string;
    description: string;
    viewDocumentation: string;
  };
  data: {
    title: string;
    description: string;
    clientId: string;
    keyName: string;
    secretKey: string;
    copyToClipboard: string;
  };
};

const ZELIFYKEYS_TRANSLATIONS: Record<Language, ZelifyKeysTranslations> = {
  en: {
    breadcrumb: "Zelify Keys",
    pageTitle: "Keys",
    clientId: {
      title: "Client ID",
      copyToClipboard: "Copy to clipboard",
    },
    zelifySecrets: {
      title: "Zelify Secrets",
      sandbox: "Sandbox",
      rotate: "Rotate",
      rotateConfirm: {
        title: "Are you sure you want to rotate?",
        yesRotate: "Yes, rotate",
        cancel: "Cancel",
        successMessage: "Key rotated successfully",
      },
      keyName: "Key Name",
      secretKey: "Secret Key",
      show: "Show",
      hide: "Hide",
      copyToClipboard: "Copy to clipboard",
      issuedOn: "Issued on",
      compromisedQuestion: "Has my API KEY been compromised?",
    },
    production: {
      title: "Production Secret",
      requestAccess: "Request access",
    },
    secureKeysInfo: {
      title: "Discover how Zelify creates and manages your keys",
      description: "Want to learn more about how Zelify creates and manages your keys? Click the button below.",
      viewDocumentation: "View documentation",
    },
    data: {
      title: "Copy all your access data",
      description: "Need to save or share your credentials? Click the button below to copy all access data (Client ID, Key Name and Secret Key) in JSON format to your clipboard.",
      clientId: "Client ID",
      keyName: "Key Name",
      secretKey: "Secret Key",
      copyToClipboard: "Copy to clipboard",
    },
  },
  es: {
    breadcrumb: "Zelify Keys",
    pageTitle: "Claves",
    clientId: {
      title: "ID de Cliente",
      copyToClipboard: "Copiar al portapapeles",
    },
    zelifySecrets: {
      title: "Secretos de Zelify",
      sandbox: "Sandbox",
      rotate: "Rotar",
      rotateConfirm: {
        title: "¿Estás seguro de que quieres rotar?",
        yesRotate: "Sí, rotar",
        cancel: "Cancelar",
        successMessage: "Clave rotada exitosamente",
      },
      keyName: "Nombre de Clave",
      secretKey: "Clave Secreta",
      show: "Mostrar",
      hide: "Ocultar",
      copyToClipboard: "Copiar al portapapeles",
      issuedOn: "Emitido el",
      compromisedQuestion: "¿Ha sido comprometida mi API KEY?",
    },
    production: {
      title: "Secreto de Producción",
      requestAccess: "Solicitar acceso",
    },
    secureKeysInfo: {
      title: "Descubre cómo Zelify crea y gestiona tus claves",
      description: "¿Quieres saber más sobre cómo Zelify crea y gestiona tus claves? Haz clic en el botón de abajo.",
      viewDocumentation: "Ver documentación",
    },
    data: {
      title: "Copiar todos tus datos de acceso",
      description: "¿Necesitas guardar o compartir tus credenciales? Haz clic en el botón de abajo para copiar todos los datos de acceso (ID de Cliente, Nombre de Clave y Clave Secreta) en formato JSON a tu portapapeles.",
      clientId: "Client ID",
      keyName: "Key Name",
      secretKey: "Secret Key",
      copyToClipboard: "Copiar al portapapeles",
    },
  },
};

export function useZelifyKeysTranslations() {
  return useLanguageTranslations(ZELIFYKEYS_TRANSLATIONS);
}

