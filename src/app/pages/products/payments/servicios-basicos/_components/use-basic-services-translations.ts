"use client";

import type { Language } from "@/contexts/language-context";
import { useLanguageTranslations } from "@/hooks/use-language-translations";

type BasicServicesTranslations = {
  pageTitle: string;
  previewTitle: string;
  config: {
    title: string;
    description: string;
    countryLabel: string;
    visibleCompaniesLabel: string;
    noCompaniesAvailable: string;
    regionNames: {
      ecuador: string;
      mexico: string;
      brasil: string;
      colombia: string;
      estados_unidos: string;
    };
  };
  preview: {
    animationAlt: string;
    screenLabelPrefix: string;
    logoAlt: string;
  };
  personalization: {
    title: string;
    themeLabel: string;
    lightMode: string;
    logoLabel: string;
    colorPaletteLabel: string;
    changeLogo: string;
    uploadLogo: string;
    logoHint: string;
    customColorTheme: string;
    invalidFileTypeMessage: string;
    fileTooLargeMessage: string;
    imageProcessingErrorMessage: string;
  };
  comingSoon: { title: string; description: string };
  searchPlaceholder: string;
  resultsLabel: string;
  noResults: string;
  favoritesLabel: string;
  popularLabel: string;
  screen1: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
  };
  providers: { comingSoonBannerTitle: string; comingSoonBannerDesc: string };
  backLabel: string;
  loading: { processing: string; waiting: string };
  success: { title: string; subtitle: string };
  wallet: { title: string; desc: string; totalBalanceLabel: string; depositButton: string; connectedServiceLabel: string; accountLinkedLabel?: string };
  deposit: { title: string; desc: string; selectAccountLabel: string; amountLabel: string; depositButton: string };
  credentials: {
    prompt: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    loginButton: string;
  };
  payment: { chooseMethodNote: string };
  paymentMethods?: {
    reference: { title: string; description: string; label: string; placeholder: string };
    phone: { title: string; description: string; label: string; placeholder: string };
    "phone-my-number": { title: string; description: string; label: string; placeholder: string };
  };
  paymentOptions?: {
    card: { title: string; subtitle: string };
    bank: { title: string; subtitle: string };
  };
  categories?: {
    telecom: string;
    electricity: string;
    water: string;
    government: string;
    gas: string;
  };
  modal: { selectOption: string };
  summary: {
    smallLabel: string;
    title: string;
    subtitle: string;
    referenceLabel: string;
    dueDateLabel: string;
    paymentMethodLabel: string;
    amountLabel: string;
  };
  invoice: {
    processedTitle: string;
    processedDesc: string;
    invoiceLabel: string;
    dueDateLabel: string;
    paymentMethodLabel: string;
    amountLabel: string;
  };
  aria?: { selectProvider: string };
  actions: { edit: string; confirm: string; continue?: string; share: string; finish: string; returnToList: string };
};

const BASIC_SERVICES_TRANSLATIONS: Record<Language, BasicServicesTranslations> = {
  en: {
    pageTitle: "Payments / Basic services",
    previewTitle: "Mobile Preview",
    config: {
      title: "Configuration",
      description: "Configure basic services connectivity",
      countryLabel: "Country",
      visibleCompaniesLabel: "Visible companies",
      noCompaniesAvailable: "No companies available.",
      regionNames: {
        ecuador: "Ecuador",
        mexico: "Mexico",
        brasil: "Brazil",
        colombia: "Colombia",
        estados_unidos: "United States",
      },
    },
    preview: {
      animationAlt: "Animation",
      screenLabelPrefix: "Screen",
      logoAlt: "Logo",
    },
    personalization: {
      title: "Custom Branding",
      themeLabel: "Theme",
      lightMode: "Light mode",
      logoLabel: "Logo (Light mode)",
      colorPaletteLabel: "Color Palette (Light mode)",
      changeLogo: "Change Logo",
      uploadLogo: "Upload Logo",
      logoHint: "Drag & drop an image, or click to select. Formats: PNG, JPG, SVG (max. 5MB)",
      customColorTheme: "Custom color",
      invalidFileTypeMessage: "Invalid file format. Please upload PNG, JPG, WEBP or SVG.",
      fileTooLargeMessage: "File too large. Maximum size is 5MB.",
      imageProcessingErrorMessage: "Error processing image. Please try again.",
    },
    comingSoon: { title: "Coming Soon", description: "Basic services connections for this country will be available soon" },
    searchPlaceholder: "Search providers...",
    resultsLabel: "Results",
    noResults: "No matches found",
    favoritesLabel: "Favorites",
    popularLabel: "Most popular",
    screen1: {
      title: "Services Payments",
      subtitle: "Which service would you like to pay?",
      searchPlaceholder: "Search banks...",
    },
    categories: {
      telecom: "Telecom & Internet",
      electricity: "Electricity",
      water: "Water",
      government: "Government & taxes",
      gas: "Gas",
    },
    providers: { comingSoonBannerTitle: "Coming Soon", comingSoonBannerDesc: "Basic services connections for this country will be available soon" },
    backLabel: "Back",
    loading: { processing: "Processing payment...", waiting: "This will take a few seconds" },
    success: { title: "Successfully connected!", subtitle: "Your service has been linked" },
    wallet: { title: "Wallet", desc: "Manage your funds", totalBalanceLabel: "Total Balance", depositButton: "Deposit Funds", connectedServiceLabel: "Connected service", accountLinkedLabel: "Account linked" },
    deposit: { title: "Deposit Funds", desc: "Select an account and enter amount", selectAccountLabel: "Select Account", amountLabel: "Amount", depositButton: "Deposit Funds" },
    credentials: {
      prompt: "Provide your credentials to connect this service",
      usernameLabel: "Username",
      usernamePlaceholder: "Enter your username",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      loginButton: "Sign in",
    },
    payment: { chooseMethodNote: "Choose the payment method on the next step." },
    modal: { selectOption: "Select an option" },
    summary: {
      smallLabel: "Summary",
      title: "Confirm payment",
      subtitle: "Review the details before continuing.",
      referenceLabel: "Reference",
      dueDateLabel: "Due date",
      paymentMethodLabel: "Payment method",
      amountLabel: "Amount",
    },
    invoice: {
      processedTitle: "Payment processed",
      processedDesc: "Your invoice is ready to download.",
      invoiceLabel: "Invoice",
      dueDateLabel: "Due date",
      paymentMethodLabel: "Payment method",
      amountLabel: "Amount",
    },
    aria: { selectProvider: "Select" },
    paymentMethods: {
      reference: {
        title: "Reference number",
        description: "Enter the reference number provided by the service.",
        label: "Reference number",
        placeholder: "e.g. 1234 5678 90",
      },
      phone: {
        title: "Enter phone number",
        description: "Enter the phone number associated with the account.",
        label: "Phone number",
        placeholder: "+52 55 1234 5678",
      },
      "phone-my-number": {
        title: "My phone number",
        description: "Use your registered phone number.",
        label: "Phone number",
        placeholder: "My number",
      },
    },
    paymentOptions: {
      card: { title: "Visa card **** 4242", subtitle: "Automatic payments enabled" },
      bank: { title: "Bank account **** 8899", subtitle: "Zelify Bank" },
    },
    actions: { edit: "Edit", confirm: "Confirm", continue: "Continue", share: "Share", finish: "Finish", returnToList: "Return to services list" },
  },
  es: {
    pageTitle: "Pagos / Servicios básicos",
    previewTitle: "Vista previa móvil",
    config: {
      title: "Configuración",
      description: "Configura la conectividad de servicios básicos",
      countryLabel: "País",
      visibleCompaniesLabel: "Empresas visibles",
      noCompaniesAvailable: "No hay empresas disponibles.",
      regionNames: {
        ecuador: "Ecuador",
        mexico: "México",
        brasil: "Brasil",
        colombia: "Colombia",
        estados_unidos: "Estados Unidos",
      },
    },
    preview: {
      animationAlt: "Animación",
      screenLabelPrefix: "Pantalla",
      logoAlt: "Logo",
    },
    personalization: {
      title: "Personalización",
      themeLabel: "Tema",
      lightMode: "Modo claro",
      logoLabel: "Logo (Modo claro)",
      colorPaletteLabel: "Paleta de colores (Modo claro)",
      changeLogo: "Cambiar logo",
      uploadLogo: "Subir logo",
      logoHint: "Arrastra y suelta una imagen, o haz clic para seleccionar. Formatos: PNG, JPG, SVG (máx. 5MB)",
      customColorTheme: "Color personalizado",
      invalidFileTypeMessage: "Formato de archivo inválido. Por favor usa PNG, JPG, WEBP o SVG.",
      fileTooLargeMessage: "Archivo muy grande. Máximo 5MB.",
      imageProcessingErrorMessage: "Error al procesar la imagen. Intenta de nuevo.",
    },
    comingSoon: { title: "Próximamente", description: "Las conexiones a servicios básicos para este país estarán disponibles pronto" },
    searchPlaceholder: "Buscar empresas...",
    resultsLabel: "Resultados",
    noResults: "No encontramos coincidencias",
    favoritesLabel: "Favoritos",
    popularLabel: "Más buscados",
    screen1: {
      title: "Pagos de Servicios",
      subtitle: "¿Qué servicio te gustaría pagar?",
      searchPlaceholder: "Buscar bancos...",
    },
    categories: {
      telecom: "Telefonía e internet",
      electricity: "Luz",
      water: "Agua",
      government: "Gobierno e impuestos",
      gas: "Gas",
    },
    providers: { comingSoonBannerTitle: "Próximamente", comingSoonBannerDesc: "Las conexiones a servicios básicos para este país estarán disponibles pronto" },
    backLabel: "Volver",
    loading: { processing: "Procesando pago...", waiting: "Esto tomará unos segundos" },
    success: { title: "¡Conectado correctamente!", subtitle: "Tu servicio ha sido vinculado" },
    wallet: { title: "Billetera", desc: "Gestiona tus fondos", totalBalanceLabel: "Saldo total", depositButton: "Depositar fondos", connectedServiceLabel: "Servicio conectado", accountLinkedLabel: "Cuenta vinculada" },
    deposit: { title: "Depositar fondos", desc: "Selecciona una cuenta e ingresa el monto", selectAccountLabel: "Seleccionar cuenta", amountLabel: "Monto", depositButton: "Depositar fondos" },
    credentials: {
      prompt: "Por favor proporciona tus credenciales para conectar este servicio",
      usernameLabel: "Usuario",
      usernamePlaceholder: "Ingresa tu usuario",
      passwordLabel: "Contraseña",
      passwordPlaceholder: "Ingresa tu contraseña",
      loginButton: "Ingresar",
    },
    payment: { chooseMethodNote: "Elige el método de pago en el siguiente paso." },
    modal: { selectOption: "Selecciona una opción" },
    summary: {
      smallLabel: "Resumen",
      title: "Confirma el pago",
      subtitle: "Revisa los detalles antes de continuar.",
      referenceLabel: "Referencia",
      dueDateLabel: "Fecha de vencimiento",
      paymentMethodLabel: "Método de pago",
      amountLabel: "Importe",
    },
    invoice: {
      processedTitle: "Pago procesado",
      processedDesc: "Tu factura está lista para descargar.",
      invoiceLabel: "Factura",
      dueDateLabel: "Fecha de vencimiento",
      paymentMethodLabel: "Método de pago",
      amountLabel: "Importe",
    },
    aria: { selectProvider: "Seleccionar" },
    paymentMethods: {
      reference: {
        title: "Número de referencia",
        description: "Ingresa el número de referencia proporcionado por el servicio.",
        label: "Número de referencia",
        placeholder: "Ej. 1234 5678 90",
      },
      phone: {
        title: "Ingresar número de teléfono",
        description: "Ingresa el número telefónico asociado a la cuenta.",
        label: "Número telefónico",
        placeholder: "+52 55 1234 5678",
      },
      "phone-my-number": {
        title: "Mi número de teléfono",
        description: "Usa tu número registrado para la línea.",
        label: "Número de teléfono",
        placeholder: "Mi número",
      },
    },
    paymentOptions: {
      card: { title: "Tarjeta Visa **** 4242", subtitle: "Pago automático habilitado" },
      bank: { title: "Cuenta bancaria **** 8899", subtitle: "Banco Zelify" },
    },
    actions: { edit: "Editar", confirm: "Confirmar", continue: "Continuar", share: "Compartir", finish: "Finalizar", returnToList: "Volver al listado de servicios" },
  },
};

export function useBasicServicesTranslations() {
  return useLanguageTranslations(BASIC_SERVICES_TRANSLATIONS);
}

export { BASIC_SERVICES_TRANSLATIONS };
